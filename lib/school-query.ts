import type { SupabaseClient } from "@supabase/supabase-js"

export function filterBySchool(query: any, schoolId: number | null | undefined) {
  if (schoolId) {
    return query.eq("school_id", schoolId)
  }
  return query
}

export function getSchoolId(user: { school_id?: number | null } | null): number | null {
  return user?.school_id ?? null
}
