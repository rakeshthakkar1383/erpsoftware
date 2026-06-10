"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addStudent } from "@/app/students/actions"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]

type AdmissionClientProps = {
  students: any[]
  years: any[]
  schoolId: number | null
  schoolName?: string
  schoolLogo?: string
}

const emptyForm = {
  full_name: "", class_name: "", mobile: "", gender: "", dob: "", category: "",
}

export default function AdmissionClient({
  students, years,
  schoolId, schoolName, schoolLogo
}: AdmissionClientProps) {
  const router = useRouter()
  const [studentType, setStudentType] = useState<"new" | "old">("new")
  const [form, setForm] = useState({ ...emptyForm })
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [admittedStudentId, setAdmittedStudentId] = useState<number | null>(null)
  const supabase = createClient()

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const bd = new Date(dob)
    const td = new Date()
    let age = td.getFullYear() - bd.getFullYear()
    const m = td.getMonth() - bd.getMonth()
    if (m < 0 || (m === 0 && td.getDate() < bd.getDate())) age--
    return age >= 0 ? `${age} years` : ""
  }

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "class_name" ? e.target.value : e.target.value.toUpperCase() })

  const studentMap: Record<number, any> = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const handleAdmit = async () => {
    setMessage("")
    if (studentType === "new") {
      if (!form.full_name || !form.class_name) { setMessage("Name and Class are required"); return }
      setSaving(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? "")))
      if (schoolId) fd.append("school_id", String(schoolId))
      const activeYear = years.find((y: any) => y.is_active)
      if (activeYear) fd.append("academic_year_id", String(activeYear.id))
      const res = await addStudent(fd)
      if (!res.success) { setMessage(res.message); setSaving(false); return }
      setAdmittedStudentId(res.studentId)
      setMessage("Student admitted successfully!")
      setForm({ ...emptyForm })
    } else {
      if (!selectedStudentId) { setMessage("Select a student"); return }
      setAdmittedStudentId(Number(selectedStudentId))
      setMessage(`Student record selected: ${studentMap[Number(selectedStudentId)]?.full_name}`)
    }
    setSaving(false)
  }

  const goToFees = () => {
    if (admittedStudentId) {
      router.push(`/fees?student_id=${admittedStudentId}`)
    }
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          {schoolLogo && <img src={schoolLogo} alt="" className="h-12 w-12 rounded border object-contain bg-white shadow-sm" />}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{schoolName || "ADMISSION ENTRY"}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">New Admission Entry Form</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex rounded-lg border bg-slate-50 p-1">
            <button
              className={`flex-1 rounded-md py-2.5 text-xs font-black uppercase tracking-widest transition-all ${studentType === "new" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setStudentType("new")}
            >New Student</button>
            <button
              className={`flex-1 rounded-md py-2.5 text-xs font-black uppercase tracking-widest transition-all ${studentType === "old" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setStudentType("old")}
            >Old Student</button>
          </div>

          {studentType === "new" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name *</label>
                <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="STUDENT NAME" value={form.full_name} onChange={setField("full_name")} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard / Class *</label>
                <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.class_name} onChange={setField("class_name")}>
                  <option value="">SELECT CLASS</option>
                  {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number</label>
                <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="MOBILE NO" value={form.mobile} onChange={setField("mobile")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</label>
                  <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.gender} onChange={setField("gender")}>
                    <option value="">SELECT</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                  <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" type="date" value={form.dob} onChange={setField("dob")} />
                  {form.dob && <p className="mt-1 text-right text-xs font-black text-blue-600 uppercase tracking-tight">{calculateAge(form.dob)}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.category} onChange={setField("category")}>
                  <option value="">SELECT CATEGORY</option>
                  <option value="General">GENERAL</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="Other">OTHER</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Existing Student</label>
              <select
                className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                <option value="">SEARCH STUDENT...</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name} (CLASS {s.class_name}{s.division ? ` - ${s.division}` : ""})</option>
                ))}
              </select>
              {selectedStudentId && studentMap[Number(selectedStudentId)] && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs">
                  <p className="font-bold text-blue-700">{studentMap[Number(selectedStudentId)].full_name}</p>
                  <p className="text-blue-600">Class: {studentMap[Number(selectedStudentId)].class_name} | Gender: {studentMap[Number(selectedStudentId)].gender}</p>
                  <p className="text-blue-600">Mobile: {studentMap[Number(selectedStudentId)].mobile || "-"} | Category: {studentMap[Number(selectedStudentId)].category || "-"}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white hover:bg-blue-700 shadow-lg transition-all uppercase tracking-widest disabled:opacity-50"
              onClick={handleAdmit}
              disabled={saving}
            >
              {saving ? "Processing..." : studentType === "new" ? "Admit Student" : "Select Student"}
            </button>
            {admittedStudentId && (
              <button
                className="w-full rounded-xl bg-green-600 py-4 text-sm font-black text-white hover:bg-green-700 shadow-lg transition-all uppercase tracking-widest"
                onClick={goToFees}
              >
                Proceed to Fees
              </button>
            )}
            {message && (
              <p className={`mt-4 rounded-lg p-3 text-xs font-black text-center uppercase tracking-wider ${message.includes("successfully") || message.includes("selected") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
