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

  const schoolId = user.user_metadata?.school_id

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, any>[]

    if (rows.length === 0) return NextResponse.json({ imported: 0, errors: ["No rows found"] })

    const errors: string[] = []
    let imported = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (schoolId) row.school_id = schoolId

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
