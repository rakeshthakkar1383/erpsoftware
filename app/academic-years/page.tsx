import { createClient } from "@/lib/supabase/server"
import AcademicYearsClient from "./academic-years-client"

export const dynamic = "force-dynamic"

export default async function AcademicYearsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("academic_years").select("*").order("year_name", { ascending: false })
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  return <AcademicYearsClient initialYears={data || []} />
}
