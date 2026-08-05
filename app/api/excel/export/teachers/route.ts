import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

const TEACHER_COLUMNS: { header: string; key: string }[] = [
  { header: "Staff Code", key: "staff_code" },
  { header: "Teacher Name", key: "full_name" },
  { header: "Designation", key: "designation" },
  { header: "Gender", key: "gender" },
  { header: "Mobile", key: "mobile" },
  { header: "Email", key: "email" },
  { header: "DOB", key: "dob" },
  { header: "Joining Date", key: "joining_date" },
  { header: "Classes", key: "classes" },
  { header: "Subjects", key: "subjects" },
  { header: "Blood Group", key: "blood_group" },
  { header: "Marital Status", key: "marital_status" },
  { header: "Category", key: "category" },
  { header: "Aadhar No", key: "aadhar_no" },
  { header: "PAN No", key: "pan_no" },
  { header: "Salary", key: "salary" },
  { header: "Basic Pay", key: "basic_pay" },
  { header: "Grade Pay", key: "grade_pay" },
  { header: "Address", key: "address" },
  { header: "City", key: "city" },
  { header: "District", key: "district" },
  { header: "Pincode", key: "pincode" },
  { header: "State", key: "state" },
  { header: "SSC", key: "education_ssc" },
  { header: "HSC", key: "education_hsc" },
  { header: "Graduation", key: "education_ug" },
  { header: "Post Graduation", key: "education_pg" },
  { header: "Bank Account No", key: "bank_account_no" },
  { header: "IFSC", key: "bank_ifsc" },
  { header: "Bank Name", key: "bank_name" },
]

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get("school_id") || user.user_metadata?.school_id || ""
  const search = searchParams.get("search") || ""

  let query = supabase
    .from("teachers")
    .select("*, school_info!school_id(school_name)")
    .order("full_name")

  if (schoolId) query = query.eq("school_id", Number(schoolId))
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,staff_code.ilike.%${search}%,designation.ilike.%${search}%,mobile.ilike.%${search}%`)
  }

  const { data: teachers, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!teachers || teachers.length === 0) {
    return NextResponse.json({ error: "No teachers found for the selected filters" }, { status: 404 })
  }

  const rows = teachers.map((t: any) => {
    const row: Record<string, any> = { "School": t.school_info?.school_name || "" }
    for (const col of TEACHER_COLUMNS) {
      row[col.header] = t[col.key] !== null && t[col.key] !== undefined ? t[col.key] : ""
    }
    return row
  })

  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Teachers")

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="teachers.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Excel Export Error:", error)
    return NextResponse.json({
      error: "Excel generation failed. Is xlsx installed?",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
