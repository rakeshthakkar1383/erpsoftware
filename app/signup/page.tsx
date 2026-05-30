"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("teacher")
  const [teachers, setTeachers] = useState<any[]>([])
  const [teacherId, setTeacherId] = useState("")
  const [className, setClassName] = useState("")
  const [schools, setSchools] = useState<any[]>([])
  const [schoolId, setSchoolId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/teachers/all").then(r => r.json()).then(setTeachers).catch(() => {})
    fetch("/api/school-info").then(r => r.json()).then(d => setSchools(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) { setMessage("All fields required"); return }
    setLoading(true)
    setMessage("")
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, teacher_id: teacherId, class_name: role === "admin" ? className : null, school_id: schoolId } },
    })
    if (error) { setMessage(error.message) }
    else { router.push("/dashboard") }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">Create Account</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Register a new user</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full rounded-lg border p-3 text-sm" placeholder="FULL NAME" value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} />
          <input className="w-full rounded-lg border p-3 text-sm" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border p-3 text-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <select className="w-full rounded-lg border p-3 text-sm" value={role} onChange={e => setRole(e.target.value)}>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          {role === "teacher" && (
            <select className="w-full rounded-lg border p-3 text-sm" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
              <option value="">Link to Teacher (optional)</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          )}
          <select className="w-full rounded-lg border p-3 text-sm" value={schoolId} onChange={e => setSchoolId(e.target.value)}>
            <option value="">Select School</option>
            {schools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
          </select>
          {role === "admin" && (
            <select className="w-full rounded-lg border p-3 text-sm" value={className} onChange={e => setClassName(e.target.value)}>
              <option value="">All Classes (Super Admin)</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          )}
          {message && <p className="text-sm text-red-600">{message}</p>}
          <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <a className="text-blue-600 hover:underline" href="/login">Sign in</a>
        </p>
      </div>
    </div>
  )
}
