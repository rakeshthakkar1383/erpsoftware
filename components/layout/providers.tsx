"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { AuthProvider, useUser } from "./auth-provider"
import { createClient } from "@/lib/supabase/client"
import { getAllSchools, switchSchool } from "@/app/school-info/actions"
import Sidebar from "./sidebar"

const publicPaths = ["/login", "/signup", "/forgot-password"]

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [schoolName, setSchoolName] = useState("")
  const [schoolLogo, setSchoolLogo] = useState("")
  const [schools, setSchools] = useState<any[]>([])

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (!user || loading) return
    const schoolId = user.user_metadata?.school_id
    if (schoolId) {
      supabase.from("school_info").select("school_name, logo_url").eq("id", schoolId).single().then(
        ({ data }) => { 
          if (data) {
            setSchoolName(data.school_name || "")
            setSchoolLogo(data.logo_url || "")
          }
        }
      )
    }
    if (user.user_metadata?.role === "admin") {
      getAllSchools().then(setSchools)
    }
  }, [user, loading])

  useEffect(() => {
    const tab = pathname.split("/").filter(Boolean)[0] || "dashboard"
    setActiveTab(tab)
  }, [pathname])

  const handleSchoolSwitch = useCallback(async (schoolId: number) => {
    await switchSchool(schoolId)
    router.refresh()
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }, [])

  if (isPublic) return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const teacherClass = user.user_metadata?.class_name || ""

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        user={user}
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        schools={schools}
        teacherClass={teacherClass}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); router.push(`/${tab}`) }}
        onLogout={handleLogout}
        onSchoolSwitch={handleSchoolSwitch}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
