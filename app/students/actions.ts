"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllStudents(page = 1, pageSize = 25, filters: any = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let query = supabase.from("students").select("*", { count: "exact" })
  
  if (user?.user_metadata?.school_id && !filters.school_id) {
    query = query.eq("school_id", user.user_metadata.school_id)
  }
  
  if (filters.school_id) {
    query = query.eq("school_id", filters.school_id)
  }
  if (filters.class_name) {
    query = query.eq("class_name", filters.class_name)
  }
  if (filters.division) {
    query = query.eq("division", filters.division)
  }
  if (filters.stream) {
    query = query.eq("stream", filters.stream)
  }
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,gr_no.ilike.%${filters.search}%,father_name.ilike.%${filters.search}%,mother_name.ilike.%${filters.search}%`)
  }

  query = query.order("class_name").order("roll_no")
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query
  
  if (error) throw error
  
  return {
    data: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function getStudentsGrouped(groupBy: "school_id" | "class_name", filters: any = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let query = supabase.from("students").select("*")
  
  if (user?.user_metadata?.school_id && !filters.school_id) {
    query = query.eq("school_id", user.user_metadata.school_id)
  }
  
  if (filters.school_id) query = query.eq("school_id", filters.school_id)
  if (filters.class_name) query = query.eq("class_name", filters.class_name)
  if (filters.division) query = query.eq("division", filters.division)
  if (filters.stream) query = query.eq("stream", filters.stream)
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,gr_no.ilike.%${filters.search}%,father_name.ilike.%${filters.search}%,mother_name.ilike.%${filters.search}%`)
  }

  query = query.order("class_name").order("roll_no")
  
  const { data, error } = await query
  if (error) throw error

  const grouped: Record<string, any[]> = {}
  for (const s of (data || [])) {
    const key = String(s[groupBy] || "unknown")
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  }
  return grouped
}

export async function addStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  
  if (!raw.school_id) delete raw.school_id

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
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  
  if (!raw.school_id) delete raw.school_id

  if (raw.roll_no) raw.roll_no = Number(raw.roll_no)
  else delete raw.roll_no
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
