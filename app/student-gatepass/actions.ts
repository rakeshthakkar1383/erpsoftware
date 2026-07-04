"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addGatepass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const raw: Record<string, any> = {}
  formData.forEach((v, k) => { raw[k] = v })

  const payload = {
    school_id: raw.school_id ? Number(raw.school_id) : user?.user_metadata?.school_id,
    student_id: raw.student_id ? Number(raw.student_id) : null,
    visitor_name: raw.visitor_name,
    visitor_mobile: raw.visitor_mobile || null,
    visitor_relation: raw.visitor_relation || null,
    visitor_vehicle_no: raw.visitor_vehicle_no || null,
    visitor_town_village: raw.visitor_town_village || null,
    gatepass_date: raw.gatepass_date,
    reason: raw.reason || null,
    visitor_photo_url: raw.visitor_photo_url || null,
    visitor_signature: raw.visitor_signature || null,
    permission_given_by: raw.permission_given_by || null,
    permission_signature: raw.permission_signature || null,
    status: "Active",
  }

  const { error } = await supabase.from("student_gatepass").insert(payload)

  if (error) return { success: false, message: error.message }
  revalidatePath("/student-gatepass")
  return { success: true, message: "Gatepass created successfully" }
}

export async function updateGatepass(id: number, formData: FormData) {
  const supabase = await createClient()

  const raw: Record<string, any> = {}
  formData.forEach((v, k) => { raw[k] = v })

  const payload: Record<string, any> = {}
  if (raw.student_id) payload.student_id = Number(raw.student_id)
  if (raw.visitor_name) payload.visitor_name = raw.visitor_name
  if (raw.visitor_mobile) payload.visitor_mobile = raw.visitor_mobile
  if (raw.visitor_relation) payload.visitor_relation = raw.visitor_relation
  if (raw.visitor_vehicle_no) payload.visitor_vehicle_no = raw.visitor_vehicle_no
  if (raw.visitor_town_village) payload.visitor_town_village = raw.visitor_town_village
  if (raw.gatepass_date) payload.gatepass_date = raw.gatepass_date
  if (raw.reason) payload.reason = raw.reason
  if (raw.visitor_photo_url) payload.visitor_photo_url = raw.visitor_photo_url
  if (raw.visitor_signature) payload.visitor_signature = raw.visitor_signature
  if (raw.permission_given_by) payload.permission_given_by = raw.permission_given_by
  if (raw.permission_signature) payload.permission_signature = raw.permission_signature

  const { error } = await supabase.from("student_gatepass").update(payload).eq("id", id)

  if (error) return { success: false, message: error.message }
  revalidatePath("/student-gatepass")
  return { success: true, message: "Gatepass updated successfully" }
}

export async function deleteGatepass(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("student_gatepass").delete().eq("id", id)

  if (error) return { success: false, message: error.message }
  revalidatePath("/student-gatepass")
  return { success: true, message: "Gatepass deleted successfully" }
}

export async function uploadPhoto(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File
  const field = formData.get("field") as string || "visitor_photo"
  if (!file) return { success: false, message: "No file provided" }

  const ext = file.name.split(".").pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path = `gatepass/${field}/${filename}`

  const { error } = await supabase.storage.from("school-files").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) return { success: false, message: error.message }

  const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
  return { success: true, url: publicUrl }
}
