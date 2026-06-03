"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getFilteredCount(filters: {
  school_id?: number
  academic_year_id?: number
  class_name?: string
  division?: string
  stream?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("students").select("id", { count: "exact", head: true })

  const schoolId = filters.school_id || user?.user_metadata?.school_id
  if (schoolId) query = query.eq("school_id", schoolId)
  if (filters.academic_year_id) query = query.eq("academic_year_id", filters.academic_year_id)
  if (filters.class_name) query = query.eq("class_name", filters.class_name)
  if (filters.division) query = query.eq("division", filters.division)
  if (filters.stream) query = query.eq("stream", filters.stream)

  const { count } = await query
  return count || 0
}

export async function migrateStudents(
  source: {
    school_id?: number
    academic_year_id?: number
    class_name?: string
    division?: string
    stream?: string
  },
  target: {
    academic_year_id?: number
    class_name?: string
    division?: string
    stream?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Unauthorized" }

  const schoolId = source.school_id || user?.user_metadata?.school_id
  if (!schoolId) return { success: false, message: "School not found" }

  let query = supabase.from("students").update({})
  const conditions: any[] = []

  if (source.academic_year_id) conditions.push({ field: "academic_year_id", value: source.academic_year_id })
  if (source.class_name) conditions.push({ field: "class_name", value: source.class_name })
  if (source.division) conditions.push({ field: "division", value: source.division })
  if (source.stream) conditions.push({ field: "stream", value: source.stream })

  let builder: any = supabase.from("students").update({}).eq("school_id", schoolId)
  for (const c of conditions) {
    builder = builder.eq(c.field, c.value)
  }

  const updateData: any = {}
  if (target.academic_year_id) updateData.academic_year_id = target.academic_year_id
  if (target.class_name !== undefined) updateData.class_name = target.class_name
  if (target.division !== undefined) updateData.division = target.division
  if (target.stream !== undefined) updateData.stream = target.stream

  if (Object.keys(updateData).length === 0) {
    return { success: false, message: "No target fields selected" }
  }

  const { data, error } = await builder.update(updateData).select("id")
  if (error) return { success: false, message: error.message }

  revalidatePath("/student-migration")
  revalidatePath("/students")
  return { success: true, message: `${data?.length || 0} students migrated successfully`, count: data?.length || 0 }
}
