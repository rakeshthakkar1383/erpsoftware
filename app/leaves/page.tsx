import { createClient } from "@/lib/supabase/server"
import LeavesClient from "./leaves-client"

export const dynamic = "force-dynamic"

export default async function LeavesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  const role = user?.user_metadata?.role
  const currentUserId = user?.user_metadata?.student_id || user?.user_metadata?.teacher_id || null
  const currentUserType = role === "student" ? "student" : role === "teacher" ? "teacher" : null

  let lq = supabase.from("leaves").select("*").order("created_at", { ascending: false })
  let tq = supabase.from("leave_types").select("*").order("name")
  if (schoolId) { lq = lq.eq("school_id", schoolId); tq = tq.eq("school_id", schoolId) }

  if (currentUserId && currentUserType) {
    lq = lq.eq("applicant_type", currentUserType).eq("applicant_id", currentUserId)
  }

  let sq = supabase.from("school_info").select("id, school_name").order("school_name")
  let trq = supabase.from("trust_info").select("id, trust_name").order("trust_name")

  const [leaves, leaveTypes, schools, trusts] = await Promise.all([
    (await lq).data || [],
    (await tq).data || [],
    (await sq).data || [],
    (await trq).data || [],
  ])

  return (
    <LeavesClient
      initialLeaves={leaves}
      leaveTypes={leaveTypes}
      schools={schools}
      trusts={trusts}
      schoolId={schoolId}
      currentUserRole={role}
      currentUserType={currentUserType}
      currentUserId={currentUserId}
    />
  )
}
