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
  let dq = supabase.from("divisions").select("*")
  let yq = supabase.from("academic_years").select("*")
  let tq = supabase.from("trust_info").select("*").order("trust_name")

  if (schoolId) {
    fq = fq.eq("school_id", schoolId)
    sq = sq.eq("school_id", schoolId)
    pq = pq.eq("school_id", schoolId)
  }

  const [fees, students, particulars, divisions, years, trusts] = await Promise.all([
    (await fq).data || [],
    (await sq).data || [],
    (await pq).data || [],
    (await dq).data || [],
    (await yq).data || [],
    (await tq).data || [],
  ])

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
      divisions={divisions}
      years={years}
      allSchools={allSchools || []}
      schoolId={schoolId}
      teacherClass={teacherClass}
      trusts={trusts}
    />
  )
}
