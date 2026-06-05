import { createClient } from "@/lib/supabase/server"
import MarksheetClient from "./marksheet-client"
import { getMarksheetData } from "./actions"

export const dynamic = "force-dynamic"

export default async function MarksheetPage() {
  const data = await getMarksheetData()
  return <MarksheetClient data={data} />
}

