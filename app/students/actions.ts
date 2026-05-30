"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("students").select("*, school_info!students_school_id_fkey(school_name)")
  if (user?.user_metadata?.school_id) {
    query = query.eq("school_id", user.user_metadata.school_id)
  }
  const { data } = await query
  return data || []
}

export async function addStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id

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

  const { error } = await supabase.from("students").insert([raw])
  revalidatePath("/students")
  return { success: !error, message: error?.message || "Student added" }
}

export async function updateStudent(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
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
