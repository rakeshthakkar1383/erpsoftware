import { createClient } from "@/lib/supabase/server"
import StreamsClient from "./streams-client"

export const dynamic = "force-dynamic"

export default async function StreamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let query = supabase.from("streams").select("*").order("class_name").order("stream_name")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data } = await query

  return <StreamsClient initialStreams={data || []} />
}
