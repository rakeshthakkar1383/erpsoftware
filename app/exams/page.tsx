import { createClient } from "@/lib/supabase/server"
import ExamsClient from "./exams-client"

export const dynamic = "force-dynamic"

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <ExamsClient allSchools={allSchools || []} schoolId={schoolId} />
}
