"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllFeeParticulars() {
  const supabase = await createClient()
  const { data } = await supabase.from("fee_particulars").select("*").order("sort_order").order("class_name").order("particular_name")
  return data || []
}

export async function addFeeParticular(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.fee_category) raw.fee_category = "School"
  if (raw.fee_type_id) raw.fee_type_id = Number(raw.fee_type_id)
  else raw.fee_type_id = null
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else if (user?.user_metadata?.school_id) raw.school_id = Number(user.user_metadata.school_id)
  else delete raw.school_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  if (raw.fee_category === "Trust" && raw.trust_id) {
    const { data: trust } = await supabase.from("trust_info").select("school_id").eq("id", raw.trust_id).single()
    if (trust?.school_id) raw.school_id = Number(trust.school_id)
  }
  if (raw.duration_months) raw.duration_months = Number(raw.duration_months)
  else raw.duration_months = 12
  if (!raw.term) raw.term = "Yearly"
  if (!raw.sort_order) {
    const { data: maxRow } = await supabase.from("fee_particulars").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    raw.sort_order = (maxRow?.sort_order ?? 0) + 1
  }
  const { error } = await supabase.from("fee_particulars").insert([raw])
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular added" }
}

export async function updateFeeParticular(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.fee_type_id) raw.fee_type_id = Number(raw.fee_type_id)
  else raw.fee_type_id = null
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  if (!raw.fee_category) raw.fee_category = "School"
  if (raw.fee_category === "Trust" && raw.trust_id) {
    const { data: trust } = await supabase.from("trust_info").select("school_id").eq("id", raw.trust_id).single()
    if (trust?.school_id) raw.school_id = Number(trust.school_id)
  }
  if (raw.duration_months) raw.duration_months = Number(raw.duration_months)
  else raw.duration_months = 12
  if (!raw.term) raw.term = "Yearly"
  const { error } = await supabase.from("fee_particulars").update(raw).eq("id", id)
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular updated" }
}

export async function deleteFeeParticular(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fee_particulars").delete().eq("id", id)
  revalidatePath("/fee-particulars")
  return { success: !error, message: error?.message || "Fee particular deleted" }
}

export async function moveFeeParticular(id: number, direction: "up" | "down") {
  try {
    const supabase = await createClient()
    const { data: current } = await supabase.from("fee_particulars").select("id, sort_order").eq("id", id).single()
    if (!current) return { success: false, message: "Not found" }

    const compare = direction === "up" ? "lt" : "gt"
    const orderDir = direction === "up" ? "desc" : "asc"

    const { data: neighbor } = await supabase
      .from("fee_particulars")
      .select("id, sort_order")
      .filter("sort_order", compare, current.sort_order)
      .order("sort_order", { ascending: orderDir === "asc" })
      .limit(1)
      .maybeSingle()

    if (!neighbor) return { success: false, message: "Already at the edge" }

    const { error: swap1 } = await supabase.from("fee_particulars").update({ sort_order: neighbor.sort_order }).eq("id", current.id)
    const { error: swap2 } = await supabase.from("fee_particulars").update({ sort_order: current.sort_order }).eq("id", neighbor.id)

    revalidatePath("/fee-particulars")
    return { success: !swap1 && !swap2, message: "Moved" }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to move" }
  }
}
