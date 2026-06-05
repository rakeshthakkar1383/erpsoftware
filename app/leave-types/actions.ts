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

export async function addLeaveType(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  if (raw.max_days) raw.max_days = Number(raw.max_days)
  else delete raw.max_days
  const { error } = await supabase.from("leave_types").insert([raw])
  revalidatePath("/leave-types")
  return { success: !error, message: error?.message || "Leave type added" }
}

export async function updateLeaveType(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (raw.max_days) raw.max_days = Number(raw.max_days)
  else delete raw.max_days
  const { error } = await supabase.from("leave_types").update(raw).eq("id", id)
  revalidatePath("/leave-types")
  return { success: !error, message: error?.message || "Leave type updated" }
}

export async function deleteLeaveType(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("leave_types").delete().eq("id", id)
  revalidatePath("/leave-types")
  return { success: !error, message: error?.message || "Leave type deleted" }
}
