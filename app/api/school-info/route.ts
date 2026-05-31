import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from("school_info").select("id, school_name").order("school_name")
  return NextResponse.json(data || [])
}
