"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllFeeTypes() {
  const supabase = await createClient()
  const { data } = await supabase.from("fee_types").select("*").order("sort_order").order("name")
  return data || []
}

export async function addFeeType(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (!raw.fee_category) raw.fee_category = "School"
  if (!raw.school_id && user?.user_metadata?.school_id) raw.school_id = user.user_metadata.school_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id

  if (raw.fee_category === "School") {
    const schoolId = raw.school_id ? Number(raw.school_id) : null
    if (!schoolId) {
      return { success: false, message: "School is required to create a school fee type." }
    }
    raw.school_id = schoolId
  } else {
    if (!raw.trust_id) {
      return { success: false, message: "Trust is required to create a trust fee type." }
    }
    const { data: trust } = await supabase.from("trust_info").select("school_id").eq("id", raw.trust_id).single()
    if (trust?.school_id) raw.school_id = Number(trust.school_id)
    else delete raw.school_id
  }

  raw.is_active = true
  if (!raw.sort_order) {
    const { data: maxRow } = await supabase.from("fee_types").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    raw.sort_order = (maxRow?.sort_order ?? 0) + 1
  }
  const { error } = await supabase.from("fee_types").insert([raw])
  revalidatePath("/fee-types")
  return { success: !error, message: error?.message || "Fee type added" }
}

export async function updateFeeType(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}
  formData.forEach((v, k) => { raw[k] = v })
  if (raw.school_id) raw.school_id = Number(raw.school_id)
  else delete raw.school_id
  if (raw.trust_id) raw.trust_id = Number(raw.trust_id)
  else delete raw.trust_id
  if (!raw.fee_category) raw.fee_category = "School"
  if (raw.fee_category === "Trust" && raw.trust_id) {
    const { data: trust } = await supabase.from("trust_info").select("school_id").eq("id", raw.trust_id).single()
    if (trust?.school_id) raw.school_id = Number(trust.school_id)
  }
  const { error } = await supabase.from("fee_types").update(raw).eq("id", id)
  revalidatePath("/fee-types")
  return { success: !error, message: error?.message || "Fee type updated" }
}

export async function deleteFeeType(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("fee_types").delete().eq("id", id)
  revalidatePath("/fee-types")
  return { success: !error, message: error?.message || "Fee type deleted" }
}

export async function moveFeeType(id: number, direction: "up" | "down") {
  try {
    const supabase = await createClient()
    const { data: current } = await supabase.from("fee_types").select("id, sort_order").eq("id", id).single()
    if (!current) return { success: false, message: "Not found" }

    const compare = direction === "up" ? "lt" : "gt"
    const orderDir = direction === "up" ? "desc" : "asc"

    const { data: neighbor } = await supabase
      .from("fee_types")
      .select("id, sort_order")
      .filter("sort_order", compare, current.sort_order)
      .order("sort_order", { ascending: orderDir === "asc" })
      .limit(1)
      .maybeSingle()

    if (!neighbor) return { success: false, message: "Already at the edge" }

    await supabase.from("fee_types").update({ sort_order: neighbor.sort_order }).eq("id", current.id)
    await supabase.from("fee_types").update({ sort_order: current.sort_order }).eq("id", neighbor.id)

    revalidatePath("/fee-types")
    return { success: true, message: "Moved" }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to move" }
  }
}
