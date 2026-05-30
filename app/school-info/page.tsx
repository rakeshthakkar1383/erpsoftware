import { createClient } from "@/lib/supabase/server"
import SchoolInfoClient from "./school-info-client"

export const dynamic = "force-dynamic"

export default async function SchoolInfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  const role = user?.user_metadata?.role

  let info = null
  if (schoolId) {
    const { data } = await supabase.from("school_info").select("*").eq("id", schoolId).single()
    info = data
  }

  return <SchoolInfoClient initialInfo={info} schoolId={schoolId} role={role} />
}
