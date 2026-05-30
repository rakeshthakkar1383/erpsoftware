"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSchoolInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  if (!schoolId) return null
  const { data } = await supabase.from("school_info").select("*").eq("id", schoolId).single()
  return data
}
export async function getAllSchools() {
  const supabase = await createClient()
  const { data } = await supabase.from("school_info").select("*").order("school_name")
  return data || []
}

export async function addSchool(formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })

  const { error } = await supabase.from("school_info").insert([raw])
  revalidatePath("/school-info")
  return { success: !error, message: error?.message || "School created" }
}

export async function deleteSchool(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("school_info").delete().eq("id", id)
  revalidatePath("/school-info")
  return { success: !error, message: error?.message || "School deleted" }
}

export async function switchSchool(schoolId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, school_id: schoolId }
  })

  revalidatePath("/", "layout")
  return { success: !error, message: error?.message || "School switched" }
}

export async function updateSchoolInfo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  if (!schoolId) return { success: false, message: "No school ID" }

  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })

  const { error } = await supabase.from("school_info").update(raw).eq("id", schoolId)
  revalidatePath("/school-info")
  return { success: !error, message: error?.message || "School info updated" }
}
