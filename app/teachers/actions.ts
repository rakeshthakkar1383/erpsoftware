"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTeachers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("teachers").select("*, school_info!school_id(school_name)")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addTeacher(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  
  if (raw.salary) raw.salary = Number(raw.salary)
  if (raw.basic_pay) raw.basic_pay = Number(raw.basic_pay)
  if (raw.grade_pay) raw.grade_pay = Number(raw.grade_pay)

  const { error } = await supabase.from("teachers").insert([raw])
  revalidatePath("/teachers")
  return { success: !error, message: error?.message || "Teacher added" }
}

export async function updateTeacher(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  
  if (raw.salary) raw.salary = Number(raw.salary)
  if (raw.basic_pay) raw.basic_pay = Number(raw.basic_pay)
  if (raw.grade_pay) raw.grade_pay = Number(raw.grade_pay)

  delete raw.id
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
