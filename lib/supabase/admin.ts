import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase Dashboard > Project Settings > API > service_role key")
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
