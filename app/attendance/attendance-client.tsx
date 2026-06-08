"use client"

import { useState, useCallback, useRef } from "react"
import { getAllAttendance, addAttendance, updateAttendance, deleteAttendance } from "./actions"
import { formatDate } from "@/lib/utils"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const emptyForm: Record<string, string> = { student_id: "", attendance_date: "", status: "" }

export default function AttendanceClient({ initialRecords, students, divisions, allSchools, schoolId, teacherClass }: { initialRecords: any[], students: any[], divisions: any[], allSchools: any[], schoolId: number | null, teacherClass: string }) {
  const [records, setRecords] = useState(initialRecords)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentMap: any = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const refresh = useCallback(async () => { setRecords(await getAllAttendance()) }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const filteredStudents = students.filter((s: any) => {
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    return true
  })
  const filteredStudentIds = new Set(filteredStudents.map((s: any) => s.id))
  const q = search.toLowerCase()
  const filtered = records.filter((r: any) => {
    if (!filteredStudentIds.has(r.student_id)) return false
    if (!q) return true
    const s = studentMap[r.student_id]
    return [r.attendance_date, r.status, s?.full_name, s?.class_name].some((v: any) => v?.toLowerCase().includes(q))
  })

  const handleSave = async () => {
    if (!form.student_id || !form.attendance_date || !form.status) { setMessage("All fields are required"); return }
    if (editing) { await updateAttendance(editing.id, toFD(form)) } else { await addAttendance(toFD(form)) }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this attendance record?")) return
    await deleteAttendance(id); refresh()
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
      const res = await fetch("/api/excel/import/attendance", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} records. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Attendance</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadFile("/api/excel/template/attendance", "attendance_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv("") }} disabled={!!teacherClass}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.filter((d: any) => d.class_name === filterClass || !filterClass).map((d: any) => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} records</span>
      </div>
      {filtered.length === 0 ? <p>No attendance records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((r: any, i: number) => {
                const s = studentMap[r.student_id]
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : r.student_id}</td>
                    <td className="px-3 py-2">{formatDate(r.attendance_date)}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => { setEditing(r); setForm({ ...r }); setMessage(""); setModal(true) }}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Attendance" : "Add Attendance"}</h3>
            <div className="grid gap-3">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              <select className="w-full rounded border p-3 text-sm" value={form.student_id} onChange={set("student_id")}>
                <option value="">Select Student *</option>
                {filteredStudents.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                ))}
              </select>
              <input className="w-full rounded border p-3 text-sm" type="date" value={form.attendance_date} onChange={set("attendance_date")} />
              <select className="w-full rounded border p-3 text-sm" value={form.status} onChange={set("status")}>
                <option value="">Status *</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : "Save"}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
