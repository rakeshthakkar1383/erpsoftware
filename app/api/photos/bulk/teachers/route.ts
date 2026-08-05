import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schoolId = user.user_metadata?.school_id

  const formData = await request.formData()
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return NextResponse.json({ error: "No photos provided" }, { status: 400 })

  let query = supabase.from("teachers").select("id, full_name, staff_code, school_id, photo_url")
  if (schoolId) query = query.eq("school_id", schoolId)
  const { data: teachers, error: teacherError } = await query
  if (teacherError) return NextResponse.json({ error: teacherError.message }, { status: 500 })

  const byCode = new Map<string, any>()
  for (const t of teachers || []) {
    if (t.staff_code) byCode.set(String(t.staff_code).trim().toLowerCase(), t)
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
    const match = byCode.get(base)
    if (!match) {
      results.unmatched.push({ filename: file.name, reason: "No teacher found with that staff code" })
      continue
    }

    const path = `teachers/photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`
    const { error: uploadError } = await supabase.storage.from("school-files").upload(path, file, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadError) {
      errors.push(`${file.name}: upload failed (${uploadError.message})`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
    const { error: updateError } = await supabase.from("teachers").update({ photo_url: publicUrl }).eq("id", match.id)
    if (updateError) {
      errors.push(`${file.name}: ${updateError.message}`)
      continue
    }

    results.uploaded++
    results.matched++
  }

  return NextResponse.json({ ...results, errors: errors.length ? errors : null })
}
