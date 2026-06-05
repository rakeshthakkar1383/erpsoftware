import { createClient } from "@/lib/supabase/server"
import AcademicYearsClient from "./academic-years-client"

export const dynamic = "force-dynamic"

export default async function AcademicYearsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("academic_years").select("*").order("start_date", { ascending: false })
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <AcademicYearsClient initialData={data || []} allSchools={allSchools || []} schoolId={schoolId} />
}
