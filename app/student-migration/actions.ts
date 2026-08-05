"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const NEXT_CLASS: Record<string, string> = {
  Balvatika: "1",
  "1": "2",
  "2": "3",
  "3": "4",
  "4": "5",
  "5": "6",
  "6": "7",
  "7": "8",
  "8": "9",
  "9": "10",
  "10": "11",
  "11": "12",
}

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

type PromoteFilters = {
  school_id?: number
  academic_year_id?: number
  class_name?: string
  division?: string
  stream?: string
}

async function fetchPromotableCandidates(filters: PromoteFilters, selectFields: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const schoolId = filters.school_id || user?.user_metadata?.school_id
  if (!schoolId) return null

  const out: any[] = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    let q: any = supabase
      .from("students")
      .select(selectFields)
      .eq("school_id", schoolId)
      .range(from, from + pageSize - 1)
    if (filters.academic_year_id) q = q.eq("academic_year_id", filters.academic_year_id)
    if (filters.class_name) q = q.eq("class_name", filters.class_name)
    if (filters.division) q = q.eq("division", filters.division)
    if (filters.stream) q = q.eq("stream", filters.stream)
    const { data, error } = await q
    if (error) return null
    out.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return out
}

export async function getPromotableCount(filters: PromoteFilters) {
  const rows = await fetchPromotableCandidates(filters, "class_name")
  if (!rows) return 0
  return rows.filter(s => NEXT_CLASS[s.class_name]).length
}

export async function getPromotableStudents(filters: PromoteFilters, limit = 200) {
  const rows = await fetchPromotableCandidates(filters, "id, full_name, gr_no, roll_no, class_name, division")
  if (!rows) return []
  return rows
    .filter(s => NEXT_CLASS[s.class_name])
    .slice(0, limit)
    .map(s => ({ ...s, next_class: NEXT_CLASS[s.class_name] }))
}

export async function promoteStudents(
  source: PromoteFilters,
  targetAcademicYearId: number,
  transferDate: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Unauthorized" }

  const schoolId = source.school_id || user?.user_metadata?.school_id
  if (!schoolId) return { success: false, message: "School not found" }
  if (!targetAcademicYearId) return { success: false, message: "Select target academic year" }
  if (!transferDate) return { success: false, message: "Select transfer date" }

  const students = await fetchPromotableCandidates(source, "id, class_name")
  if (!students) return { success: false, message: "Failed to load students" }

  const byNextClass: Record<string, number[]> = {}
  const skipped = new Set<string>()
  for (const s of students) {
    const next = NEXT_CLASS[s.class_name]
    if (!next) {
      skipped.add(s.class_name || "Unknown")
      continue
    }
    if (!byNextClass[next]) byNextClass[next] = []
    byNextClass[next].push(s.id)
  }

  const total = Object.values(byNextClass).reduce((a, b) => a + b.length, 0)
  if (total === 0) {
    return { success: false, message: "No promotable students found (Class 12 and unclassified students are skipped)" }
  }

  let updated = 0
  for (const [nextClass, ids] of Object.entries(byNextClass)) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { data, error: upErr } = await supabase
        .from("students")
        .update({ class_name: nextClass, academic_year_id: targetAcademicYearId, transfer_date: transferDate })
        .in("id", chunk)
        .select("id")
      if (upErr) return { success: false, message: upErr.message }
      updated += (data || []).length
    }
  }

  revalidatePath("/student-migration")
  revalidatePath("/students")
  return {
    success: true,
    message: `${updated} students promoted to next class`,
    count: updated,
    skipped: Array.from(skipped),
  }
}
