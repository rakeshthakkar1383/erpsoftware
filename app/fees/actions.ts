"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllFees() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase.from("fees").select("*")
  if (user?.user_metadata?.school_id) query = query.eq("school_id", user.user_metadata.school_id)
  const { data } = await query
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
  if (raw.particulars && Array.isArray(raw.particulars)) {
    raw.amount = raw.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    raw.particulars = JSON.stringify(raw.particulars)
  }
  if (raw.student_id) raw.student_id = Number(raw.student_id)
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  if (!raw.payment_date) raw.payment_date = null
  if (!raw.cheque_date) raw.cheque_date = null
  const { data: inserted, error } = await supabase.from("fees").insert([raw]).select("id").single()
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
  if (raw.particulars && Array.isArray(raw.particulars)) {
    raw.amount = raw.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    raw.particulars = JSON.stringify(raw.particulars)
  }
  if (raw.student_id) raw.student_id = Number(raw.student_id)
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  if (!raw.payment_date) raw.payment_date = null
  if (!raw.cheque_date) raw.cheque_date = null
  delete raw.id
  const { error } = await supabase.from("fees").update(raw).eq("id", id)
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Fee updated", id }
}

export async function deleteFee(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fees").delete().eq("id", id)
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Fee deleted" }
}
