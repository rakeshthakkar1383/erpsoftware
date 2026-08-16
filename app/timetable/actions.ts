"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllTimetable() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("timetables")
    .select("*, subjects!subject_id(subject_name), teachers!teacher_id(full_name)")
    .order("class_name")
    .order("day")
    .order("period_no")

  if (user?.user_metadata?.school_id) {
    query = query.eq("school_id", Number(user.user_metadata.school_id))
  }

  const { data } = await query
  return data || []
}

export async function addTimetable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const raw: any = {}

  formData.forEach((value, key) => {
    if (key === "period_no") raw[key] = Number(value)
    else if (key === "subject_id" || key === "teacher_id" || key === "school_id") {
      raw[key] = value === "" ? null : Number(value)
    } else {
      raw[key] = value
    }
  })

  if (!raw.school_id && user?.user_metadata?.school_id) {
    raw.school_id = Number(user.user_metadata.school_id)
  }

  const { error } = await supabase.from("timetables").insert([raw])
  revalidatePath("/timetable")
  return { success: !error, message: error?.message || "Timetable entry added" }
}

export async function updateTimetable(id: number, formData: FormData) {
  const supabase = await createClient()
  const raw: any = {}

  formData.forEach((value, key) => {
    if (key === "period_no") raw[key] = Number(value)
    else if (key === "subject_id" || key === "teacher_id" || key === "school_id") {
      raw[key] = value === "" ? null : Number(value)
    } else {
      raw[key] = value
    }
  })

  delete raw.id
  const { error } = await supabase.from("timetables").update(raw).eq("id", id)
  revalidatePath("/timetable")
  return { success: !error, message: error?.message || "Timetable entry updated" }
}

export async function deleteTimetable(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("timetables").delete().eq("id", id)
  revalidatePath("/timetable")
  return { success: !error, message: error?.message || "Timetable entry deleted" }
}
