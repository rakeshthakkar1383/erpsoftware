"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllLeaveTypes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("leave_types").select("*").order("name")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function getAllLeaves() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("leaves").select("*").order("created_at", { ascending: false })
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function getAllStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("students").select("id, full_name, class_name, division").order("full_name")
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

export async function getAllSchools() {
  const supabase = await createClient()
  const { data } = await supabase.from("school_info").select("id, school_name").order("school_name")
  return data || []
}

export async function getAllTrusts() {
  const supabase = await createClient()
  const { data } = await supabase.from("trust_info").select("id, trust_name").order("trust_name")
  return data || []
}

export async function addLeave(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.applicant_id) raw.applicant_id = Number(raw.applicant_id)
  if (raw.leave_type_id) raw.leave_type_id = Number(raw.leave_type_id)
  if (raw.days) raw.days = Number(raw.days)
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  const { error } = await supabase.from("leaves").insert([raw])
  revalidatePath("/leaves")
  revalidatePath("/leaves/student")
  revalidatePath("/leaves/teacher")
  return { success: !error, message: error?.message || "Leave applied" }
}

export async function updateLeaveStatus(id: number, status: string, remarks: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("leaves").update({ status, remarks }).eq("id", id)
  revalidatePath("/leaves")
  revalidatePath("/leaves/student")
  revalidatePath("/leaves/teacher")
  return { success: !error, message: error?.message || "Leave updated" }
}

export async function deleteLeave(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("leaves").delete().eq("id", id)
  revalidatePath("/leaves")
  revalidatePath("/leaves/student")
  revalidatePath("/leaves/teacher")
  return { success: !error, message: error?.message || "Leave deleted" }
}
