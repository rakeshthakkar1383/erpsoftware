"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllSchools() {
  const supabase = await createClient()
  const { data } = await supabase.from("school_info").select("*").order("school_name")
  return data || []
}

export async function addSchool(formData: FormData) {
  try {
    const supabase = await createClient()
    const raw: any = {}
    formData.forEach((v, k) => { if (v && v !== "null") raw[k] = v })

    const { data, error } = await supabase.from("school_info").insert([raw]).select("id").single()
    if (error) throw error

    if (data?.id) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: { ...user.user_metadata, school_id: data.id }
        })
      }
    }
    revalidatePath("/", "layout")
    return { success: true, message: "School created successfully", schoolId: data?.id }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to create school" }
  }
}

export async function deleteSchool(id: number) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("school_info").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/manage-schools")
    return { success: true, message: "School deleted successfully" }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to delete school" }
  }
}

export async function updateSchoolById(id: number, formData: FormData) {
  try {
    const supabase = await createClient()
    const raw: any = {}
    formData.forEach((v, k) => { if (v && v !== "null") raw[k] = v })
    delete raw.id
    
    const { error } = await supabase.from("school_info").update(raw).eq("id", id)
    if (error) throw error
    
    revalidatePath("/manage-schools")
    return { success: true, message: "School updated successfully" }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to update school" }
  }
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
