import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const envPath = path.resolve(process.cwd(), ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const env: Record<string, string> = {}
envContent.split("\n").forEach(line => {
  const parts = line.split("=")
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc("get_policies", {}) // If get_policies function exists, or query directly
  
  // Let's run a direct SQL query via supabase RPC or inspect table status by reading schema info.
  // Actually, we can run a query to select RLS status of all tables.
  const { data: rlsStatus, error: rlsError } = await supabase
    .from("academic_years")
    .select("id")
    .limit(1)
  console.log("Service role select academic_years:", rlsStatus, rlsError)
  
  // Let's check RLS status using postgres metadata
  const { data: tables, error: tablesError } = await supabase
    .rpc("check_rls_enabled") // If custom RPC exists
  
  // Since we can write direct SQL, let's see if we can do a query on pg_tables
  const { data: pgTables, error: pgError } = await supabase
    .from("academic_years")
    .select("*")
  console.log("pgTables:", pgTables, pgError)
}

run()
