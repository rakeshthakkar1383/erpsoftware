import { createClient } from "@/lib/supabase/server"
import ManageUsersClient from "./manage-users-client"
import { getAllUsers } from "./actions"

export const dynamic = "force-dynamic"

export default async function ManageUsersPage() {
  const supabase = await createClient()
  
  const initialUsers = await getAllUsers()
  
  const { data: allSchools } = await supabase.from("school_info").select("id, school_name").order("school_name")
  const { data: teachers } = await supabase.from("teachers").select("id, full_name, school_id").order("full_name")
  const { data: students } = await supabase.from("students").select("id, full_name, gr_no").order("full_name")

  return (
    <div className="p-6">
      <ManageUsersClient 
        initialUsers={initialUsers} 
        allSchools={allSchools || []} 
        teachers={teachers || []} 
        students={students || []} 
      />
    </div>
  )
}
