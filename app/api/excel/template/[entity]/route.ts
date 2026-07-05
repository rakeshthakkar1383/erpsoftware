import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

const templates: Record<string, string[]> = {
  students: [
    "school_name",
    "school_id",
    "admission_no",
    "gr_no",
    "full_name",
    "gender",
    "dob",
    "birthplace",
    "mobile",
    "father_name",
    "father_mobile",
    "mother_name",
    "mother_mobile",
    "class_name",
    "division",
    "stream",
    "roll_no",
    "academic_year_id",
    "category",
    "address",
    "village",
    "city",
    "district",
    "pincode",
    "last_school",
    "aadhar_no",
    "photo_url",
    "birth_cert_url",
    "aadhar_url",
    "father_aadhar_url",
    "ration_card_url",
    "category_cert_url"
  ],
  teachers: ["school_name", "full_name", "staff_code", "designation", "gender", "blood_group", "marital_status", "mobile", "email", "aadhar_no", "pan_no", "category", "dob", "joining_date", "salary", "basic_pay", "grade_pay", "subjects", "classes", "address", "city", "district", "pincode", "state", "education_ssc", "education_hsc", "education_ug", "education_pg", "bank_account_no", "bank_ifsc", "bank_name"],
  fees: ["student_id", "amount", "status", "payment_date", "payment_mode", "transaction_id"],
  attendance: ["student_id", "attendance_date", "status"],
  exams: ["exam_name", "class_name"],
  marks: ["student_id", "exam_id", "subject", "marks"],
}

export async function GET(_request: NextRequest, { params }: { params: { entity: string } }) {
  const { entity } = params
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
