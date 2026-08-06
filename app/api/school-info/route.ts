import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data: schools } = await supabase
    .from("school_info")
    .select("id, school_name, trust_name, address, logo_url")
    .order("school_name")

  const { data: trusts } = await supabase
    .from("trust_info")
    .select("id, trust_name, address, logo_url, school_id")
    .order("trust_name")

  const trustMap = new Map<number, any>()
  ;(trusts || []).forEach((trust: any) => {
    if (trust.school_id) trustMap.set(Number(trust.school_id), trust)
  })

  const mapped = (schools || []).map((school: any) => {
    const relatedTrust = school.id ? trustMap.get(Number(school.id)) : null
    return {
      ...school,
      trust_name: relatedTrust?.trust_name || school.trust_name || "",
      address: relatedTrust?.address || school.address || "",
      logo_url: school.logo_url || relatedTrust?.logo_url || "",
    }
  })

  return NextResponse.json(mapped || [])
}
