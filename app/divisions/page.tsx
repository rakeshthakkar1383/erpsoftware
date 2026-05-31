import { createClient } from "@/lib/supabase/server"
import DivisionsClient from "./divisions-client"

export const dynamic = "force-dynamic"

export default async function DivisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let dq = supabase.from("divisions").select("*, teachers!class_teacher_id(full_name)").order("class_name").order("division_name")
  let tq = supabase.from("teachers").select("id, full_name").order("full_name")
  if (schoolId) {
    dq = dq.eq("school_id", schoolId)
    tq = tq.eq("school_id", schoolId)
  }

  const [divisions, teachers] = await Promise.all([
    (await dq).data || [],
    (await tq).data || [],
  ])

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <DivisionsClient initialDivisions={divisions} teachers={teachers} allSchools={allSchools || []} schoolId={schoolId} />
}
