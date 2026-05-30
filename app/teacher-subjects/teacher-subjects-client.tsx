"use client"

import { useState } from "react"
import { getAllTeacherSubjects, addTeacherSubject, updateTeacherSubject, deleteTeacherSubject } from "./actions"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm = { teacher_id: "", class_name: "", subject: "" }

export default function TeacherSubjectsClient({ initialAssignments, teachers }: { initialAssignments: any[], teachers: any[] }) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const teacherMap: any = {}
  teachers.forEach((t: any) => { teacherMap[t.id] = t })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.teacher_id || !form.class_name || !form.subject) { setMessage("All fields are required"); return }
    if (editing) { await updateTeacherSubject(editing.id, toFD(form)) } else { await addTeacherSubject(toFD(form)) }
    setModal(false); setAssignments(await getAllTeacherSubjects())
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this assignment?")) return
    await deleteTeacherSubject(id); setAssignments(await getAllTeacherSubjects())
  }

  const q = search.toLowerCase()
  const filtered = assignments.filter((a: any) => !q || [a.teachers?.full_name, a.class_name, a.subject].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Teacher Subjects</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} assignments</span>
      </div>
      {filtered.length === 0 ? <p>No assignments found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Teacher</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((a: any, i: number) => (
                <tr key={a.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{a.teachers?.full_name || "-"}</td>
                  <td className="px-3 py-2">{a.class_name}</td>
                  <td className="px-3 py-2">{a.subject}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(a); setForm({ teacher_id: a.teacher_id || "", class_name: a.class_name || "", subject: a.subject || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Assignment" : "Add Assignment"}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                <option value="">Select Teacher *</option>
                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set("class_name")}>
                <option value="">Class *</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject *" value={form.subject} onChange={set("subject")} />
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
