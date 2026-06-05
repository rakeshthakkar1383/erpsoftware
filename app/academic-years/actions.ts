"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllAcademicYears() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("academic_years").select("*").order("start_date", { ascending: false })
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addAcademicYear(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  if (raw.is_active === "true") {
    const { data: existing } = await supabase.from("academic_years").select("id").eq("school_id", raw.school_id).eq("is_active", true)
    if (existing?.length) await supabase.from("academic_years").update({ is_active: false }).eq("school_id", raw.school_id)
  }
  raw.is_active = raw.is_active === "true"
  const { error } = await supabase.from("academic_years").insert([raw])
  revalidatePath("/academic-years")
  return { success: !error, message: error?.message || "Academic year added" }
}

export async function updateAcademicYear(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (raw.is_active) raw.is_active = true
  if (raw.is_active === "true") {
    const { data: { user } } = await supabase.auth.getUser()
    const schoolId = raw.school_id || user?.user_metadata?.school_id
    const { data: existing } = await supabase.from("academic_years").select("id").eq("school_id", schoolId).eq("is_active", true).neq("id", id)
    if (existing?.length) await supabase.from("academic_years").update({ is_active: false }).eq("school_id", schoolId)
    raw.is_active = true
  } else {
    delete raw.is_active
  }
  const { error } = await supabase.from("academic_years").update(raw).eq("id", id)
  revalidatePath("/academic-years")
  return { success: !error, message: error?.message || "Academic year updated" }
}

export async function deleteAcademicYear(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("academic_years").delete().eq("id", id)
  revalidatePath("/academic-years")
  return { success: !error, message: error?.message || "Academic year deleted" }
}
