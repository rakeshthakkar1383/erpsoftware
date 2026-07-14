import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const env: Record<string, string> = {}
envContent.split("\n").forEach(line => {
  const parts = line.split("=")
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const val = parts.slice(1).join("=").trim()
    env[key] = val
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or service role key in env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: students, error } = await supabase
    .from("students")
    .select("id, full_name, roll_no, school_id, academic_year_id, class_name, division, gender, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
  
  if (error) {
    console.error("Error fetching students:", error)
  } else {
    console.log("Most recent 10 students in DB:")
    console.log(JSON.stringify(students, null, 2))
  }
}

run()
