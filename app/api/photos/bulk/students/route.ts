import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const MATCH_FIELDS = ["auto", "gr_no", "roll_no", "admission_no"]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schoolId = user.user_metadata?.school_id

  const formData = await request.formData()
  const matchBy = String(formData.get("match_by") || "auto")
  if (!MATCH_FIELDS.includes(matchBy)) {
    return NextResponse.json({ error: `Invalid match_by. Use: ${MATCH_FIELDS.join(", ")}` }, { status: 400 })
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return NextResponse.json({ error: "No photos provided" }, { status: 400 })

  let query = supabase.from("students").select("id, full_name, gr_no, roll_no, admission_no, school_id, photo_url")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data: students, error: studentError } = await query
  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 })

  const byGr = new Map<string, any>()
  const byRoll = new Map<string, any>()
  const byAdmission = new Map<string, any>()
  for (const s of students || []) {
    if (s.gr_no) byGr.set(String(s.gr_no).trim().toLowerCase(), s)
    if (s.roll_no !== null && s.roll_no !== undefined && String(s.roll_no).trim()) byRoll.set(String(s.roll_no).trim().toLowerCase(), s)
    if (s.admission_no) byAdmission.set(String(s.admission_no).trim().toLowerCase(), s)
  }

  const results: { uploaded: number; matched: number; unmatched: { filename: string; reason: string }[] } = {
    uploaded: 0,
    matched: 0,
    unmatched: [],
  }
  const errors: string[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    if (!IMAGE_MIME.includes(file.type)) {
      results.unmatched.push({ filename: file.name, reason: `Unsupported file type: ${file.type || "unknown"}` })
      continue
    }

    const base = file.name.replace(/\.[^.]+$/, "").trim().toLowerCase()
    let match: any = null
    if (matchBy === "gr_no") match = byGr.get(base)
    else if (matchBy === "roll_no") match = byRoll.get(base)
    else if (matchBy === "admission_no") match = byAdmission.get(base)
    else match = byGr.get(base) || byAdmission.get(base) || byRoll.get(base)

    if (!match) {
      results.unmatched.push({ filename: file.name, reason: "No student found with that identifier" })
      continue
    }

    const path = `students/photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`
    const { error: uploadError } = await supabase.storage.from("school-files").upload(path, file, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadError) {
      errors.push(`${file.name}: upload failed (${uploadError.message})`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
    const { error: updateError } = await supabase.from("students").update({ photo_url: publicUrl }).eq("id", match.id)
    if (updateError) {
      errors.push(`${file.name}: ${updateError.message}`)
      continue
    }

    results.uploaded++
    results.matched++
  }

  return NextResponse.json({ ...results, errors: errors.length ? errors : null })
}
