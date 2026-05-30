import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import PDFDocument from "pdfkit"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: fee } = await supabase.from("fees").select("*, students!student_id(*)").eq("id", id).single()
  if (!fee) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const schoolId = fee.school_id || user.user_metadata?.school_id
  const { data: school } = schoolId
    ? await supabase.from("school_info").select("*").eq("id", schoolId).single()
    : { data: null }

  try {
    const particulars = typeof fee.particulars === "string" ? JSON.parse(fee.particulars) : (fee.particulars || [])
    
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" })
        const buffers: Buffer[] = []
        doc.on("data", (chunk: Buffer) => buffers.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(buffers)))
        doc.on("error", (err) => reject(err))

        const renderReceipt = (title: string, yOffset: number) => {
          const schoolName = school?.school_name || "School Name"
          const schoolAddr = school?.address || "Address"
          const schoolPhone = school?.phone || ""
          const schoolEmail = school?.email || ""

          doc.fontSize(16).font("Helvetica-Bold").text(schoolName, 40, yOffset, { align: "center" })
          doc.fontSize(8).font("Helvetica").text(schoolAddr, { align: "center" })
          if (schoolPhone || schoolEmail) {
            doc.text(`${schoolPhone}${schoolPhone && schoolEmail ? " | " : ""}${schoolEmail}`, { align: "center" })
          }
          
          doc.moveDown(0.5)
          doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").stroke()
          doc.moveDown(0.5)

          doc.fontSize(12).font("Helvetica-Bold").text(title, { align: "center" })
          doc.moveDown(0.5)

          const topY = doc.y
          doc.fontSize(9).font("Helvetica")
          doc.text(`Receipt #: FEE-${String(fee.id).padStart(5, "0")}`, 40, topY)
          doc.text(`Date: ${fee.payment_date || new Date().toISOString().split("T")[0]}`, 40, topY, { align: "right" })
          doc.moveDown(0.5)

          doc.font("Helvetica-Bold").text("Student Details", 40, doc.y)
          doc.font("Helvetica")
          doc.text(`Name: ${fee.students?.full_name || "N/A"}`)
          doc.text(`Class: ${fee.students?.class_name || ""}${fee.students?.division ? ` - ${fee.students.division}` : ""}`)
          doc.text(`Roll No: ${fee.students?.roll_no || "N/A"}`)
          doc.moveDown(0.5)

          doc.font("Helvetica-Bold").text("Payment Details", 40, doc.y)
          doc.moveDown(0.2)
          
          const tableTop = doc.y
          doc.font("Helvetica-Bold")
          doc.text("Particular", 40, tableTop, { width: 300 })
          doc.text("Amount", 400, tableTop, { width: 155, align: "right" })
          doc.moveDown(0.2)
          doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#eeeeee").stroke()
          doc.moveDown(0.2)

          let total = 0
          if (particulars.length > 0) {
            particulars.forEach((p: any) => {
              const amt = Number(p.amount) || 0
              total += amt
              doc.font("Helvetica")
              const currentY = doc.y
              doc.text(p.particular_name || "Fee", 40, currentY, { width: 300 })
              doc.text(amt.toFixed(2), 400, currentY, { width: 155, align: "right" })
            })
          } else {
            total = Number(fee.amount) || 0
            const currentY = doc.y
            doc.text("Fee Amount", 40, currentY, { width: 300 })
            doc.text(total.toFixed(2), 400, currentY, { width: 155, align: "right" })
          }

          doc.moveDown(0.2)
          doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#000000").stroke()
          doc.moveDown(0.2)
          doc.font("Helvetica-Bold")
          const footerY = doc.y
          doc.text("Total", 40, footerY)
          doc.text(total.toFixed(2), 400, footerY, { width: 155, align: "right" })
          doc.moveDown(0.5)

          doc.font("Helvetica").fontSize(8)
          doc.text(`Payment Mode: ${fee.payment_mode || "N/A"}`)
          doc.text(`Status: ${fee.status}`)
          
          doc.moveDown(1)
          const sigY = doc.y
          doc.text("Student/Parent Signature", 40, sigY)
          doc.text("Office Signature / Seal", 40, sigY, { align: "right" })
        }

        // Office Copy
        renderReceipt("FEE RECEIPT (OFFICE COPY)", 40)

        // Cut line
        doc.moveTo(40, 415).lineTo(555, 415).dash(5, { space: 5 }).strokeColor("#999999").stroke().undash()

        // Student Copy
        renderReceipt("FEE RECEIPT (STUDENT COPY)", 440)

        doc.end()
      } catch (err) {
        reject(err)
      }
    })

    const download = request.nextUrl.searchParams.get("download") === "1"

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download ? `attachment; filename="receipt_${fee.id}.pdf"` : "inline",
        "Content-Length": String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error("PDF Generation Error:", error)
    return NextResponse.json({ 
      error: "PDF generation failed.", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
