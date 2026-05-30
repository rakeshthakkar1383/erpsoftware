"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllAcademicYears() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("academic_years").select("*").order("year_name", { ascending: false })
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
  return data || []
}

export async function addAcademicYear(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.is_active === "true") {
    await supabase.from("academic_years").update({ is_active: false }).eq("school_id", user?.user_metadata?.school_id)
  }
  raw.is_active = raw.is_active === "true"
  if (user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  const { error } = await supabase.from("academic_years").insert([raw])
  revalidatePath("/academic-years")
  return { success: !error, message: error?.message || "Academic year added" }
}

export async function updateAcademicYear(id: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.is_active === "true") {
    await supabase.from("academic_years").update({ is_active: false }).eq("school_id", user?.user_metadata?.school_id)
  }
  raw.is_active = raw.is_active === "true"
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

export async function promoteStudents(fromYearId: number, toYearId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  // 1. Fetch all students from the source year
  const { data: sourceStudents, error: fetchError } = await supabase
    .from("students")
    .select("*")
    .eq("academic_year_id", fromYearId)
    .eq("school_id", schoolId)

  if (fetchError) return { success: false, message: fetchError.message }
  if (!sourceStudents || sourceStudents.length === 0) return { success: false, message: "No students found in source year" }

  // 2. Prepare promoted students
  const promotedStudents = sourceStudents.map(s => {
    const { id, created_at, ...rest } = s
    let nextClass = rest.class_name
    if (!isNaN(Number(rest.class_name))) {
      const num = Number(rest.class_name)
      if (num < 12) nextClass = String(num + 1)
      else nextClass = "PASSED OUT" // or stay 12, but requirements say +1
    }

    return {
      ...rest,
      academic_year_id: toYearId,
      class_name: nextClass,
      roll_no: null // Reset roll_no so it can be re-assigned or set manually
    }
  }).filter(s => s.class_name !== "PASSED OUT")

  if (promotedStudents.length === 0) return { success: true, message: "All students have completed class 12" }

  // 3. Bulk insert into target year
  const { error: insertError } = await supabase.from("students").insert(promotedStudents)
  
  revalidatePath("/students")
  return { success: !insertError, message: insertError?.message || `Promoted ${promotedStudents.length} students` }
}
