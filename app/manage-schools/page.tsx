import { createClient } from "@/lib/supabase/server"
import ManageSchoolsClient from "./manage-schools-client"
import { getAllSchools } from "../school-info/actions"

export const dynamic = "force-dynamic"

export default async function ManageSchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.role !== "admin") {
    return <div>Unauthorized</div>
  }

  const schools = await getAllSchools()

  return <ManageSchoolsClient initialSchools={schools} />
}
