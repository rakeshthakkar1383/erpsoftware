"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { AuthProvider, useUser } from "./auth-provider"
import { createClient } from "@/lib/supabase/client"
import { getAllSchools, switchSchool } from "@/app/manage-schools/actions"
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
    if (["admin", "authority", "principal", "clerk"].includes(user.user_metadata?.role)) {
      getAllSchools().then(setSchools)
    }
  }, [user, loading])

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean)
    const tab = segments.length >= 2 ? `${segments[0]}/${segments[1]}` : (segments[0] || "dashboard")
    setActiveTab(tab)
  }, [pathname])

  const handleSchoolSwitch = useCallback(async (schoolId: number) => {
    await switchSchool(schoolId)
    router.refresh()
  }, [])

  const handleSchoolAdded = useCallback(async () => {
    const updated = await getAllSchools()
    setSchools(updated)
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
  const activeLabel = activeTab
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, " "))
    .map((segment) => segment.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" / ") || "Dashboard"

  return (
    <div className="flex min-h-screen bg-transparent">
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
        onSchoolAdded={handleSchoolAdded}
      />
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_30%)] px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.09)] backdrop-blur-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#1d4ea1] bg-gradient-to-br from-[#d6e9ff] to-[#eff8ff] text-3xl font-black text-[#1d4ea1] shadow-inner">
                  {schoolLogo ? (
                    <img src={schoolLogo} alt={schoolName || "School ERP"} className="h-full w-full rounded-full object-contain" />
                  ) : (
                    <span>{(schoolName || "ERP").slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Central ERP</p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    {schoolName || "School ERP"}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The same bright, color-coded dashboard styling for every page inside the ERP.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-r from-[#7ecdf7] via-[#8ed3f8] to-[#c6e9ff] px-5 py-4 text-right shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-700">Current Section</p>
                <p className="mt-2 text-xl font-black text-slate-900">{activeLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.06)]">
            {children}
          </div>
        </div>
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
