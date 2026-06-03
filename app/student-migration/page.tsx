import { createClient } from "@/lib/supabase/server"
import StudentMigrationClient from "./student-migration-client"

export const dynamic = "force-dynamic"

export default async function StudentMigrationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let divisionsQuery = supabase.from("divisions").select("*")
  let streamsQuery = supabase.from("streams").select("*")
  let yearsQuery = supabase.from("academic_years").select("*")

  if (schoolId) {
    divisionsQuery = divisionsQuery.eq("school_id", schoolId)
    streamsQuery = streamsQuery.eq("school_id", schoolId)
    yearsQuery = yearsQuery.eq("school_id", schoolId)
  }

  const [divisions, streams, years] = await Promise.all([
    divisionsQuery.then(r => r.data || []),
    streamsQuery.then(r => r.data || []),
    yearsQuery.then(r => r.data || []),
  ])

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return (
    <StudentMigrationClient
      divisions={divisions}
      streams={streams}
      years={years}
      allSchools={allSchools || []}
      userSchoolId={schoolId}
    />
  )
}
