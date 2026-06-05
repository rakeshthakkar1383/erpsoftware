"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { getAllStudents, addStudent, updateStudent, deleteStudent } from "./actions"
import { createClient } from "@/lib/supabase/client"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm: Record<string, string> = {
  full_name: "", gender: "", father_name: "", mother_name: "",
  dob: "", birthplace: "", address: "", village: "", district: "", pincode: "",
  last_school: "", roll_no: "", division: "", class_name: "", stream: "",
  academic_year_id: "", photo_url: "", birth_cert_url: "", aadhar_no: "", aadhar_url: "", father_aadhar_url: "",
  father_mobile: "", mother_mobile: "", category: "", ration_card_url: "", category_cert_url: "",
  gr_no: "", admission_no: ""
}

type StudentsClientProps = {
  students: any[]
  divisions: any[]
  streams: any[]
  years: any[]
  teacherClass: string
  schoolId: number | null
  schoolName?: string
  schoolLogo?: string
}

export default function StudentsClient({ 
  students: initialStudents, divisions, streams, years, teacherClass, schoolId, schoolName, schoolLogo 
}: StudentsClientProps) {
  const [students, setStudents] = useState(initialStudents)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [filterStream, setFilterStream] = useState("")
  const [filterAy, setFilterAy] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [detailStudent, setDetailStudent] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const data = await getAllStudents()
    setStudents(data)
  }, [])

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? `${age} years` : ""
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFormData = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    return fd
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(field)
    const path = `students/${field}/${Date.now()}_${file.name}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm(prev => ({ ...prev, [field]: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(null) }
  }

  const handleSave = async () => {
    if (!form.full_name || !form.class_name) { setMessage("Name and Class are required"); return }
    try {
      const res = editing
        ? await updateStudent(editing.id, toFormData(form))
        : await addStudent(toFormData(form))
      if (!res.success) { setMessage(res.message); return }
      setModal(false)
      await refresh()
    } catch (err: any) {
      setMessage(err.message || "Save failed")
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this student?")) return
    const res = await deleteStudent(id)
    if (!res.success) { setMessage(res.message); return }
    await refresh()
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objUrl; a.download = filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      setTimeout(() => window.URL.revokeObjectURL(objUrl), 1000)
    } catch { alert("Download failed") }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/excel/import/students", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} students. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const q = search.toLowerCase()
  const filtered = students.filter((s: any) => {
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    if (filterStream && s.stream !== filterStream) return false
    if (filterAy && String(s.academic_year_id) !== filterAy) return false
    if (q && ![s.full_name, s.gender, s.father_name, s.mother_name, s.class_name, s.division, s.stream, s.address, s.village, s.district, String(s.roll_no || ""), String(s.gr_no || "")].some((v: any) => v?.toLowerCase().includes(q))) return false
    return true
  })

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          {schoolLogo && <img src={schoolLogo} alt="" className="h-12 w-12 rounded border object-contain bg-white shadow-sm" />}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{schoolName || "STUDENT MANAGEMENT"}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Administrative Data Center</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-200 uppercase tracking-widest transition-all" onClick={() => downloadFile("/api/excel/template/students", "students_template.xlsx")}>Download Template</button>
          <button className="rounded bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-200 uppercase tracking-widest transition-all" onClick={() => fileInputRef.current?.click()}>Bulk Import</button>
          <button className="rounded bg-blue-600 px-6 py-2 text-xs font-black text-white hover:bg-blue-700 uppercase tracking-widest shadow-lg transition-all"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>
            + Register New Student
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative group">
           <input className="w-64 rounded-lg border bg-white p-2.5 pl-10 text-sm shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search by name, GR, roll..." value={search} onChange={e => setSearch(e.target.value)} />
           <span className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500">🔍</span>
        </div>
        <select className="rounded-lg border bg-white p-2.5 text-sm shadow-sm font-semibold text-slate-600" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv(""); setFilterStream("") }} disabled={!!teacherClass}>
          <option value="">ALL CLASSES</option>
          {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
        </select>
        <select className="rounded-lg border bg-white p-2.5 text-sm shadow-sm font-semibold text-slate-600" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">ALL DIVISIONS</option>
          {divisions.filter((d: any) => d.class_name === filterClass || !filterClass).map((d: any) => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <select className="rounded-lg border bg-white p-2.5 text-sm shadow-sm font-semibold text-slate-600" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
          <option value="">ALL YEARS</option>
          {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
        </select>
        <span className="ml-auto text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} Students listed</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-slate-50/50 p-20 text-center">
           <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No students matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">GR No</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Class/Div</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">DOB</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((s: any, i: number) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-6 py-4 text-xs font-black text-blue-600">{s.gr_no || "-"}</td>
                  <td className="px-6 py-4 text-xs font-bold">{s.roll_no || "-"}</td>
                  <td className="px-6 py-4">
                    <button className="font-bold text-slate-800 hover:text-blue-600 transition-colors" onClick={() => router.push(`/students/${s.id}`)}>{s.full_name}</button>
                  </td>
                  <td className="px-6 py-4 font-semibold text-xs">
                    {s.class_name}{s.division ? ` / ${s.division}` : ""}
                  </td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>{s.gender}</span></td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{s.dob || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800" onClick={() => { setEditing(s); setForm({ ...s, academic_year_id: s.academic_year_id || "" }); setMessage(""); setModal(true) }}>Edit Profile</button>
                    <button className="ml-4 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800" onClick={() => handleDelete(s.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editing ? "Update Student Profile" : "New Student Registration"}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Complete all required student information</p>
              </div>
              <button className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="grid gap-10">
               {/* Header Section: Photo and Identity */}
               <div className="flex flex-col gap-8 md:flex-row">
                  <div className="w-full md:w-1/4">
                     <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Student Passport Photo</label>
                     <div className="relative group h-52 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-400">
                        {form.photo_url ? (
                          <img src={form.photo_url} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <span className="text-4xl">🎓</span>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">Upload Photo</p>
                          </div>
                        )}
                        <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" onChange={e => handleFileUpload(e, "photo_url")} />
                        {uploading === "photo_url" && <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest animate-pulse">Uploading...</div>}
                     </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name of Student *</label>
                        <input className="w-full rounded-lg border bg-white p-4 text-sm font-bold shadow-sm placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="FULL NAME (LAST, FIRST, MIDDLE)" value={form.full_name} onChange={set("full_name")} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GR Number *</label>
                        <input className="w-full rounded-lg border bg-blue-50/50 border-blue-100 p-4 text-sm font-black text-blue-700 shadow-sm" placeholder="GR NO" value={form.gr_no} onChange={set("gr_no")} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</label>
                        <select className="w-full rounded-lg border bg-white p-4 text-sm font-bold shadow-sm" value={form.gender} onChange={set("gender")}>
                          <option value="">SELECT GENDER</option>
                          <option value="MALE">MALE</option>
                          <option value="FEMALE">FEMALE</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                        <div className="flex gap-2">
                           <input className="flex-1 rounded-lg border bg-white p-4 text-sm font-bold shadow-sm" type="date" value={form.dob} onChange={set("dob")} />
                           {form.dob && <span className="flex items-center rounded-lg bg-blue-600 px-3 text-[10px] font-black text-white uppercase tracking-tighter">{calculateAge(form.dob)}</span>}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number</label>
                        <input className="w-full rounded-lg border bg-white p-4 text-sm font-bold shadow-sm" placeholder="CONTACT NO" value={form.mobile} onChange={set("mobile")} />
                     </div>
                  </div>
               </div>

               {/* Section 2: Family and Academic Details */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h4 className="border-b-2 border-blue-600 text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] pb-1">Academic Assignment</h4>
                     <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Class *</label>
                           <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.class_name} onChange={set("class_name")}>
                              <option value="">SELECT CLASS</option>
                              {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Division</label>
                           <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.division} onChange={set("division")}>
                              <option value="">SELECT DIV</option>
                              {divisions.filter((d: any) => d.class_name === form.class_name).map((d: any) => (
                                <option key={d.id} value={d.division_name}>{d.division_name}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Roll Number</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" type="number" placeholder="ROLL NO" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Admission No</label>
                            <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="ADM NO" value={form.admission_no} onChange={set("admission_no")} />
                         </div>
                          <div className="col-span-2 space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase">Aadhar Number</label>
                             <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="12-DIGIT AADHAR NO" value={form.aadhar_no} onChange={set("aadhar_no")} />
                          </div>
                          <div className="col-span-2 space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase">Last School</label>
                             <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="LAST SCHOOL NAME" value={form.last_school} onChange={set("last_school")} />
                          </div>
                       </div>
                  </div>

                   <div className="space-y-6">
                      <h4 className="border-b-2 border-orange-500 text-[11px] font-black text-orange-600 uppercase tracking-[0.2em] pb-1">Family Details</h4>
                      <div className="grid grid-cols-1 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Father's Name</label>
                            <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="FATHER'S FULL NAME" value={form.father_name} onChange={set("father_name")} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Father's Mobile</label>
                            <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="FATHER'S CONTACT NO" value={form.father_mobile} onChange={set("father_mobile")} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mother's Name</label>
                            <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="MOTHER'S FULL NAME" value={form.mother_name} onChange={set("mother_name")} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mother's Mobile</label>
                            <input className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" placeholder="MOTHER'S CONTACT NO" value={form.mother_mobile} onChange={set("mother_mobile")} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                            <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm" value={form.category} onChange={set("category")}>
                              <option value="">SELECT CATEGORY</option>
                              <option value="General">General</option>
                              <option value="OBC">OBC</option>
                              <option value="SC">SC</option>
                              <option value="ST">ST</option>
                              <option value="EWS">EWS</option>
                              <option value="Other">Other</option>
                            </select>
                         </div>
                       </div>
                     </div>
                </div>

                {/* Section 3: Location and Last School */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50/50 p-6 rounded-2xl border">
                  <div className="md:col-span-2 space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Residential Information</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Full Address</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm" placeholder="HOUSE NO, STREET, AREA" value={form.address} onChange={set("address")} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Village/City</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm" placeholder="VILLAGE/CITY" value={form.village} onChange={set("village")} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">District</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm" placeholder="DISTRICT" value={form.district} onChange={set("district")} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Pincode</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm" placeholder="6-DIGIT PIN" value={form.pincode} onChange={set("pincode")} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Birth Place</label>
                           <input className="w-full rounded-lg border bg-white p-3 text-sm" placeholder="BIRTH TOWN" value={form.birthplace} onChange={set("birthplace")} />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Previous Academic</h4>
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Last School Attended</label>
                           <textarea className="w-full rounded-lg border bg-white p-3 text-sm font-medium" rows={3} placeholder="SCHOOL NAME AND CITY" value={form.last_school} onChange={set("last_school")} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Academic Year</label>
                           <select className="w-full rounded-lg border bg-white p-3 text-sm font-bold shadow-sm text-blue-600" value={form.academic_year_id} onChange={e => setForm({ ...form, academic_year_id: e.target.value })}>
                             <option value="">SELECT YEAR</option>
                             {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Section 4: Document Uploads */}
               <div className="space-y-6">
                  <h4 className="border-b-2 border-green-600 text-[11px] font-black text-green-700 uppercase tracking-[0.2em] pb-1">Required Document Uploads</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { label: "Birth Certificate", field: "birth_cert_url" },
                        { label: "Student Aadhar Card", field: "aadhar_url" },
                        { label: "Father's Aadhar Card", field: "father_aadhar_url" },
                        { label: "Ration Card", field: "ration_card_url" },
                        { label: "Category Certificate", field: "category_cert_url" }
                      ].map(doc => (
                       <div key={doc.field} className="relative rounded-xl border p-4 transition-all hover:bg-slate-50">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">{doc.label}</label>
                          <div className="flex items-center gap-3">
                             <input type="file" className="text-[10px] flex-1 font-bold text-slate-400" accept=".pdf,image/*" onChange={e => handleFileUpload(e, doc.field)} />
                             {form[doc.field] && (
                               <a href={form[doc.field]} target="_blank" className="rounded bg-green-50 px-3 py-1 text-[10px] font-black text-green-600 uppercase tracking-tighter hover:bg-green-100 transition-colors">View</a>
                             )}
                          </div>
                          {uploading === doc.field && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-black text-blue-600 animate-pulse">Uploading Document...</div>}
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {message && <p className="mt-8 rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-black text-red-600 uppercase text-center">{message}</p>}

            <div className="mt-10 flex gap-4 border-t pt-8">
              <button className="flex-1 rounded-2xl bg-blue-600 px-8 py-5 text-sm font-black text-white hover:bg-blue-700 shadow-2xl tracking-widest transition-all uppercase" onClick={handleSave}>{editing ? "Update Profile Data" : "Register Student Record"}</button>
              <button className="rounded-2xl bg-slate-100 px-10 py-5 text-sm font-black text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest" onClick={() => setModal(false)}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
