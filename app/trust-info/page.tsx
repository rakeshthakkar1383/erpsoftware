import { createClient } from "@/lib/supabase/server"
import TrustInfoClient from "./trust-info-client"

export const dynamic = "force-dynamic"

export default async function TrustInfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id ? Number(user.user_metadata.school_id) : null
  return <TrustInfoClient schoolId={schoolId} />
}
