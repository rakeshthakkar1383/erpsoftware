import { createClient } from "@/lib/supabase/server"
import FeeParticularsClient from "./fee-particulars-client"

export const dynamic = "force-dynamic"

export default async function FeeParticularsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  const { data } = await supabase.from("fee_particulars").select("*").order("class_name").order("particular_name")

  let feeTypeQuery = supabase.from("fee_types").select("*").eq("is_active", true)
  const { data: feeTypes } = await feeTypeQuery

  let tq = supabase.from("trust_info").select("*").order("trust_name")
  if (schoolId) tq = tq.eq("school_id", schoolId)
  const { data: trusts } = await tq

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <FeeParticularsClient initialParticulars={data || []} feeTypes={feeTypes || []} allSchools={allSchools || []} trusts={trusts || []} schoolId={schoolId} />
}
