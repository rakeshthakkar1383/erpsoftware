"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { userRoleOptions } from "@/lib/permissions"
import Link from "next/link"

export const dynamic = "force-dynamic"

const loginRoles = [{ id: "", label: "Select Role" }, ...userRoleOptions]
const defaultSchoolName = "Select Institution"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const schoolIdParam = searchParams.get("school_id")

  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<any>(null)

  useEffect(() => {
    const loadSchool = async () => {
      try {
        const res = await fetch("/api/school-info")
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setSchools(list)

        const targetId = schoolIdParam || (typeof window !== "undefined" ? localStorage.getItem("selected-school-id") : null)
        const school = list.find((s: any) => String(s.id) === String(targetId)) || list[0] || null
        setSelectedSchool(school)
        if (school?.id) {
          localStorage.setItem("selected-school-id", String(school.id))
        }
      } catch {
        setSelectedSchool(null)
      }
    }

    loadSchool()
  }, [schoolIdParam])

  const handleSchoolChange = (schoolId: string) => {
    const found = schools.find((s) => String(s.id) === schoolId)
    if (found) {
      setSelectedSchool(found)
      localStorage.setItem("selected-school-id", String(found.id))
    }
  }

  const trustName = selectedSchool?.trust_name || "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)"
  const trustAddress = selectedSchool?.address || "VASAD, ANAND, GUJARAT 388306"
  const schoolName = selectedSchool?.school_name || defaultSchoolName
  const logoUrl = selectedSchool?.logo_url

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!role) {
      setMessage("Please select a role")
      return
    }

    if (!trimmedEmail || !trimmedPassword) {
      setMessage("Please enter your email and password")
      return
    }

    setLoading(true)
    setMessage("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    })

    if (error) {
      setMessage(error.message || "Invalid login credentials")
    } else {
      if (selectedSchool?.id) {
        localStorage.setItem("selected-school-id", String(selectedSchool.id))
      }
      router.push("/dashboard")
    }

    setLoading(false)
  }

  const resetForm = () => {
    setRole("")
    setEmail("")
    setPassword("")
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-[#f3f0eb] p-0 text-slate-800">
      <div className="mx-auto max-w-[1600px] bg-[#f5f4f2] px-4 py-5 md:px-8 xl:px-10">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" title="Back to Home / School Selection">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#1d4ea1] bg-white text-3xl font-black text-[#1d4ea1] shadow-inner transition hover:scale-105">
                {logoUrl ? (
                  <img src={logoUrl} alt={schoolName} className="h-full w-full object-contain p-1" />
                ) : (
                  <span>{trustName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-4xl">{trustName}</h1>
              <p className="mt-1 text-base text-slate-700 md:text-xl">{trustAddress}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 md:text-3xl">Central ERP System</p>
              <p className="text-sm text-slate-600 md:text-base">Powered By</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f7d95a] text-4xl font-black text-slate-800 shadow-md md:h-20 md:w-20">R</div>
            <div className="text-2xl font-black text-orange-500 md:text-4xl">Rakesh Thakkar</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1d4ea1] hover:underline"
          >
            &larr; Back to All Institutions / Schools
          </Link>
          <button type="button" className="rounded-lg bg-gradient-to-r from-[#7ecdf7] to-[#95d9f7] px-8 py-3 text-xl font-black text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)]">
            Organization Portal
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#bfd6ff] bg-white/60 p-5 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)] backdrop-blur-sm sm:p-7">
          {/* Selected School Banner */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Selected Institution</span>
            <h2 className="text-2xl font-black text-slate-900 uppercase">{schoolName}</h2>
          </div>

          <p className="mb-5 text-center text-xl font-medium text-slate-700">Sign in to continue to your account</p>

          <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
            {/* School Switcher Dropdown */}
            {schools.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select School / Institution
                </label>
                <select
                  value={selectedSchool?.id ? String(selectedSchool.id) : ""}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full rounded-xl border border-[#77a8f1] bg-white px-4 py-3.5 text-base font-bold text-slate-800 outline-none transition focus:border-[#2d6cdf]"
                >
                  {schools.map((s: any) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.school_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="role">
                Select User Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-[#77a8f1] bg-white px-4 py-4 text-lg text-slate-700 outline-none transition focus:border-[#2d6cdf]"
              >
                {loginRoles.map((option) => (
                  <option key={option.id || "select-role"} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5 space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border border-[#86a9d8] bg-white px-4 text-lg text-slate-700 outline-none transition focus:border-[#2d6cdf]"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#86a9d8] bg-white px-4 text-lg text-slate-700 outline-none transition focus:border-[#2d6cdf]"
                />
              </div>
            </div>

            {message && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                {message}
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#2d9ad4] px-5 py-3 text-base font-bold text-white shadow-[0_10px_20px_rgba(45,154,212,0.22)] transition hover:bg-[#287fb7] disabled:cursor-not-allowed disabled:opacity-60 uppercase"
              >
                {loading ? "Processing..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#6eaef8] bg-white px-5 py-3 text-base font-bold text-[#2d6cdf] transition hover:bg-[#eef5ff] uppercase"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center gap-3 text-base text-slate-500">
            <div className="h-px flex-1 bg-slate-300" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center justify-center rounded-[28px] bg-[#f6c84a] px-7 py-3 text-3xl font-black tracking-tight text-[#1c2338] shadow-[0_8px_24px_rgba(246,200,74,0.35)]">
              <span>We are</span>
              <span className="ml-2 inline-block -rotate-3 text-[#ff4a4a]">here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-bold text-slate-600">Loading Login Portal...</div>}>
      <LoginContent />
    </Suspense>
  )
}
