import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get("school_id") || user.user_metadata?.school_id
  const className = searchParams.get("class_name") || ""
  const division = searchParams.get("division") || ""
  const academicYearId = searchParams.get("academic_year_id") || ""
  const feeTypeIdsParam = searchParams.get("fee_type_ids") || ""
  const fromDate = searchParams.get("from_date") || ""
  const toDate = searchParams.get("to_date") || ""

  let query = supabase
    .from("fees")
    .select("*, students!student_id(full_name, class_name, division, roll_no, gr_no), school_info(school_name), trust_info(trust_name)")
    .order("payment_date", { ascending: false })

  if (schoolId) query = query.eq("school_id", schoolId)
  if (fromDate) query = query.gte("payment_date", fromDate)
  if (toDate) query = query.lte("payment_date", toDate)

  const { data: fees } = await query
  if (!fees) return NextResponse.json({ error: "No data" }, { status: 404 })

  const feeTypeIds = feeTypeIdsParam ? feeTypeIdsParam.split(",").map(Number).filter(n => !isNaN(n)) : []

  let filtered = fees.filter((f: any) => {
    const s = f.students
    if (className && s?.class_name !== className) return false
    if (division && s?.division !== division) return false
    if (feeTypeIds.length > 0 && !feeTypeIds.includes(Number(f.fee_type_id))) return false
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
    "Date": f.payment_date || "",
    "School": f.school_info?.school_name || "N/A",
    "Trust": f.trust_info?.trust_name || "-",
    "Category": f.fee_category || "School",
    "Term": f.term || "Yearly",
    "Student Name": f.students?.full_name || "",
    "GR No": f.students?.gr_no || "",
    "Class": f.students?.class_name || "",
    "Division": f.students?.division || "",
    "Roll No": f.students?.roll_no || "",
    "Amount": f.amount || 0,
    "Status": f.status || "",
    "Mode": f.payment_mode || "",
    "Trans ID / Cheque": f.transaction_id || f.cheque_number || "",
  }))

  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Fees Data")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    
    const filename = `fees_report_${fromDate || 'all'}_to_${toDate || 'today'}.xlsx`

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf", // Actually XLSX, but some clients prefer this or application/octet-stream
        "Content-Type-Full": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
