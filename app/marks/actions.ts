"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllMarks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("marks").select("*")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addMark(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("marks").insert([raw])
  revalidatePath("/marks")
  return { success: !error, message: error?.message || "Mark added" }
}

export async function updateMark(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("marks").update(raw).eq("id", id)
  revalidatePath("/marks")
  return { success: !error, message: error?.message || "Mark updated" }
}

export async function deleteMark(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("marks").delete().eq("id", id)
  revalidatePath("/marks")
  return { success: !error, message: error?.message || "Mark deleted" }
}
