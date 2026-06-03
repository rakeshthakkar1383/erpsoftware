"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTrusts() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.from("trust_info").select("*").order("trust_name")
    if (error) {
      console.error("getAllTrusts error", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("getAllTrusts exception", error)
    return []
  }
}

export async function addTrust(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  if (!raw.school_id) {
    const { data: schools } = await supabase.from("school_info").select("id").limit(1)
    if (schools && schools.length > 0) raw.school_id = schools[0].id
  }
  if (!raw.school_id) {
    return { success: false, message: "No school found. Please create a school first." }
  }
  const { error } = await supabase.from("trust_info").insert([raw])
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust added" }
}

export async function updateTrust(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  const { error } = await supabase.from("trust_info").update(raw).eq("id", id)
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust updated" }
}

export async function deleteTrust(id: number) {
  const supabase = await createClient()
  const { data: trust } = await supabase.from("trust_info").select("logo_url").eq("id", id).single()
  if (trust?.logo_url) {
    const path = trust.logo_url.split("/school-files/").pop()
    if (path) await supabase.storage.from("school-files").remove([path])
  }
  const { error } = await supabase.from("trust_info").delete().eq("id", id)
  revalidatePath("/trust-info")
  return { success: !error, message: error?.message || "Trust deleted" }
}
