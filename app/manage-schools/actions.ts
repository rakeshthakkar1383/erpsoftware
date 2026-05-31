"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllSchools() {
  const supabase = await createClient()
  const { data } = await supabase.from("school_info").select("*").order("school_name")
  return data || []
}

export async function addSchool(formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })

  const { data, error } = await supabase.from("school_info").insert([raw]).select("id").single()
  if (!error && data?.id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.auth.updateUser({
        data: { ...user.user_metadata, school_id: data.id }
      })
    }
  }
  revalidatePath("/", "layout")
  return { success: !error, message: error?.message || "School created", schoolId: data?.id }
}

export async function deleteSchool(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("school_info").delete().eq("id", id)
  revalidatePath("/manage-schools")
  return { success: !error, message: error?.message || "School deleted" }
}

export async function updateSchoolById(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  const { error } = await supabase.from("school_info").update(raw).eq("id", id)
  revalidatePath("/manage-schools")
  return { success: !error, message: error?.message || "School updated" }
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
