import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

const allowedEntities = ["students", "teachers", "fees", "attendance", "exams", "marks"]

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params
  if (!allowedEntities.includes(entity)) {
    return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schoolIdFromMetadata = user.user_metadata?.school_id

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const explicitSchoolId = formData.get("school_id")
    
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const schoolId = explicitSchoolId ? Number(explicitSchoolId) : schoolIdFromMetadata

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: "yyyy-mm-dd" }) as Record<string, any>[]

    if (rows.length === 0) return NextResponse.json({ imported: 0, errors: ["No rows found"] })

    const errors: string[] = []
    let imported = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Resolve school_name to school_id (case-insensitive)
      if (row.school_name) {
        const { data: school } = await supabase.from("school_info").select("id").ilike("school_name", row.school_name).maybeSingle()
        if (school?.id) row.school_id = school.id
        else errors.push(`Row ${i + 2}: School "${row.school_name}" not found`)
        delete row.school_name
      }
      if (!row.school_id && schoolId) {
        row.school_id = schoolId
      }
      
      // Fallback for fees/marks if schoolId still missing
      if (!row.school_id && (entity === "fees" || entity === "marks") && row.student_id) {
         const { data: student } = await supabase.from("students").select("school_id").eq("id", row.student_id).single()
         if (student?.school_id) row.school_id = student.school_id
      }

      const { error } = await supabase.from(entity as any).insert([row])
      if (error) {
        errors.push(`Row ${i + 2}: ${error.message}`)
      } else {
        imported++
      }
    }

    return NextResponse.json({ imported, errors, errorDetails: errors.length > 0 ? errors.join("; ") : null })
  } catch (err: any) {
    console.error(`Excel Import Error (${entity}):`, err)
    return NextResponse.json({ error: `Import failed: ${err.message || "Unknown error"}` }, { status: 500 })
  }
}
