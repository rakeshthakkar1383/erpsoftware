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
  const feeCategory = searchParams.get("fee_category") || ""
  const trustId = searchParams.get("trust_id") || ""
  const status = searchParams.get("status") || ""
  const fromDate = searchParams.get("from_date") || ""
  const toDate = searchParams.get("to_date") || ""
  const groupBy = searchParams.get("group_by") || ""

  let query = supabase
    .from("fees")
    .select("*, students!student_id(full_name, class_name, division, roll_no, gr_no, mobile), school_info(school_name), trust_info(trust_name), fee_types(name)")
    .order("payment_date", { ascending: false })

  if (schoolId) query = query.eq("school_id", schoolId)
  if (feeCategory) query = query.eq("fee_category", feeCategory)
  if (trustId) query = query.eq("trust_id", Number(trustId))
  if (status) {
    if (status === "unpaid") query = query.not("status", "eq", "Paid")
    else query = query.eq("status", status)
  }
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

  const wb = XLSX.utils.book_new()

  const rows: any[] = filtered.map((f: any, i: number) => ({
    "#": i + 1,
    "Date": f.payment_date || "",
    "School": f.school_info?.school_name || "N/A",
    "Trust": f.trust_info?.trust_name || "-",
    "Category": f.fee_category || "School",
    "Fee Type": f.fee_types?.name || "-",
    "Term": f.term || "Yearly",
    "Student Name": f.students?.full_name || "",
    "GR No": f.students?.gr_no || "",
    "Class": f.students?.class_name || "",
    "Division": f.students?.division || "",
    "Roll No": f.students?.roll_no || "",
    "Mobile": f.students?.mobile || "",
    "Amount": Number(f.amount) || 0,
    "Status": f.status || "",
    "Mode": f.payment_mode || "",
    "Receipt No": f.receipt_no ? `FEE-${f.receipt_year || ""}-${String(f.receipt_no).padStart(4, "0")}` : "",
    "Trans ID / Cheque": f.transaction_id || f.cheque_number || "",
  }))

  if (rows.length > 0) {
    const totalAmount = rows.reduce((sum: number, r: any) => sum + (Number(r["Amount"]) || 0), 0)
    const totalRow: Record<string, any> = {}
    Object.keys(rows[0]).forEach(k => { totalRow[k] = "" })
    totalRow["Student Name"] = "TOTAL"
    totalRow["Amount"] = totalAmount
    totalRow["Status"] = `${rows.length} records`
    rows.push(totalRow)
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [
    { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 10 },
    { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 8 },
    { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 8 }, { wch: 20 }, { wch: 18 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Unpaid Fees Report")

  if (groupBy && rows.length > 1) {
    const groupMap: Record<string, { count: number; total: number }> = {}
    filtered.forEach((f: any) => {
      let key = ""
      if (groupBy === "class") key = f.students?.class_name || "Unknown"
      else if (groupBy === "school") key = f.school_info?.school_name || "Unknown"
      else if (groupBy === "trust") key = f.trust_info?.trust_name || "Unknown"
      else if (groupBy === "year") key = f.receipt_year || "Unknown"
      else if (groupBy === "fee_type") key = f.fee_types?.name || "Unknown"

      if (!groupMap[key]) groupMap[key] = { count: 0, total: 0 }
      groupMap[key].count++
      groupMap[key].total += Number(f.amount) || 0
    })

    const groupLabel = groupBy === "class" ? "Class" : groupBy === "school" ? "School" : groupBy === "trust" ? "Trust" : groupBy === "year" ? "Year" : "Fee Type"

    const summaryRows: any[] = Object.entries(groupMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([key, val], i) => ({
        "#": i + 1,
        [groupLabel]: key,
        "Records": val.count,
        "Total Amount": val.total,
      }))

    const grandTotal = summaryRows.reduce((sum: number, r: any) => sum + (Number(r["Total Amount"]) || 0), 0)
    const grandCount = summaryRows.reduce((sum: number, r: any) => sum + (Number(r["Records"]) || 0), 0)
    const grandRow: Record<string, any> = {}
    grandRow["#"] = ""
    grandRow[groupLabel] = "GRAND TOTAL"
    grandRow["Records"] = grandCount
    grandRow["Total Amount"] = grandTotal
    summaryRows.push(grandRow)

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")
  }

  try {
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const fileSuffix = `${feeCategory || 'all'}_${status || 'unpaid'}_${className || 'all'}classes`.replace(/\s+/g, "_")
    const filename = `unpaid_fees_report_${fileSuffix}.xlsx`

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
