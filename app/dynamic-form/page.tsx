import { createClient } from "@/lib/supabase/server"
import { getSchoolInfo } from "@/app/school-info/actions"
import DynamicFormClient from "./dynamic-form-client"

export const dynamic = "force-dynamic"

export default async function DynamicFormPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id
  const schoolInfo = await getSchoolInfo()

  return <DynamicFormClient initialInfo={schoolInfo} schoolId={schoolId} />
}
