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
  const { data: years, error } = await supabase
    .from("academic_years")
    .select("*")
  
  if (error) {
    console.error("Error fetching academic_years:", error)
  } else {
    console.log("Academic years in DB:")
    console.log(JSON.stringify(years, null, 2))
  }
}

run()
