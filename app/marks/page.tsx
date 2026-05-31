import { createClient } from "@/lib/supabase/server"
import MarksClient from "./marks-client"

export const dynamic = "force-dynamic"

export default async function MarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let mq = supabase.from("marks").select("*")
  let sq = supabase.from("students").select("*").order("full_name")
  let eq = supabase.from("exams").select("*")
  let dq = supabase.from("divisions").select("*")
  let tq = supabase.from("teacher_subjects").select("*, teachers!teacher_subjects_teacher_id_fkey(full_name)")
  if (schoolId) { mq = mq.eq("school_id", schoolId); sq = sq.eq("school_id", schoolId) }

  const [marks, students, exams, divisions, teacherSubjects] = await Promise.all([
    (await mq).data || [], (await sq).data || [], (await eq).data || [], (await dq).data || [], (await tq).data || [],
  ])

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <MarksClient initialMarks={marks} students={students} exams={exams} divisions={divisions} teacherSubjects={teacherSubjects} allSchools={allSchools || []} schoolId={schoolId} teacherClass={user?.user_metadata?.class_name || ""} />
}
