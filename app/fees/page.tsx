import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/lib/supabase/fetch-all"
import FeesClient from "./fees-client"

export const dynamic = "force-dynamic"

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const preSelectedStudentId = params.student_id ? String(params.student_id) : ""
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  const fees = await fetchAllRows(supabase, (q) => {
    let b = q.from("fees").select("*").order("id", { ascending: true })
    if (schoolId) b = b.eq("school_id", schoolId)
    return b
  })
  const students = await fetchAllRows(supabase, (q) => {
    let b = q.from("students").select("*").order("full_name").order("id")
    if (schoolId) b = b.eq("school_id", schoolId)
    return b
  })
  const particularsRes = await supabase.from("fee_particulars").select("*")
  const feeTypesRes = await supabase.from("fee_types").select("*").eq("is_active", true)
  const divisionsRes = await supabase.from("divisions").select("*")
  const yearsRes = await supabase.from("academic_years").select("*")
  const trustsRes = await supabase.from("trust_info").select("*").order("trust_name")

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
      preSelectedStudentId={preSelectedStudentId}
    />
  )
}
