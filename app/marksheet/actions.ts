"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMarksheetData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let sq = supabase.from("students").select("*").order("class_name").order("roll_no")
  let mq = supabase.from("marks").select("*")
  let eq = supabase.from("exams").select("*")
  let subq = supabase.from("subjects").select("*").order("subject_name")
  let dq = supabase.from("divisions").select("*")

  if (schoolId) {
    sq = sq.eq("school_id", schoolId)
    mq = mq.eq("school_id", schoolId)
    eq = eq.eq("school_id", schoolId)
    subq = subq.eq("school_id", schoolId)
    dq = dq.eq("school_id", schoolId)
  }

  const [students, marks, exams, subjects, divisions] = await Promise.all([
    (await sq).data || [],
    (await mq).data || [],
    (await eq).data || [],
    (await subq).data || [],
    (await dq).data || [],
  ])

  return { students, marks, exams, subjects, divisions }
}
