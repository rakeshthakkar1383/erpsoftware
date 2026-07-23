import { createClient } from "@/lib/supabase/server"
import StaffGatepassClient from "./staff-gatepass-client"

export const dynamic = "force-dynamic"

export default async function StaffGatepassPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error("Staff gatepass page auth lookup failed:", error)
  }
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("staff_gatepass").select("*, teachers(full_name, subject, mobile, photo_url, designation, staff_code)").order("created_at", { ascending: false })
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data: gatepasses } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name, logo_url, address").order("school_name")

  let teacherQuery = supabase.from("teachers").select("id, full_name, subject, mobile, photo_url, designation, staff_code").order("full_name")
  if (schoolId) teacherQuery = teacherQuery.eq("school_id", schoolId)
  const { data: teachers } = await teacherQuery

  const currentSchool = allSchools?.find(s => s.id === schoolId) || null

  return (
    <StaffGatepassClient
      initialData={gatepasses || []}
      allSchools={allSchools || []}
      teachers={teachers || []}
      schoolId={schoolId}
      currentSchool={currentSchool}
    />
  )
}
