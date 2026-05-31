import { createClient } from "@/lib/supabase/server"
import FeeParticularsClient from "./fee-particulars-client"

export const dynamic = "force-dynamic"

export default async function FeeParticularsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("fee_particulars").select("*").order("class_name").order("particular_name")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <FeeParticularsClient initialParticulars={data || []} allSchools={allSchools || []} schoolId={schoolId} />
}
