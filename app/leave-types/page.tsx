import { createClient } from "@/lib/supabase/server"
import LeaveTypesClient from "./leave-types-client"

export const dynamic = "force-dynamic"

export default async function LeaveTypesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("leave_types").select("*").order("name")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <LeaveTypesClient initialData={data || []} allSchools={allSchools || []} schoolId={schoolId} />
}
