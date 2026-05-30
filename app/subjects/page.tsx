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

  return <SubjectsClient initialSubjects={data || []} />
}
