import { createClient } from "@/lib/supabase/server"
import TeacherSubjectsClient from "./teacher-subjects-client"

export const dynamic = "force-dynamic"

export default async function TeacherSubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let tsq = supabase.from("teacher_subjects").select("*, teachers!teacher_id(full_name)").order("class_name").order("subject")
  let tq = supabase.from("teachers").select("id, full_name").order("full_name")
  if (schoolId) {
    tsq = tsq.eq("school_id", schoolId)
    tq = tq.eq("school_id", schoolId)
  }

  const [assignments, teachers] = await Promise.all([
    (await tsq).data || [],
    (await tq).data || [],
  ])

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <TeacherSubjectsClient initialAssignments={assignments} teachers={teachers} allSchools={allSchools || []} schoolId={schoolId} />
}
