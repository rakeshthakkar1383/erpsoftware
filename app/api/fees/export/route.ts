import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schoolId = user.user_metadata?.school_id
  const { searchParams } = new URL(request.url)
  const className = searchParams.get("class_name") || ""
  const division = searchParams.get("division") || ""
  const academicYearId = searchParams.get("academic_year_id") || ""

  let query = supabase
    .from("fees")
    .select("*, students!student_id(full_name, class_name, division, roll_no)")
    .order("id")

  if (schoolId) query = query.eq("school_id", schoolId)

  const { data: fees } = await query
  if (!fees) return NextResponse.json({ error: "No data" }, { status: 404 })

  let filtered = fees.filter((f: any) => {
    const s = f.students
    if (className && s?.class_name !== className) return false
    if (division && s?.division !== division) return false
    return true
  })

  if (academicYearId) {
    const { data: studentIds } = await supabase
      .from("students")
      .select("id")
      .eq("academic_year_id", Number(academicYearId))
    const ids = new Set((studentIds || []).map((s: any) => s.id))
    filtered = filtered.filter((f: any) => ids.has(f.student_id))
  }

  const rows = filtered.map((f: any) => ({
    "Student Name": f.students?.full_name || "",
    "Class": f.students?.class_name || "",
    "Division": f.students?.division || "",
    "Roll No": f.students?.roll_no || "",
    "Amount": f.amount || 0,
    "Status": f.status || "",
    "Payment Mode": f.payment_mode || "",
    "Transaction ID": f.transaction_id || "",
    "Payment Date": f.payment_date || "",
  }))

  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Fees")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="fees_report.xlsx"`,
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
