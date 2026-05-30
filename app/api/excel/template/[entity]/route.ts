import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

const templates: Record<string, string[]> = {
  students: ["full_name", "gender", "father_name", "mother_name", "dob", "birthplace", "address", "village", "district", "city", "last_school", "class_name", "division", "stream", "roll_no"],
  teachers: ["full_name", "subject", "mobile", "salary"],
  fees: ["student_id", "amount", "status", "payment_date", "payment_mode", "transaction_id"],
  attendance: ["student_id", "attendance_date", "status"],
  exams: ["exam_name", "class_name"],
  marks: ["student_id", "exam_id", "subject", "marks"],
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params
  const headers = templates[entity]
  if (!headers) return NextResponse.json({ error: `Unknown entity: ${entity}. Supported: ${Object.keys(templates).join(", ")}` }, { status: 400 })

  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, headers.map(() => "")])
    XLSX.utils.book_append_sheet(wb, ws, entity)
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${entity}_template.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Excel Template Error:", error)
    return NextResponse.json({ error: "Excel generation failed. Is xlsx installed?" }, { status: 500 })
  }
}
