"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllStreams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("streams").select("*").order("class_name").order("stream_name")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addStream(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("streams").insert([raw])
  revalidatePath("/streams")
  return { success: !error, message: error?.message || "Stream added" }
}

export async function updateStream(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("streams").update(raw).eq("id", id)
  revalidatePath("/streams")
  return { success: !error, message: error?.message || "Stream updated" }
}

export async function deleteStream(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("streams").delete().eq("id", id)
  revalidatePath("/streams")
  return { success: !error, message: error?.message || "Stream deleted" }
}
