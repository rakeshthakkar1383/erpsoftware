"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateInstallments, deleteInstallmentsByFeeId } from "./installment-actions"

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
