import { createClient } from "@/lib/supabase/server"
import TimetableClient from "./timetable-client"

export const dynamic = "force-dynamic"

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let tq = supabase
    .from("timetables")
    .select("*, subjects!subject_id(subject_name), teachers!teacher_id(full_name)")
    .order("class_name")
    .order("day")
    .order("period_no")

  let sq = supabase.from("subjects").select("id, class_name, subject_name").order("class_name").order("subject_name")
  let teq = supabase.from("teachers").select("id, full_name").order("full_name")

  if (schoolId) {
    tq = tq.eq("school_id", Number(schoolId))
    sq = sq.eq("school_id", Number(schoolId))
    teq = teq.eq("school_id", Number(schoolId))
  }

  const [entries, subjects, teachers, { data: allSchools }] = await Promise.all([
    (await tq).data || [],
    (await sq).data || [],
    (await teq).data || [],
    supabase.from("school_info").select("id, school_name").order("school_name"),
  ])

  return (
    <TimetableClient
      initialEntries={entries}
      subjects={subjects}
      teachers={teachers}
      allSchools={allSchools || []}
      schoolId={schoolId ? Number(schoolId) : null}
    />
  )
}
