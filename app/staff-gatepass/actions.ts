"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addStaffGatepass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const raw: Record<string, any> = {}
  formData.forEach((v, k) => { raw[k] = v })

  const payload = {
    school_id: raw.school_id ? Number(raw.school_id) : user?.user_metadata?.school_id,
    teacher_id: raw.teacher_id ? Number(raw.teacher_id) : null,
    out_time: raw.out_time,
    in_time: raw.in_time || null,
    reason: raw.reason || null,
    permission_given_by: raw.permission_given_by || null,
    permission_signature: raw.permission_signature || null,
    staff_signature: raw.staff_signature || null,
    status: raw.status || "Active",
  }

  const { error } = await supabase.from("staff_gatepass").insert(payload)

  if (error) return { success: false, message: error.message }
  revalidatePath("/staff-gatepass")
  return { success: true, message: "Staff gatepass created successfully" }
}

export async function updateStaffGatepass(id: number, formData: FormData) {
  const supabase = await createClient()

  const raw: Record<string, any> = {}
  formData.forEach((v, k) => { raw[k] = v })

  const payload: Record<string, any> = {}
  if (raw.teacher_id) payload.teacher_id = Number(raw.teacher_id)
  if (raw.out_time) payload.out_time = raw.out_time
  if (raw.in_time !== undefined) payload.in_time = raw.in_time || null
  if (raw.reason !== undefined) payload.reason = raw.reason
  if (raw.permission_given_by !== undefined) payload.permission_given_by = raw.permission_given_by
  if (raw.permission_signature !== undefined) payload.permission_signature = raw.permission_signature
  if (raw.staff_signature !== undefined) payload.staff_signature = raw.staff_signature
  if (raw.status) payload.status = raw.status

  const { error } = await supabase.from("staff_gatepass").update(payload).eq("id", id)

  if (error) return { success: false, message: error.message }
  revalidatePath("/staff-gatepass")
  return { success: true, message: "Staff gatepass updated successfully" }
}

export async function deleteStaffGatepass(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("staff_gatepass").delete().eq("id", id)

  if (error) return { success: false, message: error.message }
  revalidatePath("/staff-gatepass")
  return { success: true, message: "Staff gatepass deleted successfully" }
}

export async function uploadPhoto(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File
  const field = formData.get("field") as string || "staff_photo"
  if (!file) return { success: false, message: "No file provided" }

  const ext = file.name.split(".").pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path = `staff-gatepass/${field}/${filename}`

  const { error } = await supabase.storage.from("school-files").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) return { success: false, message: error.message }

  const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
  return { success: true, url: publicUrl }
}
