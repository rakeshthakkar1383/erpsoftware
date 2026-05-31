"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTeachers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("teachers").select("*")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addTeacher(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("teachers").insert([raw])
  revalidatePath("/teachers")
  return { success: !error, message: error?.message || "Teacher added" }
}

export async function updateTeacher(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("teachers").update(raw).eq("id", id)
  revalidatePath("/teachers")
  return { success: !error, message: error?.message || "Teacher updated" }
}

export async function deleteTeacher(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("teachers").delete().eq("id", id)
  revalidatePath("/teachers")
  return { success: !error, message: error?.message || "Teacher deleted" }
}
