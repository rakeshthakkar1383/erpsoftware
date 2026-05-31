import { createClient } from "@/lib/supabase/server"
import SubjectsClient from "./subjects-client"

export const dynamic = "force-dynamic"

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("subjects").select("*").order("class_name").order("subject_name")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <SubjectsClient initialSubjects={data || []} allSchools={allSchools || []} schoolId={schoolId} />
}
