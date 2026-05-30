"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllSubjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("subjects").select("*").order("class_name").order("subject_name")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addSubject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("subjects").insert([raw])
  revalidatePath("/subjects")
  return { success: !error, message: error?.message || "Subject added" }
}

export async function updateSubject(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("subjects").update(raw).eq("id", id)
  revalidatePath("/subjects")
  return { success: !error, message: error?.message || "Subject updated" }
}

export async function deleteSubject(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("subjects").delete().eq("id", id)
  revalidatePath("/subjects")
  return { success: !error, message: error?.message || "Subject deleted" }
}
