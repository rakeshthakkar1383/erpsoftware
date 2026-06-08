import { createClient } from "@/lib/supabase/server"
import AdmissionClient from "./admission-client"

export const dynamic = "force-dynamic"

export default async function AdmissionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let schoolId: number | null = null
  let schoolName = "ADMISSION ENTRY"
  let schoolLogo = ""

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, school:schools(name, logo)")
    .eq("id", user?.id)
    .single()

  if (profile?.school_id) {
    schoolId = profile.school_id
    if (profile.school) {
      schoolName = (profile.school as any).name || schoolName
      schoolLogo = (profile.school as any).logo || ""
    }
  }

  const { data: years } = await supabase
    .from("academic_years")
    .select("*")
    .order("is_active", { ascending: false })

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId ?? 0)
    .order("full_name")

  return (
    <AdmissionClient
      students={students || []}
      years={years || []}
      schoolId={schoolId}
      schoolName={schoolName}
      schoolLogo={schoolLogo}
    />
  )
}
