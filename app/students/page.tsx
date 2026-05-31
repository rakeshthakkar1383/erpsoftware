import { createClient } from "@/lib/supabase/server"
import StudentsClient from "./students-client"

export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let studentsQuery = supabase.from("students").select("*")
  let divisionsQuery = supabase.from("divisions").select("*")
  let streamsQuery = supabase.from("streams").select("*")
  let yearsQuery = supabase.from("academic_years").select("*")

  if (schoolId) {
    studentsQuery = studentsQuery.eq("school_id", schoolId)
    divisionsQuery = divisionsQuery.eq("school_id", schoolId)
    streamsQuery = streamsQuery.eq("school_id", schoolId)
    yearsQuery = yearsQuery.eq("school_id", schoolId)
  }

  const [students, divisions, streams, years] = await Promise.all([
    studentsQuery.then(r => r.data || []),
    divisionsQuery.then(r => r.data || []),
    streamsQuery.then(r => r.data || []),
    yearsQuery.then(r => r.data || []),
  ])

  let schoolName = ""
  let schoolLogo = ""
  if (schoolId) {
    const { data: school } = await supabase.from("school_info").select("school_name, logo_url").eq("id", schoolId).single()
    schoolName = school?.school_name || ""
    schoolLogo = school?.logo_url || ""
  }

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  const teacherClass = user?.user_metadata?.class_name || ""

  return (
    <StudentsClient
      students={students}
      divisions={divisions}
      streams={streams}
      years={years}
      allSchools={allSchools || []}
      teacherClass={teacherClass}
      schoolId={schoolId}
      schoolName={schoolName}
      schoolLogo={schoolLogo}
    />
  )
}
