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

export async function bulkAddDivisions(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const schoolIdRaw = formData.get("school_id") as string
  let schoolId: number | null = null
  if (schoolIdRaw) schoolId = Number(schoolIdRaw)
  else if (user?.user_metadata?.school_id) schoolId = Number(user.user_metadata.school_id)

  const classNames = JSON.parse(formData.get("class_names") as string || "[]") as string[]
  const divisionNames = JSON.parse(formData.get("division_names") as string || "[]") as string[]

  if (classNames.length === 0 || divisionNames.length === 0) {
    return { success: false, message: "Select at least one class and one division" }
  }

  const records = classNames.flatMap(cls =>
    divisionNames.map(div => ({
      class_name: cls,
      division_name: div.toUpperCase(),
      school_id: schoolId,
    }))
  )

  const { data: existing, error: fetchError } = await supabase
    .from("divisions")
    .select("class_name, division_name, school_id")
    .in("class_name", classNames)
    .in("division_name", divisionNames.map(d => d.toUpperCase()))

  if (fetchError) return { success: false, message: fetchError.message }

  const existingSet = new Set(
    (existing || []).map((r: any) => `${r.class_name}|${r.division_name}|${r.school_id}`)
  )

  const newRecords = records.filter(r => !existingSet.has(`${r.class_name}|${r.division_name}|${r.school_id}`))

  if (newRecords.length === 0) {
    return { success: false, message: "All selected divisions already exist" }
  }

  const { error } = await supabase.from("divisions").insert(newRecords)
  revalidatePath("/divisions")
  return {
    success: !error,
    message: error?.message || `${newRecords.length} Division(s) created (${records.length - newRecords.length} duplicates skipped)`
  }
}
