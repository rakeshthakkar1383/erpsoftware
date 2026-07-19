import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

const allowedEntities = ["students", "teachers", "fees", "attendance", "exams", "marks"]

export async function POST(request: NextRequest, { params }: { params: { entity: string } }) {
  const { entity } = params
  if (!allowedEntities.includes(entity)) {
    return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 })
  }

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error("Excel import auth lookup failed:", error)
  }
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

    // Cache resolved active academic years by school_id to avoid redundant queries
    const activeYearCache: Record<number, number | null> = {}

    const getActiveYearForSchool = async (sId: number): Promise<number | null> => {
      if (activeYearCache[sId] !== undefined) {
        return activeYearCache[sId]
      }
      try {
        const { data: activeYear } = await supabase
          .from("academic_years")
          .select("id")
          .eq("school_id", sId)
          .eq("is_active", true)
          .maybeSingle()
        activeYearCache[sId] = activeYear?.id ? Number(activeYear.id) : null
      } catch (e) {
        console.error(`Failed to query active academic year for school ${sId}:`, e)
        activeYearCache[sId] = null
      }
      return activeYearCache[sId]
    }

    const errors: string[] = []
    let imported = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Clean up row keys: trim strings, remove empty/null/placeholder values
      for (const key of Object.keys(row)) {
        if (typeof row[key] === "string") {
          row[key] = row[key].trim()
        }
        const valStr = String(row[key]).toLowerCase()
        if (
          row[key] === null ||
          row[key] === undefined ||
          row[key] === "" ||
          valStr === "null" ||
          valStr === "n/a" ||
          valStr === "none" ||
          valStr === "nil" ||
          valStr === "undefined"
        ) {
          delete row[key]
        }
      }

      // If the row contains absolutely no values, skip it
      if (Object.keys(row).length === 0) {
        continue
      }

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

      // Set fallback academic_year_id for students if not provided and school_id is available
      if (entity === "students" && !row.academic_year_id && row.school_id) {
        const activeYrId = await getActiveYearForSchool(Number(row.school_id))
        if (activeYrId) {
          row.academic_year_id = activeYrId
        }
      }

      // Normalize fields specifically for students
      if (entity === "students") {
        if (row.class_name) {
          const cls = String(row.class_name).toLowerCase()
          if (cls === "balvatika") {
            row.class_name = "Balvatika"
          } else {
            const match = cls.match(/\d+/)
            if (match) {
              const num = parseInt(match[0], 10)
              if (num >= 1 && num <= 12) {
                row.class_name = String(num)
              }
            }
          }
        }
        if (row.gender) {
          const g = String(row.gender).toUpperCase()
          if (g === "M" || g === "MALE") row.gender = "MALE"
          else if (g === "F" || g === "FEMALE") row.gender = "FEMALE"
        }
        if (row.division) {
          row.division = String(row.division).toUpperCase()
        }
      }

      // Normalize teachers
      if (entity === "teachers") {
        if (row.gender) {
          const g = String(row.gender).toUpperCase()
          if (g === "M" || g === "MALE") row.gender = "MALE"
          else if (g === "F" || g === "FEMALE") row.gender = "FEMALE"
        }
      }

      // Normalize students - check for duplicate GR numbers
      if (entity === "students" && row.gr_no && row.gr_no.toString().trim()) {
        const grNo = row.gr_no.toString().trim()
        const { data: existingGr } = await supabase
          .from("students")
          .select("id")
          .eq("gr_no", grNo)
          .limit(1)
        if (existingGr && existingGr.length > 0) {
          errors.push(`Row ${i + 2}: GR No "${grNo}" already exists for another student`)
          continue
        }
        row.gr_no = grNo
      }

      // Convert known numeric/bigint fields to numbers to prevent database cast errors
      const numericFields = ["school_id", "roll_no", "academic_year_id", "student_id", "exam_id", "amount", "marks", "salary", "basic_pay", "grade_pay"]
      for (const field of numericFields) {
        if (row[field] !== undefined && row[field] !== null) {
          const parsed = Number(row[field])
          if (!isNaN(parsed)) {
            row[field] = parsed
          }
        }
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
