import { createClient } from "@/lib/supabase/server"
import AttendanceClient from "./attendance-client"

export const dynamic = "force-dynamic"

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let aq = supabase.from("attendance").select("*")
  let sq = supabase.from("students").select("*").order("full_name")
  let dq = supabase.from("divisions").select("*")
  if (schoolId) { aq = aq.eq("school_id", schoolId); sq = sq.eq("school_id", schoolId) }

  const [attendance, students, divisions] = await Promise.all([
    (await aq).data || [], (await sq).data || [], (await dq).data || [],
  ])

  return <AttendanceClient initialRecords={attendance} students={students} divisions={divisions} teacherClass={user?.user_metadata?.class_name || ""} />
}
