import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("school_info").select("id, school_name").order("school_name")
  return NextResponse.json(data || [])
}
