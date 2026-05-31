"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllExams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("exams").select("*")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addExam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("exams").insert([raw])
  revalidatePath("/exams")
  return { success: !error, message: error?.message || "Exam added" }
}

export async function updateExam(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("exams").update(raw).eq("id", id)
  revalidatePath("/exams")
  return { success: !error, message: error?.message || "Exam updated" }
}

export async function deleteExam(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("exams").delete().eq("id", id)
  revalidatePath("/exams")
  return { success: !error, message: error?.message || "Exam deleted" }
}
