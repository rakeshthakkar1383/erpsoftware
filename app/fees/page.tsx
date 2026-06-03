import { createClient } from "@/lib/supabase/server"
import FeesClient from "./fees-client"

export const dynamic = "force-dynamic"

export default async function FeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let fq = supabase.from("fees").select("*")
  let sq = supabase.from("students").select("*").order("full_name")
  let pq = supabase.from("fee_particulars").select("*")
  let fqtypes = supabase.from("fee_types").select("*").eq("is_active", true)
  let dq = supabase.from("divisions").select("*")
  let yq = supabase.from("academic_years").select("*")
  let tq = supabase.from("trust_info").select("*").order("trust_name")

  if (schoolId) {
    fq = fq.eq("school_id", schoolId)
    sq = sq.eq("school_id", schoolId)
    pq = pq.eq("school_id", schoolId)
    tq = tq.eq("school_id", schoolId)
  }

  const feesRes = await fq
  const studentsRes = await sq
  const particularsRes = await pq
  const feeTypesRes = await fqtypes
  const divisionsRes = await dq
  const yearsRes = await yq
  const trustsRes = await tq

  const fees = feesRes.data || []
  const students = studentsRes.data || []
  const particulars = particularsRes.data || []
  const feeTypes = feeTypesRes.data || []
  const divisions = divisionsRes.data || []
  const years = yearsRes.data || []
  const trusts = trustsRes.error ? [] : trustsRes.data || []

  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")

  const teacherClass = user?.user_metadata?.class_name || ""

  return (
    <FeesClient
      initialFees={fees.map((f: any) => ({
        ...f,
        payment_date: f.payment_date ? f.payment_date.split("T")[0] : null,
        particulars: typeof f.particulars === "string" ? JSON.parse(f.particulars) : (f.particulars || []),
      }))}
      students={students}
      particulars={particulars}
      feeTypes={feeTypes}
      divisions={divisions}
      years={years}
      allSchools={allSchools || []}
      schoolId={schoolId}
      teacherClass={teacherClass}
      trusts={trusts}
    />
  )
}
