import { createClient } from "@/lib/supabase/server"
import StudentGatepassClient from "./student-gatepass-client"

export const dynamic = "force-dynamic"

export default async function StudentGatepassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("student_gatepass").select("*, students(full_name, gr_no, class_name, photo_url)").order("created_at", { ascending: false })
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data: gatepasses } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name, logo_url").order("school_name")

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, gr_no, class_name, photo_url")
    .order("full_name")

  const currentSchool = allSchools?.find(s => s.id === schoolId) || null

  return (
    <StudentGatepassClient
      initialData={gatepasses || []}
      allSchools={allSchools || []}
      students={students || []}
      schoolId={schoolId}
      currentSchool={currentSchool}
    />
  )
}
