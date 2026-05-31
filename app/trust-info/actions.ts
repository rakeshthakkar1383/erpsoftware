"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTrusts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let q = supabase.from("trust_info").select("*").order("trust_name")
  if (user?.user_metadata?.school_id) q = q.eq("school_id", user.user_metadata.school_id)
  const { data } = await q
  return data || []
}

export async function addTrust(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  const { error } = await supabase.from("trust_info").insert([raw])
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust added" }
}

export async function updateTrust(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("trust_info").update(raw).eq("id", id)
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust updated" }
}

export async function deleteTrust(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("trust_info").delete().eq("id", id)
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust deleted" }
}
