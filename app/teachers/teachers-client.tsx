"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } from "./actions"
import { createClient } from "@/lib/supabase/client"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm = { 
  full_name: "", mobile: "", salary: "", email: "",
  address: "", city: "", district: "", pincode: "", state: "",
  dob: "", joining_date: "", photo_url: "",
  education_ssc: "", education_hsc: "", education_ug: "", education_pg: "", education_other: "",
  classes: "", subjects: "", school_id: "",
  aadhar_no: "", pan_no: "", designation: "", basic_pay: "", grade_pay: "",
  staff_code: "", gender: "", bank_account_no: "", bank_ifsc: "", bank_name: "",
  blood_group: "", marital_status: "", aadhar_url: "", pan_url: ""
}

export default function TeachersClient({ allSchools, schoolId, allSubjects, allTrusts }: { allSchools: any[], schoolId: number | null, allSubjects: any[], allTrusts: any[] }) {
  const [teachers, setTeachers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const data = await getAllTeachers()
    setTeachers(data)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const calculateAgeAndRetirement = (dob: string) => {
    if (!dob) return { age: "", retirement: "" }
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    
    // Retirement at 60 (standard)
    const retire = new Date(birthDate)
    retire.setFullYear(retire.getFullYear() + 60)
    return { age: age >= 0 ? `${age} years` : "", retirement: retire.toISOString().split("T")[0] }
  }

  const { age, retirement } = calculateAgeAndRetirement(form.dob)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    const noUpper = ["dob", "joining_date", "photo_url", "aadhar_url", "pan_url", "email"]
    setForm({ ...form, [field]: noUpper.includes(field) ? val : val.toUpperCase() })
  }

  const toggleMulti = (field: "classes" | "subjects", val: string) => {
    const current = (form[field] || "").split(",").filter(Boolean)
    const next = current.includes(val) ? current.filter((x: string) => x !== val) : [...current, val]
    setForm({ ...form, [field]: next.join(",") })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(field)
    const path = `teachers/${field}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from("school-files").upload(path, file)
    if (error) { setMessage("Upload failed: " + error.message); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
    setForm({ ...form, [field]: publicUrl })
    setUploading(null)
  }

  const toFD = (obj: any) => { 
    const fd = new FormData(); 
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); 
    if (retirement) fd.append("retirement_date", retirement)
    return fd 
  }

  const handleSave = async () => {
    if (!form.full_name) { setMessage("Name is required"); return }
    const res = editing ? await updateTeacher(editing.id, toFD(form)) : await addTeacher(toFD(form))
    if (res.success) {
      setModal(false)
      refresh()
    } else {
      setMessage(res.message || "Error saving teacher")
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this teacher?")) return
    await deleteTeacher(id)
    refresh()
  }

  const q = search.toLowerCase()
  const filtered = teachers.filter((t: any) => !q || [t.full_name, t.subjects, t.mobile, t.staff_code, t.designation].some((v: any) => v?.toLowerCase().includes(q)))

  const distinctSubjects = Array.from(new Set(allSubjects.map(s => s.subject_name.toUpperCase())))

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Teacher Management</h2>
        <button className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md"
          onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>
          Add New Teacher
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input className="w-64 rounded-lg border p-2.5 text-sm shadow-sm" placeholder="Search by name, code, subject..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="text-sm font-medium text-slate-500">{filtered.length} Teachers found</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-slate-400">No teachers found. Click "Add New Teacher" to get started.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Subjects</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((t: any, i: number) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{t.staff_code || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       {t.photo_url ? <img src={t.photo_url} className="h-6 w-6 rounded-full border object-cover" /> : <div className="h-6 w-6 rounded-full bg-slate-100" />}
                       <span className="font-semibold">{t.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{t.designation || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.subjects?.split(",").filter(Boolean).map((s: string) => <span key={s} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{t.mobile}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs" onClick={() => { setEditing(t); setForm({ ...t, school_id: String(t.school_id || "") }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="ml-3 text-red-600 hover:text-red-800 font-medium text-xs" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editing ? "Edit Teacher Profile" : "Add New Teacher"}</h3>
                <p className="text-xs text-slate-400 uppercase tracking-tighter">Please fill all mandatory fields marked with *</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="grid gap-8">
              {/* Profile Header Block */}
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="w-full md:w-1/4">
                   <div className="relative group h-48 w-full rounded-lg border-2 border-dashed bg-slate-50 flex items-center justify-center overflow-hidden border-slate-300">
                      {form.photo_url ? (
                        <img src={form.photo_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <span className="text-3xl">👤</span>
                          <p className="text-[10px] mt-1 font-bold">PROFILE PHOTO</p>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" onChange={(e) => handleFileUpload(e, "photo_url")} />
                      {uploading === "photo_url" && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-blue-600 font-bold text-xs">Uploading...</div>}
                    </div>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Teacher Name *</label>
                    <input className="w-full rounded border p-3 text-sm font-semibold" placeholder="FULL NAME" value={form.full_name} onChange={set("full_name")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Staff Code / ID</label>
                    <input className="w-full rounded border p-3 text-sm" placeholder="STAFF CODE" value={form.staff_code} onChange={set("staff_code")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Designation</label>
                    <input className="w-full rounded border p-3 text-sm" placeholder="e.g. SR. TEACHER" value={form.designation} onChange={set("designation")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                    <select className="w-full rounded border p-3 text-sm" value={form.gender} onChange={set("gender")}>
                      <option value="">SELECT</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Group</label>
                    <select className="w-full rounded border p-3 text-sm" value={form.blood_group} onChange={set("blood_group")}>
                      <option value="">SELECT</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Marital Status</label>
                    <select className="w-full rounded border p-3 text-sm" value={form.marital_status} onChange={set("marital_status")}>
                      <option value="">SELECT</option>
                      <option value="SINGLE">SINGLE</option>
                      <option value="MARRIED">MARRIED</option>
                      <option value="DIVORCED">DIVORCED</option>
                      <option value="WIDOWED">WIDOWED</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                    <input className="w-full rounded border p-3 text-sm" placeholder="MOBILE" value={form.mobile} onChange={set("mobile")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                    <input className="w-full rounded border p-3 text-sm" type="email" placeholder="EMAIL" value={form.email} onChange={set("email")} />
                  </div>
                </div>
              </div>

              {/* School & Trust Info */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Appointed School / Trust</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!schoolId ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">School *</label>
                      <select className="w-full rounded border p-3 text-sm" value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value })}>
                        <option value="">SELECT SCHOOL</option>
                        {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">School Name</label>
                      <div className="w-full rounded bg-white border p-3 text-sm font-semibold text-slate-700">
                        {allSchools.find((s: any) => s.id === Number(schoolId))?.school_name || "-"}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Trust Name</label>
                    <div className="w-full rounded bg-white border p-3 text-sm font-semibold text-slate-700">
                      {(() => {
                        const sid = Number(form.school_id || schoolId)
                        const trust = allTrusts.find((t: any) => t.school_id === sid)
                        return trust?.trust_name || "-"
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal & Identification Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 space-y-4">
                    <h4 className="border-b-2 border-blue-600 text-[10px] font-black text-blue-600 uppercase tracking-widest pb-1">Identification & Career</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Aadhar Number</label>
                          <input className="w-full rounded border p-3 text-sm" placeholder="AADHAR NO" value={form.aadhar_no} onChange={set("aadhar_no")} />
                       </div>
                       <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">PAN Number</label>
                          <input className="w-full rounded border p-3 text-sm" placeholder="PAN NO" value={form.pan_no} onChange={set("pan_no")} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Birth Date</label>
                          <input className="w-full rounded border p-3 text-sm" type="date" value={form.dob} onChange={set("dob")} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Age</label>
                          <div className="w-full rounded bg-slate-50 border p-3 text-sm font-bold text-slate-600">{age || "-"}</div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Joining Date</label>
                          <input className="w-full rounded border p-3 text-sm" type="date" value={form.joining_date} onChange={set("joining_date")} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Retirement</label>
                          <div className="w-full rounded bg-orange-50 border border-orange-200 p-3 text-xs font-bold text-orange-700">{retirement || "-"}</div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="border-b-2 border-green-600 text-[10px] font-black text-green-600 uppercase tracking-widest pb-1">Payroll Details</h4>
                    <div className="space-y-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Total Monthly Salary</label>
                          <input className="w-full rounded border p-3 text-sm font-bold text-green-700" type="number" placeholder="GROSS SALARY" value={form.salary} onChange={set("salary")} />
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Basic Pay</label>
                             <input className="w-full rounded border p-2 text-sm" type="number" placeholder="BASIC" value={form.basic_pay} onChange={set("basic_pay")} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Grade Pay</label>
                             <input className="w-full rounded border p-2 text-sm" type="number" placeholder="GRADE" value={form.grade_pay} onChange={set("grade_pay")} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Assignment & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Class & Subject Assignments</h4>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Classes (Select Multiple)</label>
                          <div className="flex flex-wrap gap-1">
                             {classes.map(c => (
                               <button key={c} type="button" 
                                 className={`rounded px-2 py-1 text-[10px] font-bold border ${form.classes?.split(",").includes(c) ? "bg-blue-600 border-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                                 onClick={() => toggleMulti("classes", c)}>CL-{c}</button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Subjects (Select Multiple)</label>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto bg-white p-2 border rounded">
                             {distinctSubjects.map((s: any) => (
                               <button key={s} type="button"
                                 className={`rounded-full px-2 py-0.5 text-[9px] font-black border uppercase ${form.subjects?.split(",").includes(s) ? "bg-green-600 border-green-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                                 onClick={() => toggleMulti("subjects", s)}>{s}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Education & Bank</h4>
                    <div className="grid grid-cols-2 gap-3">
                       <input className="w-full rounded border px-3 py-2 text-xs" placeholder="SSC (%)" value={form.education_ssc} onChange={set("education_ssc")} />
                       <input className="w-full rounded border px-3 py-2 text-xs" placeholder="HSC (%)" value={form.education_hsc} onChange={set("education_hsc")} />
                       <input className="w-full rounded border px-3 py-2 text-xs col-span-2" placeholder="GRADUATION" value={form.education_ug} onChange={set("education_ug")} />
                       <input className="w-full rounded border px-2 py-2 text-[10px] font-bold" placeholder="BANK ACCOUNT NO" value={form.bank_account_no} onChange={set("bank_account_no")} />
                       <input className="w-full rounded border px-2 py-2 text-[10px] font-bold" placeholder="IFSC CODE" value={form.bank_ifsc} onChange={set("bank_ifsc")} />
                    </div>
                 </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Aadhar Card Copy</label>
                    <div className="flex items-center gap-2">
                       <input type="file" className="text-[10px] flex-1" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "aadhar_url")} />
                       {form.aadhar_url && <a href={form.aadhar_url} target="_blank" className="text-[10px] text-blue-600 font-bold underline">VIEW</a>}
                    </div>
                    {uploading === "aadhar_url" && <p className="text-[9px] text-blue-500 font-bold animate-pulse">UPLOADING...</p>}
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">PAN Card Copy</label>
                    <div className="flex items-center gap-2">
                       <input type="file" className="text-[10px] flex-1" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "pan_url")} />
                       {form.pan_url && <a href={form.pan_url} target="_blank" className="text-[10px] text-blue-600 font-bold underline">VIEW</a>}
                    </div>
                    {uploading === "pan_url" && <p className="text-[9px] text-blue-500 font-bold animate-pulse">UPLOADING...</p>}
                 </div>
              </div>
            </div>

            {message && <p className="mt-6 rounded bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 uppercase">{message}</p>}

            <div className="mt-8 flex gap-3 border-t pt-6">
              <button className="flex-1 rounded-lg bg-blue-600 px-6 py-4 text-sm font-black text-white hover:bg-blue-700 shadow-xl tracking-widest transition-all" onClick={handleSave}>{editing ? "UPDATE TEACHER PROFILE" : "CREATE TEACHER RECORD"}</button>
              <button className="rounded-lg bg-slate-100 px-8 py-4 text-sm font-black text-slate-500 hover:bg-slate-200 transition-all" onClick={() => setModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
