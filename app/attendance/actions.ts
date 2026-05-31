"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllAttendance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("attendance").select("*")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addAttendance(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("attendance").insert([raw])
  revalidatePath("/attendance")
  return { success: !error, message: error?.message || "Attendance added" }
}

export async function updateAttendance(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("attendance").update(raw).eq("id", id)
  revalidatePath("/attendance")
  return { success: !error, message: error?.message || "Attendance updated" }
}

export async function deleteAttendance(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("attendance").delete().eq("id", id)
  revalidatePath("/attendance")
  return { success: !error, message: error?.message || "Attendance deleted" }
}
