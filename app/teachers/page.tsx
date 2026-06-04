import { createClient } from "@/lib/supabase/server"
import TeachersClient from "./teachers-client"

export const dynamic = "force-dynamic"

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")
  const { data: allSubjects } = await supabase.from("subjects").select("*").order("subject_name")
  const { data: allTrusts } = await supabase.from("trust_info").select("id, trust_name, school_id").order("trust_name")

  return <TeachersClient allSchools={allSchools || []} schoolId={schoolId} allSubjects={allSubjects || []} allTrusts={allTrusts || []} />
}
