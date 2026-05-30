"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllFeeParticulars() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("fee_particulars").select("*").order("class_name").order("particular_name")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addFeeParticular(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("fee_particulars").insert([raw])
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular added" }
}

export async function updateFeeParticular(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("fee_particulars").update(raw).eq("id", id)
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular updated" }
}

export async function deleteFeeParticular(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fee_particulars").delete().eq("id", id)
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular deleted" }
}
