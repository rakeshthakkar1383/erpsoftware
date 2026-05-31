import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: schools } = await supabase.from("school_info").select("id, school_name").order("school_name")
  const { data: students } = await supabase.from("students").select("*")
  const { data: divisions } = await supabase.from("divisions").select("*, teachers!divisions_class_teacher_id_fkey(full_name)")
  const { data: fees } = await supabase.from("fees").select("*")
  const { data: teachers } = await supabase.from("teachers").select("*")

  const teacherClass = user?.user_metadata?.class_name || ""
  const schoolId = user?.user_metadata?.school_id

  return (
    <DashboardClient
      user={user}
      schools={schools || []}
      students={students || []}
      divisions={divisions || []}
      fees={fees || []}
      teachers={teachers || []}
      teacherClass={teacherClass}
      defaultSchoolId={schoolId ? Number(schoolId) : null}
    />
  )
}
