"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllUsers() {
  const supabase = await createClient()
  const { data } = await supabase.from("users").select("*, teachers(full_name), students(full_name), school_info(school_name)")
  return data || []
}

export async function createUser(formData: FormData) {
  const adminSupabase = createAdminClient()
  const supabase = await createClient()
  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const full_name = formData.get("full_name") as string
  const role = formData.get("role") as string
  const school_id = formData.get("school_id") ? Number(formData.get("school_id")) : null
  const teacher_id = formData.get("teacher_id") ? Number(formData.get("teacher_id")) : null
  const student_id = formData.get("student_id") ? Number(formData.get("student_id")) : null
  const class_name = formData.get("class_name") as string
  const can_see_all_data = formData.get("can_see_all_data") === "true"

  // 1. Create Auth User
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role, school_id, can_see_all_data, class_name, student_id }
  })

  if (authError) return { success: false, message: authError.message }

  // 2. Create User Profile
  const { error: profileError } = await supabase.from("users").insert([{
    email,
    password, // Storing for convenience in this ERP, usually not recommended but following existing pattern
    full_name,
    role,
    school_id,
    teacher_id,
    student_id,
    class_name,
    can_see_all_data
  }])

  if (profileError) {
    // Cleanup auth user if profile fails
    await adminSupabase.auth.admin.deleteUser(authUser.user.id)
    return { success: false, message: profileError.message }
  }

  revalidatePath("/manage-users")
  return { success: true, message: "User created successfully" }
}

export async function deleteUser(id: number, email: string) {
  const adminSupabase = createAdminClient()
  const supabase = await createClient()

  // 1. Delete from Auth by email (lookup first)
  const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === email)
  if (authUser) {
    await adminSupabase.auth.admin.deleteUser(authUser.id)
  }

  // 2. Delete from users table
  const { error } = await supabase.from("users").delete().eq("id", id)
  
  revalidatePath("/manage-users")
  return { success: !error, message: error?.message || "User deleted" }
}
