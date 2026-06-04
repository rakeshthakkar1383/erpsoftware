"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateInstallments, deleteInstallmentsByFeeId } from "./installment-actions"

async function generateReceiptNo(supabase: any, studentId: number, feeCategory: string): Promise<{ receipt_no: number; receipt_year: string } | null> {
  const { data: student } = await supabase.from("students").select("academic_year_id").eq("id", studentId).maybeSingle()
  const academicYearId = student?.academic_year_id
  let receiptYear = new Date().getFullYear().toString()
  if (academicYearId) {
    const { data: year } = await supabase.from("academic_years").select("year_name").eq("id", academicYearId).maybeSingle()
    if (year?.year_name) receiptYear = year.year_name
  }
  const { data: maxRow } = await supabase
    .from("fees")
    .select("receipt_no")
    .eq("receipt_year", receiptYear)
    .eq("fee_category", feeCategory)
    .order("receipt_no", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextNo = (maxRow?.receipt_no || 0) + 1
  return { receipt_no: nextNo, receipt_year: receiptYear }
}

export async function getAllFees() {
  const supabase = await createClient()
  const { data } = await supabase.from("fees").select("*")
  return (data || []).map((f: any) => ({
    ...f,
    payment_date: f.payment_date ? f.payment_date.split("T")[0] : null,
    particulars: typeof f.particulars === "string" ? JSON.parse(f.particulars) : (f.particulars || []),
  }))
}

export async function addFee(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => {
    if (k === "particulars") {
      try { raw[k] = JSON.parse(v as string) } catch { raw[k] = v }
    } else {
      raw[k] = v
    }
  })
  const durationMonths = raw.duration_months ? Number(raw.duration_months) : 1
  if (Array.isArray(raw.particulars)) {
    if (raw.particulars.length > 0) {
      raw.amount = raw.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    } else {
      const amt = Number(raw.amount)
      raw.amount = isNaN(amt) ? 0 : amt
    }
    raw.particulars = JSON.stringify(raw.particulars)
  } else {
    const amt = Number(raw.amount)
    raw.amount = isNaN(amt) ? 0 : amt
  }
  // ... (rest of student_id, trust_id, etc. remains same)
  if (raw.student_id) raw.student_id = Number(raw.student_id)
  else delete raw.student_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  if (raw.fee_type_id) raw.fee_type_id = Number(raw.fee_type_id)
  else raw.fee_type_id = null
  if (!raw.fee_category) raw.fee_category = "School"
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  if (!raw.payment_date) raw.payment_date = null
  if (!raw.cheque_date) raw.cheque_date = null
  delete raw.duration_months
  if (raw.status === "Paid" && raw.student_id) {
    const receipt = await generateReceiptNo(supabase, raw.student_id, raw.fee_category || "School")
    if (receipt) {
      raw.receipt_no = receipt.receipt_no
      raw.receipt_year = receipt.receipt_year
    }
  }
  const { data: inserted, error } = await supabase.from("fees").insert([raw]).select("id").single()
  if (!error && inserted) {
    // Generate only 1 installment for the full amount
    await generateInstallments(inserted.id, raw.payment_date || new Date().toISOString().split("T")[0], raw.amount, 1, raw.school_id)
  }
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Fee added", id: inserted?.id }
}

export async function updateFee(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => {
    if (k === "particulars") {
      try { raw[k] = JSON.parse(v as string) } catch { raw[k] = v }
    } else {
      raw[k] = v
    }
  })
  const durationMonths = raw.duration_months ? Number(raw.duration_months) : 1
  if (Array.isArray(raw.particulars)) {
    if (raw.particulars.length > 0) {
      raw.amount = raw.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    } else {
      const amt = Number(raw.amount)
      raw.amount = isNaN(amt) ? 0 : amt
    }
    raw.particulars = JSON.stringify(raw.particulars)
  } else {
    const amt = Number(raw.amount)
    raw.amount = isNaN(amt) ? 0 : amt
  }
  if (raw.student_id) raw.student_id = Number(raw.student_id)
  else delete raw.student_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  if (raw.fee_type_id) raw.fee_type_id = Number(raw.fee_type_id)
  else raw.fee_type_id = null
  if (!raw.fee_category) raw.fee_category = "School"
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (!raw.payment_date) raw.payment_date = null
  if (!raw.cheque_date) raw.cheque_date = null
  delete raw.id
  delete raw.duration_months
  delete raw.receipt_no
  delete raw.receipt_year
  if (raw.status === "Paid" && raw.student_id) {
    const { data: existing } = await supabase.from("fees").select("receipt_no, receipt_year").eq("id", id).maybeSingle()
    if (!existing?.receipt_no) {
      const receipt = await generateReceiptNo(supabase, raw.student_id, raw.fee_category || "School")
      if (receipt) {
        raw.receipt_no = receipt.receipt_no
        raw.receipt_year = receipt.receipt_year
      }
    }
  }
  const { error } = await supabase.from("fees").update(raw).eq("id", id)
  if (!error) {
    await deleteInstallmentsByFeeId(id)
    const schoolId = raw.school_id || 0
    await generateInstallments(id, raw.payment_date || new Date().toISOString().split("T")[0], raw.amount, 1, schoolId)
  }
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Fee updated", id }
}

export async function deleteFee(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fees").delete().eq("id", id)
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Fee deleted" }
}
