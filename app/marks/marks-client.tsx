"use client"

import { useState, useCallback, useRef } from "react"
import { getAllMarks, addMark, updateMark, deleteMark } from "./actions"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const semesters = ["SEM 1", "SEM 2"]
const emptyForm: Record<string, string> = { student_id: "", exam_id: "", subject: "", marks: "" }

export default function MarksClient({ initialMarks, students, exams, divisions, teacherSubjects, allSchools, schoolId, teacherClass }: { initialMarks: any[], students: any[], exams: any[], divisions: any[], teacherSubjects: any[], allSchools: any[], schoolId: number | null, teacherClass: string }) {
  const [marks, setMarks] = useState(initialMarks)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [filterSemester, setFilterSemester] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [activeSemester, setActiveSemester] = useState("SEM 1")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentMap: any = {}; students.forEach((s: any) => { studentMap[s.id] = s })
  const examMap: any = {}; exams.forEach((e: any) => { examMap[e.id] = e })

  const refresh = useCallback(async () => { setMarks(await getAllMarks()) }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const getTeacherForSubject = (className: string, subject: string) => {
    const match = teacherSubjects.find((ts: any) => ts.class_name === className && ts.subject === subject)
    return match?.teachers?.full_name || null
  }

  const filteredStudents = students.filter((s: any) => {
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    return true
  })
  const filteredStudentIds = new Set(filteredStudents.map((s: any) => s.id))
  const q = search.toLowerCase()
  const filtered = marks.filter((m: any) => {
    if (!filteredStudentIds.has(m.student_id)) return false
    const exam = examMap[m.exam_id]
    if (filterSemester && exam?.semester !== filterSemester) return false
    if (!q) return true
    const s = studentMap[m.student_id]; const e = examMap[m.exam_id]
    return [m.subject, String(m.marks), s?.full_name, e?.exam_name].some((v: any) => v?.toLowerCase().includes(q))
  })

  const selectedStudent = studentMap[form.student_id]
  const assignedTeacher = selectedStudent ? getTeacherForSubject(selectedStudent.class_name, form.subject) : null

  const filteredBySemester = exams.filter((e: any) => e.semester === activeSemester || !e.semester)

  const handleSave = async () => {
    if (!form.student_id || !form.exam_id || !form.subject || !form.marks) { setMessage("All fields are required"); return }
    if (editing) { await updateMark(editing.id, toFD(form)) } else { await addMark(toFD(form)) }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this mark record?")) return
    await deleteMark(id); refresh()
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
      const res = await fetch("/api/excel/import/marks", { method: "POST", body: fd })
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
        <h2 className="text-2xl font-semibold">Marks</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadFile("/api/excel/template/marks", "marks_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      <div className="mb-4 flex items-center gap-4 border-b border-slate-200">
        {semesters.map((sem) => (
          <button
            key={sem}
            onClick={() => { setActiveSemester(sem); setFilterSemester(sem) }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeSemester === sem
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {sem.replace("SEM ", "Semester ")}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500">{filtered.length} records</span>
      </div>

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
      </div>
      {filtered.length === 0 ? <p>No marks found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Exam</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Teacher</th><th className="px-3 py-2">Marks</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((m: any, i: number) => {
                const s = studentMap[m.student_id]; const e = examMap[m.exam_id]
                const teacher = s ? getTeacherForSubject(s.class_name, m.subject) : null
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : m.student_id}</td>
                    <td className="px-3 py-2">{e ? `${e.exam_name}${e.semester ? ` (${e.semester})` : ""}` : m.exam_id}</td>
                    <td className="px-3 py-2">{m.subject}</td>
                    <td className="px-3 py-2">{teacher || "-"}</td>
                    <td className="px-3 py-2">{m.marks}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => { setEditing(m); setForm({ ...m }); setMessage(""); setModal(true) }}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(m.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Marks" : "Add Marks"}</h3>
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
              <select className="w-full rounded border p-3 text-sm" value={form.exam_id} onChange={set("exam_id")}>
                <option value="">Select Exam *</option>
                {filteredBySemester.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.exam_name} - Class {e.class_name} ({e.semester || "N/A"})</option>
                ))}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject *" value={form.subject} onChange={set("subject")} />
              {assignedTeacher && <p className="text-xs text-green-700">Teacher: {assignedTeacher}</p>}
              <input className="w-full rounded border p-3 text-sm" type="number" placeholder="Marks *" value={form.marks} onChange={set("marks")} />
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
