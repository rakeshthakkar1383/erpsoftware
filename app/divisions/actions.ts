"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllDivisions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("divisions").select("*, school_info(school_name)").order("class_name").order("division_name")
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

export async function addDivision(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id

  const names = (raw.division_name || "").split(",").map((s: string) => s.trim()).filter(Boolean)
  if (names.length === 0) return { success: false, message: "At least one division name is required" }

  const records = names.map((name: string) => ({
    class_name: raw.class_name,
    division_name: name.toUpperCase(),
    school_id: raw.school_id,
  }))

  const { error } = await supabase.from("divisions").insert(records)
  revalidatePath("/divisions")
  return { success: !error, message: error?.message || `${names.length} Division(s) added` }
}

export async function updateDivision(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.class_teacher_id === "") raw.class_teacher_id = null
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  const { error } = await supabase.from("divisions").update(raw).eq("id", id)
  revalidatePath("/divisions")
  return { success: !error, message: error?.message || "Division updated" }
}

export async function deleteDivision(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("divisions").delete().eq("id", id)
  revalidatePath("/divisions")
  return { success: !error, message: error?.message || "Division deleted" }
}
