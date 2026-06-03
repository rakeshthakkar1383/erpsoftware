import { createClient } from "@/lib/supabase/server"
import FeeTypesClient from "./fee-types-client"

export const dynamic = "force-dynamic"

export default async function FeeTypesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  const { data } = await supabase.from("fee_types").select("*").order("sort_order").order("name")

  let tq = supabase.from("trust_info").select("*").order("trust_name")
  if (schoolId) tq = tq.eq("school_id", schoolId)
  const { data: trusts } = await tq

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  return <FeeTypesClient initialFeeTypes={data || []} allSchools={allSchools || []} trusts={trusts || []} schoolId={schoolId} />
}
