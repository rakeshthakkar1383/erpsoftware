import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import PDFDocument from "pdfkit"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: fee } = await supabase.from("fees").select("*, students!student_id(*), trust_info!trust_id(*), fee_types!fee_type_id(*)").eq("id", id).single()
  if (!fee) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const schoolId = fee.school_id || user.user_metadata?.school_id
  const { data: school } = schoolId
    ? await supabase.from("school_info").select("*").eq("id", schoolId).single()
    : { data: null }

  try {
    let particulars: any[] = []
    try {
      const raw = fee.particulars
      particulars = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
    } catch { particulars = [] }
    const copy = request.nextUrl.searchParams.get("copy") || "both"
    
    let logoImage: Buffer | null = null
    const logoUrl = (fee.fee_category === "Trust" ? fee.trust_info?.logo_url : school?.logo_url) || school?.logo_url
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl)
        if (resp.ok) logoImage = Buffer.from(await resp.arrayBuffer())
      } catch (err) {
        console.error("Logo fetch error:", err)
      }
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" })
        const buffers: Buffer[] = []
        doc.on("data", (chunk: Buffer) => buffers.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(buffers)))
        doc.on("error", (err) => reject(err))

        const numberToWords = (n: number): string => {
          if (n === 0) return "Zero"
          const a = ["","ONE ","TWO ","THREE ","FOUR ","FIVE ","SIX ","SEVEN ","EIGHT ","NINE ","TEN ","ELEVEN ","TWELVE ","THIRTEEN ","FOURTEEN ","FIFTEEN ","SIXTEEN ","SEVENTEEN ","EIGHTEEN ","NINETEEN "]
          const b = ["","","TWENTY ","THIRTY ","FORTY ","FIFTY ","SIXTY ","SEVENTY ","EIGHTY ","NINETY "]
          const fn = (num: number): string => {
            if (num < 20) return a[num]
            if (num < 100) return b[Math.floor(num / 10)] + a[num % 10]
            if (num < 1000) return a[Math.floor(num / 100)] + "HUNDRED " + (num % 100 ? fn(num % 100) : "")
            if (num < 100000) return fn(Math.floor(num / 1000)) + "THOUSAND " + (num % 1000 ? fn(num % 1000) : "")
            return fn(Math.floor(num / 100000)) + "LAKH " + (num % 100000 ? fn(num % 100000) : "")
          }
          return fn(Math.floor(n)) + "ONLY"
        }

        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr)
          return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
        }

        const renderReceipt = (title: string, yOffset: number) => {
          const schoolName = (school?.school_name || "School Name").toUpperCase()
          const schoolAddr = school?.address || "Address"
          const schoolPhone = school?.phone || ""
          const schoolEmail = school?.email || ""
          const trustName = fee.trust_info?.trust_name || school?.trust_name || ""

          if (logoImage) {
            doc.image(logoImage, 40, yOffset, { fit: [80, 80] })
            doc.fontSize(16).font("Helvetica-Bold").text(schoolName, 130, yOffset + 5, { width: 425, align: "center" })
            if (trustName) {
              doc.fontSize(10).font("Helvetica-Bold").text(trustName, 130, yOffset + 25, { width: 425, align: "center" })
            }
            doc.fontSize(9).font("Helvetica").text(schoolAddr, 130, yOffset + 42, { width: 425, align: "center" })
            if (schoolPhone || schoolEmail) {
              doc.fontSize(8).text(`${schoolPhone}${schoolPhone && schoolEmail ? " | " : ""}${schoolEmail}`, 130, yOffset + 58, { width: 425, align: "center" })
            }
            doc.y = yOffset + 85
          } else {
            doc.fontSize(16).font("Helvetica-Bold").text(schoolName, 40, yOffset, { align: "center" })
            if (trustName) {
              doc.fontSize(10).font("Helvetica-Bold").text(trustName, 40, yOffset + 20, { align: "center" })
            }
            doc.fontSize(9).font("Helvetica").text(schoolAddr, 40, yOffset + 38, { align: "center" })
            if (schoolPhone || schoolEmail) {
              doc.fontSize(8).text(`${schoolPhone}${schoolPhone && schoolEmail ? " | " : ""}${schoolEmail}`, 40, yOffset + 52, { align: "center" })
            }
            doc.y = yOffset + 70
          }
          
          doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).strokeColor("#cccccc").stroke()
          doc.y = doc.y + 10

          doc.fontSize(11).font("Helvetica-Bold").text(title, { align: "center" })
          doc.moveDown(0.3)

          const topY = doc.y
          doc.fontSize(8).font("Helvetica")
          doc.text(`Receipt #: FEE-${String(fee.id).padStart(5, "0")}`, 40, topY)
          doc.text(`Date: ${formatDate(fee.payment_date || new Date().toISOString())}`, 40, topY, { align: "right" })
          doc.moveDown(0.5)

          doc.font("Helvetica-Bold").text("Student Details", 40, doc.y)
          doc.font("Helvetica")
          doc.text(`Name: ${fee.students?.full_name || "N/A"}`)
          if (fee.students?.gr_no) doc.text(`GR No: ${fee.students.gr_no}`)
          if (fee.students?.admission_no) doc.text(`Admission No: ${fee.students.admission_no}`)
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
              const name = p.particular_name || p.name || ""
              const amt = Number(p.amount) || 0
              total += amt
              doc.font("Helvetica")
              const currentY = doc.y
              doc.text(name || "Fee", 40, currentY, { width: 300 })
              doc.text(amt.toFixed(2), 400, currentY, { width: 155, align: "right" })
            })
          } else {
            total = Number(fee.amount) || 0
            const feeTypeName = fee.fee_types?.name || ""
            const currentY = doc.y
            doc.text(feeTypeName || "Fee Amount", 40, currentY, { width: 300 })
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

          // Amount in Words Full Row
          const wordsY = doc.y
          doc.rect(40, wordsY, 515, 18).fill("#f6f6f6")
          doc.fillColor("#000000").fontSize(8).font("Helvetica-Bold")
          doc.text(`AMOUNT IN WORDS: ${numberToWords(total)}`, 45, wordsY + 5, { width: 505 })
          doc.moveDown(0.8)

          doc.font("Helvetica").fontSize(7)
          doc.text(`Payment Mode: ${fee.payment_mode || "N/A"}`)
          if (fee.payment_mode === "Online" && fee.transaction_id) {
            doc.text(`Transaction ID: ${fee.transaction_id}`)
          }
          if (fee.payment_mode === "Cheque") {
            if (fee.cheque_number) doc.text(`Cheque No: ${fee.cheque_number}`)
            if (fee.cheque_date) doc.text(`Cheque Date: ${formatDate(fee.cheque_date)}`)
            if (fee.bank_name) doc.text(`Bank: ${fee.bank_name}`)
          }
          doc.text(`Status: ${fee.status}`)
          
          doc.moveDown(1)
          const sigY = doc.y
          doc.fontSize(8).text("Office Signature / Seal", 40, sigY, { align: "right" })
        }

        if (copy === "office") {
          renderReceipt("FEE RECEIPT (OFFICE COPY)", 40)
        } else if (copy === "student") {
          renderReceipt("FEE RECEIPT (STUDENT COPY)", 40)
        } else {
          renderReceipt("FEE RECEIPT (OFFICE COPY)", 40)
          doc.moveTo(40, 415).lineTo(555, 415).dash(5, { space: 5 }).strokeColor("#999999").stroke().undash()
          renderReceipt("FEE RECEIPT (STUDENT COPY)", 440)
        }

        doc.end()
      } catch (err) {
        reject(err)
      }
    })

    const download = request.nextUrl.searchParams.get("download") === "1"
    const copyLabel = copy === "office" ? "office" : copy === "student" ? "student" : "receipt"

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download ? `attachment; filename="${copyLabel}_${fee.id}.pdf"` : "inline",
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
