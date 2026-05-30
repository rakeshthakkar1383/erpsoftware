"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTeacherSubjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("teacher_subjects").select("*, teachers!teacher_id(full_name)").order("class_name").order("subject")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function getAllTeachers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("teachers").select("id, full_name").order("full_name")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addTeacherSubject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("teacher_subjects").insert([raw])
  revalidatePath("/teacher-subjects")
  return { success: !error, message: error?.message || "Teacher subject assignment added" }
}

export async function updateTeacherSubject(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("teacher_subjects").update(raw).eq("id", id)
  revalidatePath("/teacher-subjects")
  return { success: !error, message: error?.message || "Teacher subject assignment updated" }
}

export async function deleteTeacherSubject(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("teacher_subjects").delete().eq("id", id)
  revalidatePath("/teacher-subjects")
  return { success: !error, message: error?.message || "Teacher subject assignment deleted" }
}
