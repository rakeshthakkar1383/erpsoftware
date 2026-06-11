import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import PDFDocument from "pdfkit"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Use Admin Client to bypass RLS for report generation
  const adminSupabase = createAdminClient()
  
  // 1. Fetch the fee record
  const { data: fee, error: feeError } = await adminSupabase
    .from("fees")
    .select("*, students!student_id(*), fee_types!fee_type_id(*)")
    .eq("id", id)
    .single()

  if (feeError || !fee) {
    console.error("Receipt Fee Fetch Error:", feeError)
    return NextResponse.json({ error: "Fee record not found" }, { status: 404 })
  }

  // 2. Fetch School Info explicitly
  let school = null
  const schoolIdToFetch = fee.school_id || user.user_metadata?.school_id
  if (schoolIdToFetch) {
    const { data: s } = await adminSupabase.from("school_info").select("*").eq("id", schoolIdToFetch).maybeSingle()
    school = s
  }

  // 3. Fetch Trust Info explicitly if needed
  let trust = null
  const trustIdToFetch = fee.trust_id
  if (trustIdToFetch) {
    const { data: t } = await adminSupabase.from("trust_info").select("*").eq("id", trustIdToFetch).maybeSingle()
    trust = t
  }

  console.log("Receipt Generation Debug:", {
    feeId: fee.id,
    feeCategory: fee.fee_category,
    schoolId: schoolIdToFetch,
    hasSchool: !!school,
    schoolName: school?.school_name,
    hasTrust: !!trust,
    trustName: trust?.trust_name,
    logoUrl: (fee.fee_category === "Trust" ? trust?.logo_url : school?.logo_url) || school?.logo_url
  })

  try {
    let particulars: any[] = []
    try {
      const raw = fee.particulars
      particulars = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
    } catch { particulars = [] }
    const copy = request.nextUrl.searchParams.get("copy") || "both"
    
    let logoImage: Buffer | null = null
    const logoUrl = (fee.fee_category === "Trust" ? trust?.logo_url : school?.logo_url) || school?.logo_url
    
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl)
        if (resp.ok) {
          logoImage = Buffer.from(await resp.arrayBuffer())
        } else {
          console.error("Logo fetch failed with status:", resp.status, logoUrl)
        }
      } catch (err) {
        console.error("Logo fetch exception:", err, logoUrl)
      }
    }

    console.log("Receipt Particulars Debug:", {
      feeId: fee.id,
      particularsCount: particulars.length,
      particularsNames: particulars.map((p: any) => p.particular_name || p.name),
      rawParticulars: fee.particulars
    })

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
          if (!dateStr) return ""
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return dateStr
          return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
        }

        const isTrustReceipt = String(fee.fee_category || "").toUpperCase() === "TRUST"

        const renderReceipt = (title: string, yOffset: number) => {
          const sName = (school?.school_name || "School Name").toUpperCase()
          const sAddr = school?.address || "Address"
          const sPhone = school?.phone || ""
          const sEmail = school?.email || ""
          const tName = trust?.trust_name || school?.trust_name || ""

          const isTrust = String(fee.fee_category || "").toUpperCase() === "TRUST"
          const isAdvance = String(fee.fee_category || "").toUpperCase() === "ADVANCE"
          const mainHeading = (isTrust && tName ? tName : sName).toUpperCase()
          const subHeading = isTrust && tName ? sName : (tName ? tName.toUpperCase() : "")

          if (logoImage) {
            doc.image(logoImage, 40, yOffset, { fit: [80, 80] })
            doc.fontSize(16).font("Helvetica-Bold").text(mainHeading, 130, yOffset + 5, { width: 425, align: "center" })
            if (subHeading) {
              doc.fontSize(10).font("Helvetica-Bold").text(subHeading, 130, yOffset + 25, { width: 425, align: "center" })
            }
            doc.fontSize(9).font("Helvetica").text(sAddr, 130, yOffset + 42, { width: 425, align: "center" })
            if (sPhone || sEmail) {
              doc.fontSize(8).text(`${sPhone}${sPhone && sEmail ? " | " : ""}${sEmail}`, 130, yOffset + 58, { width: 425, align: "center" })
            }
            doc.y = yOffset + 85
          } else {
            doc.fontSize(16).font("Helvetica-Bold").text(mainHeading, 40, yOffset, { align: "center" })
            if (subHeading) {
              doc.fontSize(10).font("Helvetica-Bold").text(subHeading, 40, yOffset + 20, { align: "center" })
            }
            doc.fontSize(9).font("Helvetica").text(sAddr, 40, yOffset + 38, { align: "center" })
            if (sPhone || sEmail) {
              doc.fontSize(8).text(`${sPhone}${sPhone && sEmail ? " | " : ""}${sEmail}`, 40, yOffset + 52, { align: "center" })
            }
            doc.y = yOffset + 70
          }
          
          doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).strokeColor("#cccccc").stroke()
          doc.y = doc.y + 10

          doc.fontSize(11).font("Helvetica-Bold").text(title, { align: "center" })
          if (isTrustReceipt && tName) {
            doc.fontSize(8).font("Helvetica").text(`TRUST: ${tName}`, { align: "center" })
          }
          doc.moveDown(0.3)

          const topY = doc.y
          doc.fontSize(8).font("Helvetica")
          const receiptLabel = fee.receipt_year && fee.receipt_no
            ? `FEE-${fee.receipt_year}-${String(fee.receipt_no).padStart(4, "0")}`
            : `FEE-${String(fee.id).padStart(5, "0")}`
          doc.text(`Receipt #: ${receiptLabel}`, 40, topY)
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
              const pTerm = p.term || fee.term || "Yearly"
              const amt = Number(p.amount) || 0
              total += amt
              
              doc.font("Helvetica")
              const currentY = doc.y
              
              // Simplify label: avoid "YEARLY (Yearly)"
              const displayLabel = name.toUpperCase() === pTerm.toUpperCase() ? name : `${name} (${pTerm})`
              
              doc.text(displayLabel, 40, currentY, { width: 300 })
              doc.text(amt.toFixed(2), 400, currentY, { width: 155, align: "right" })
              
              // Ensure we move down after each row, handling potential wrapping
              const textHeight = doc.heightOfString(displayLabel, { width: 300 })
              doc.y = currentY + Math.max(textHeight, 12) + 2
            })
          } else {
            total = Number(fee.amount) || 0
            const feeTypeName = fee.fee_types?.name || ""
            const pTerm = fee.term || "Yearly"
            const currentY = doc.y
            const displayLabel = (feeTypeName && feeTypeName.toUpperCase() === pTerm.toUpperCase()) ? feeTypeName : `${feeTypeName || "Fee Amount"} (${pTerm})`
            
            doc.text(displayLabel, 40, currentY, { width: 300 })
            doc.text(total.toFixed(2), 400, currentY, { width: 155, align: "right" })
            doc.moveDown(1)
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

        const receiptTitle = isTrustReceipt ? "TRUST FEE RECEIPT" : "FEE RECEIPT"

        if (copy === "office") {
          renderReceipt(`${receiptTitle} (OFFICE COPY)`, 40)
        } else if (copy === "student") {
          renderReceipt(`${receiptTitle} (STUDENT COPY)`, 40)
        } else {
          renderReceipt(`${receiptTitle} (OFFICE COPY)`, 40)
          doc.moveTo(40, 415).lineTo(555, 415).dash(5, { space: 5 }).strokeColor("#999999").stroke().undash()
          renderReceipt(`${receiptTitle} (STUDENT COPY)`, 440)
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
