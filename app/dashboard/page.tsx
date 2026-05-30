import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: students } = await supabase.from("students").select("*")
  const { data: divisions } = await supabase.from("divisions").select("*, teachers!divisions_class_teacher_id_fkey(full_name)")
  const { data: fees } = await supabase.from("fees").select("*")

  const teacherClass = user?.user_metadata?.class_name || ""
  const schoolId = user?.user_metadata?.school_id
  const { data: school } = schoolId
    ? await supabase.from("school_info").select("school_name").eq("id", schoolId).single()
    : { data: null }

  const safe = (data: any, fallback: any = []) => (data as any[]) || fallback

  return (
    <DashboardClient
      user={user}
      students={safe(students)}
      divisions={safe(divisions)}
      fees={safe(fees)}
      teacherClass={teacherClass}
      schoolName={school?.school_name || ""}
    />
  )
}
