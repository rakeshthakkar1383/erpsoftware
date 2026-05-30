"use client"

import { useState, useCallback, useRef } from "react"
import { getAllStudents, addStudent, updateStudent, deleteStudent } from "./actions"
import { createClient } from "@/lib/supabase/client"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm = {
  full_name: "", gender: "", father_name: "", mother_name: "",
  dob: "", birthplace: "", address: "", village: "", district: "",
  city: "", last_school: "", roll_no: "", division: "", class_name: "", stream: "",
  academic_year_id: "", photo_url: "", birth_cert_url: "", aadhar_url: "", father_aadhar_url: "",
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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFormData = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    return fd
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file || !schoolId) return
    setUploading(field)
    const ext = file.name.split(".").pop()
    const path = `${schoolId}/students/${Date.now()}_${field}.${ext}`
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
      if (editing) {
        await updateStudent(editing.id, toFormData(form))
      } else {
        await addStudent(toFormData(form))
      }
      setModal(false)
      refresh()
    } catch (err: any) {
      setMessage(err.message || "Save failed")
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this student?")) return
    await deleteStudent(id)
    refresh()
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
    if (q && ![s.full_name, s.gender, s.father_name, s.mother_name, s.class_name, s.division, s.stream, s.address, s.village, s.district, s.city, s.last_school, String(s.roll_no || "")].some((v: any) => v?.toLowerCase().includes(q))) return false
    return true
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          {schoolLogo && <img src={schoolLogo} alt="" className="h-12 w-12 rounded border object-contain bg-white" />}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase">{schoolName || "STUDENTS"}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Student Management System</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 uppercase tracking-tighter" onClick={() => downloadFile("/api/excel/template/students", "students_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 uppercase tracking-tighter" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 uppercase tracking-tighter"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>
            Add New
          </button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm font-medium text-blue-700">{message}</p>}

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv(""); setFilterStream("") }} disabled={!!teacherClass}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.filter((d: any) => d.class_name === filterClass || !filterClass).map((d: any) => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <select className="rounded border p-2 text-sm" value={filterStream} onChange={e => setFilterStream(e.target.value)}>
          <option value="">All Streams</option>
          {streams.filter((s: any) => s.class_name === filterClass || !filterClass).map((s: any) => (
            <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
          ))}
        </select>
        <select className="rounded border p-2 text-sm" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
          <option value="">All Years</option>
          {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} students</span>
      </div>

      {filtered.length === 0 ? <p>No students found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Roll No</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Father</th>
                <th className="px-3 py-2">Mother</th>
                <th className="px-3 py-2">DOB</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((s: any, i: number) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{s.roll_no || "-"}</td>
                  <td className="px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => setDetailStudent(s)}>{s.full_name}</button>
                  </td>
                  <td className="px-3 py-2">{s.gender}</td>
                  <td className="px-3 py-2">{s.father_name}</td>
                  <td className="px-3 py-2">{s.mother_name}</td>
                  <td className="px-3 py-2">{s.dob}</td>
                  <td className="px-3 py-2">{s.class_name}</td>
                  <td className="px-3 py-2">{s.division || "-"}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(s); setForm({ ...s, academic_year_id: s.academic_year_id || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailStudent(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Student Details</h3>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setDetailStudent(null)}>&#10005;</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {detailStudent.full_name}</div>
              <div><span className="font-medium">Roll No:</span> {detailStudent.roll_no || "-"}</div>
              <div><span className="font-medium">Gender:</span> {detailStudent.gender}</div>
              <div><span className="font-medium">Father:</span> {detailStudent.father_name}</div>
              <div><span className="font-medium">Mother:</span> {detailStudent.mother_name}</div>
              <div><span className="font-medium">DOB:</span> {detailStudent.dob} ({calculateAge(detailStudent.dob)})</div>
              <div><span className="font-medium">Birth Place:</span> {detailStudent.birthplace}</div>
              <div><span className="font-medium">Address:</span> {detailStudent.address}</div>
              <div><span className="font-medium">Village:</span> {detailStudent.village}</div>
              <div><span className="font-medium">District:</span> {detailStudent.district}</div>
              <div><span className="font-medium">City:</span> {detailStudent.city || "-"}</div>
              <div><span className="font-medium">Last School:</span> {detailStudent.last_school || "-"}</div>
              <div><span className="font-medium">Class:</span> {detailStudent.class_name}</div>
              <div><span className="font-medium">Division:</span> {detailStudent.division || "-"}</div>
              <div><span className="font-medium">Stream:</span> {detailStudent.stream || "-"}</div>
            </div>
            {(detailStudent.photo_url || detailStudent.birth_cert_url || detailStudent.aadhar_url || detailStudent.father_aadhar_url) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {detailStudent.photo_url && (
                  <div>
                    <p className="mb-1 text-xs font-medium">Photo</p>
                    <img src={detailStudent.photo_url} alt="" className="h-32 w-32 rounded border object-cover" />
                  </div>
                )}
                {detailStudent.birth_cert_url && <div><p className="mb-1 text-xs font-medium">Birth Certificate</p><a className="text-blue-600 hover:underline" href={detailStudent.birth_cert_url} target="_blank" rel="noopener noreferrer">View Document</a></div>}
                {detailStudent.aadhar_url && <div><p className="mb-1 text-xs font-medium">Aadhar</p><a className="text-blue-600 hover:underline" href={detailStudent.aadhar_url} target="_blank" rel="noopener noreferrer">View Document</a></div>}
                {detailStudent.father_aadhar_url && <div><p className="mb-1 text-xs font-medium">Father's Aadhar</p><a className="text-blue-600 hover:underline" href={detailStudent.father_aadhar_url} target="_blank" rel="noopener noreferrer">View Document</a></div>}
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-4 border-b pb-4">
              {schoolLogo && <img src={schoolLogo} alt="Logo" className="h-12 w-12 rounded border object-contain bg-slate-50" />}
              <div>
                <h3 className="text-xl font-bold text-slate-800">{schoolName || "SCHOOL ERP"}</h3>
                <p className="text-sm font-semibold text-blue-600">{editing ? "EDIT STUDENT" : "ADD NEW STUDENT"}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Student Name *</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="STUDENT NAME" value={form.full_name} onChange={set("full_name")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                <select className="w-full rounded border p-3 text-sm" value={form.gender} onChange={set("gender")}>
                  <option value="">GENDER</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Father's Name</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="FATHER'S NAME" value={form.father_name} onChange={set("father_name")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mother's Name</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="MOTHER'S NAME" value={form.mother_name} onChange={set("mother_name")} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth</label>
                  {form.dob && <span className="text-[10px] font-bold text-blue-600">{calculateAge(form.dob)}</span>}
                </div>
                <input className="w-full rounded border p-3 text-sm" type="date" value={form.dob} onChange={set("dob")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Birth Place</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="BIRTH PLACE" value={form.birthplace} onChange={set("birthplace")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Address</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="ADDRESS" value={form.address} onChange={set("address")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Village</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="VILLAGE" value={form.village} onChange={set("village")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">District</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="DISTRICT" value={form.district} onChange={set("district")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">City</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="CITY" value={form.city} onChange={set("city")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Last School</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="LAST SCHOOL" value={form.last_school} onChange={set("last_school")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Roll No</label>
                <input className="w-full rounded border p-3 text-sm" type="number" placeholder="ROLL NO" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Class *</label>
                <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set("class_name")}>
                  <option value="">CLASS *</option>
                  {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Division</label>
                <select className="w-full rounded border p-3 text-sm" value={form.division} onChange={set("division")}>
                  <option value="">DIVISION</option>
                  {divisions.filter((d: any) => d.class_name === form.class_name).map((d: any) => (
                    <option key={d.id} value={d.division_name}>{d.division_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Stream</label>
                <select className="w-full rounded border p-3 text-sm" value={form.stream} onChange={set("stream")}>
                  <option value="">STREAM</option>
                  {streams.filter((s: any) => s.class_name === form.class_name).map((s: any) => (
                    <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Academic Year</label>
                <select className="w-full rounded border p-3 text-sm" value={form.academic_year_id} onChange={e => setForm({ ...form, academic_year_id: e.target.value })}>
                  <option value="">ACADEMIC YEAR</option>
                  {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                </select>
              </div>

              <div className="md:col-span-3 mt-2 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Upload Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Photo</label>
                    <input type="file" className="w-full text-xs" accept="image/*" onChange={e => handleFileUpload(e, "photo_url")} />
                    {uploading === "photo_url" && <p className="text-[10px] text-blue-600">Uploading...</p>}
                    {form.photo_url && <p className="text-[10px] text-green-600">Uploaded</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Birth Certificate</label>
                    <input type="file" className="w-full text-xs" accept=".pdf,image/*" onChange={e => handleFileUpload(e, "birth_cert_url")} />
                    {uploading === "birth_cert_url" && <p className="text-[10px] text-blue-600">Uploading...</p>}
                    {form.birth_cert_url && <p className="text-[10px] text-green-600">Uploaded</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Aadhar Card</label>
                    <input type="file" className="w-full text-xs" accept=".pdf,image/*" onChange={e => handleFileUpload(e, "aadhar_url")} />
                    {uploading === "aadhar_url" && <p className="text-[10px] text-blue-600">Uploading...</p>}
                    {form.aadhar_url && <p className="text-[10px] text-green-600">Uploaded</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Father's Aadhar</label>
                    <input type="file" className="w-full text-xs" accept=".pdf,image/*" onChange={e => handleFileUpload(e, "father_aadhar_url")} />
                    {uploading === "father_aadhar_url" && <p className="text-[10px] text-blue-600">Uploading...</p>}
                    {form.father_aadhar_url && <p className="text-[10px] text-green-600">Uploaded</p>}
                  </div>
                </div>
              </div>
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-6 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : "Save"}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
