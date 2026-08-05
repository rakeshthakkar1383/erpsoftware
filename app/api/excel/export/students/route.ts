import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

const STUDENT_COLUMNS: { header: string; key: string }[] = [
  { header: "GR No", key: "gr_no" },
  { header: "Roll No", key: "roll_no" },
  { header: "Admission No", key: "admission_no" },
  { header: "Student Name", key: "full_name" },
  { header: "Gender", key: "gender" },
  { header: "DOB", key: "dob" },
  { header: "Class", key: "class_name" },
  { header: "Division", key: "division" },
  { header: "Stream", key: "stream" },
  { header: "Father Name", key: "father_name" },
  { header: "Father Mobile", key: "father_mobile" },
  { header: "Mother Name", key: "mother_name" },
  { header: "Mother Mobile", key: "mother_mobile" },
  { header: "Mobile", key: "mobile" },
  { header: "Address", key: "address" },
  { header: "Village", key: "village" },
  { header: "District", key: "district" },
  { header: "Pincode", key: "pincode" },
  { header: "Category", key: "category" },
  { header: "Last School", key: "last_school" },
  { header: "Aadhar No", key: "aadhar_no" },
]

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get("school_id") || user.user_metadata?.school_id || ""
  const className = searchParams.get("class_name") || ""
  const division = searchParams.get("division") || ""
  const stream = searchParams.get("stream") || ""
  const search = searchParams.get("search") || ""

  let query = supabase
    .from("students")
    .select("*, school_info!students_school_id_fkey(school_name)")
    .order("class_name")
    .order("roll_no")
    .order("division")

  if (schoolId) query = query.eq("school_id", Number(schoolId))
  if (className) query = query.eq("class_name", className)
  if (division) query = query.eq("division", division)
  if (stream) query = query.eq("stream", stream)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,gr_no.ilike.%${search}%,father_name.ilike.%${search}%,mother_name.ilike.%${search}%`)
  }

  const { data: students, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!students || students.length === 0) {
    return NextResponse.json({ error: "No students found for the selected filters" }, { status: 404 })
  }

  const rowFor = (s: any) => {
    const row: Record<string, any> = { "School": s.school_info?.school_name || "" }
    for (const col of STUDENT_COLUMNS) {
      row[col.header] = s[col.key] !== null && s[col.key] !== undefined ? s[col.key] : ""
    }
    return row
  }

  const wb = XLSX.utils.book_new()

  const groupByClass = (rows: any[]) => {
    const grouped: Record<string, any[]> = {}
    for (const r of rows) {
      const key = `Class ${r["Class"]}`.trim() || "Unknown"
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(r)
    }
    return grouped
  }

  if (className) {
    const rows = students.map(rowFor)
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, `Class ${className}`.slice(0, 31))
    const filename = `students_class_${className}${division ? `_${division}` : ""}.xlsx`
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  const rows = students.map(rowFor)
  const grouped = groupByClass(rows)

  const summary: any[] = []
  for (const [cls, list] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
    const ws = XLSX.utils.json_to_sheet(list)
    XLSX.utils.book_append_sheet(wb, ws, cls.slice(0, 31))
    summary.push({ "Class": cls.replace("Class ", ""), "Students": list.length })
  }

  const wsSummary = XLSX.utils.json_to_sheet(summary)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "All Students")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students_class_wise_${Date.now()}.xlsx"`,
    },
  })
}
