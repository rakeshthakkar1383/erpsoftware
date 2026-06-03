"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getInstallmentsByFeeId(feeId: number) {
  const supabase = await createClient()
  const { data } = await supabase.from("fee_installments").select("*").eq("fee_id", feeId).order("month_number")
  return data || []
}

export async function updateInstallmentStatus(id: number, status: string, paidDate: string, paymentMode: string, transactionId: string) {
  const supabase = await createClient()
  const updateData: any = { status }
  if (status === "Paid") {
    updateData.paid_date = paidDate || null
    updateData.payment_mode = paymentMode || null
    updateData.transaction_id = transactionId || null
  }
  const { error } = await supabase.from("fee_installments").update(updateData).eq("id", id)
  revalidatePath("/fees")
  return { success: !error, message: error?.message || "Installment updated" }
}

export async function generateInstallments(feeId: number, startDate: string, monthlyAmount: number, durationMonths: number, schoolId: number) {
  const supabase = await createClient()
  const installments = []
  for (let i = 1; i <= durationMonths; i++) {
    const due = new Date(startDate)
    due.setMonth(due.getMonth() + i - 1)
    const dueDate = due.toISOString().split("T")[0]
    installments.push({
      fee_id: feeId,
      month_number: i,
      due_date: dueDate,
      amount: monthlyAmount,
      status: "Pending",
      school_id: schoolId,
    })
  }
  if (installments.length > 0) {
    const { error } = await supabase.from("fee_installments").insert(installments)
    return { success: !error, message: error?.message || "Installments generated" }
  }
  return { success: true, message: "No installments to generate" }
}

export async function deleteInstallmentsByFeeId(feeId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fee_installments").delete().eq("fee_id", feeId)
  return { success: !error, message: error?.message || "Installments deleted" }
}
