"use client"

import { useState, useEffect, useRef } from "react"
import { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } from "./actions"

const emptyForm = { full_name: "", subject: "", mobile: "", salary: "" }

export default function TeachersClient() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = () => getAllTeachers().then(setTeachers)

  useEffect(() => { refresh() }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.full_name) { setMessage("Name is required"); return }
    if (editing) { await updateTeacher(editing.id, toFD(form)) }
    else { await addTeacher(toFD(form)) }
    setModal(false)
    refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this teacher?")) return
    await deleteTeacher(id)
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
      const res = await fetch("/api/excel/import/teachers", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} teachers. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const q = search.toLowerCase()
  const filtered = teachers.filter((t: any) => !q || [t.full_name, t.subject, t.mobile].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Teachers</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadFile("/api/excel/template/teachers", "teachers_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>
            Add New
          </button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} teachers</span>
      </div>
      {filtered.length === 0 ? <p>No teachers found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Salary</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((t: any, i: number) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{t.full_name}</td>
                  <td className="px-3 py-2">{t.subject}</td>
                  <td className="px-3 py-2">{t.mobile}</td>
                  <td className="px-3 py-2">{t.salary}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(t); setForm({ full_name: t.full_name || "", subject: t.subject || "", mobile: t.mobile || "", salary: t.salary || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(t.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Teacher" : "Add Teacher"}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Full Name *" value={form.full_name} onChange={set("full_name")} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject" value={form.subject} onChange={set("subject")} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Mobile" value={form.mobile} onChange={set("mobile")} />
              <input className="w-full rounded border p-3 text-sm" type="number" placeholder="Salary" value={form.salary} onChange={set("salary")} />
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
