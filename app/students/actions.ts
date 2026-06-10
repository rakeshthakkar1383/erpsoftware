"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("students").select("*")
  if (user?.user_metadata?.school_id) {
    query = query.eq("school_id", user.user_metadata.school_id)
  }
  query = query.order("class_name").order("roll_no")
  const { data } = await query
  return data || []
}

export async function addStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id

  if (!raw.roll_no && raw.class_name) {
    const { data: existing } = await supabase
      .from("students")
      .select("roll_no")
      .eq("class_name", raw.class_name)
      .eq("division", raw.division || "")
      .order("roll_no", { ascending: false })
      .limit(1)
    const maxRoll = existing && existing.length > 0 ? (existing[0].roll_no || 0) : 0
    raw.roll_no = maxRoll + 1
  }

  if (raw.roll_no) raw.roll_no = Number(raw.roll_no)
  else delete raw.roll_no
  if (raw.academic_year_id) raw.academic_year_id = Number(raw.academic_year_id)
  else delete raw.academic_year_id
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (!raw.dob) raw.dob = null

  const { data: inserted, error } = await supabase.from("students").insert([raw]).select("id")
  revalidatePath("/students")
  const studentId = inserted && inserted.length > 0 ? inserted[0].id : null
  return { success: !error, message: error?.message || "Student added", studentId }
}

export async function updateStudent(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.roll_no) raw.roll_no = Number(raw.roll_no)
  else delete raw.roll_no
  if (raw.academic_year_id) raw.academic_year_id = Number(raw.academic_year_id)
  else delete raw.academic_year_id
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (!raw.dob) raw.dob = null
  delete raw.id
  const { error } = await supabase.from("students").update(raw).eq("id", id)
  revalidatePath("/students")
  return { success: !error, message: error?.message || "Student updated" }
}

export async function deleteStudent(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("students").delete().eq("id", id)
  revalidatePath("/students")
  return { success: !error, message: error?.message || "Student deleted" }
}
