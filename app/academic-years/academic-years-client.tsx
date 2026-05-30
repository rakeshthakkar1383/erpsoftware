"use client"

import { useState } from "react"
import { getAllAcademicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear, promoteStudents } from "./actions"

const emptyForm = { year_name: "", start_date: "", end_date: "", is_active: "false" }

export default function AcademicYearsClient({ initialYears }: { initialYears: any[] }) {
  const [years, setYears] = useState(initialYears)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [promoteModal, setPromoteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [promoteForm, setPromoteForm] = useState({ from: "", to: "" })
  const [message, setMessage] = useState("")

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.year_name) { setMessage("Year name is required"); return }
    if (editing) { await updateAcademicYear(editing.id, toFD(form)) } else { await addAcademicYear(toFD(form)) }
    setModal(false); setYears(await getAllAcademicYears())
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this academic year?")) return
    await deleteAcademicYear(id); setYears(await getAllAcademicYears())
  }

  const handlePromote = async () => {
    if (!promoteForm.from || !promoteForm.to) { setMessage("Select both source and target years"); return }
    if (promoteForm.from === promoteForm.to) { setMessage("Source and target years must be different"); return }
    const res = await promoteStudents(Number(promoteForm.from), Number(promoteForm.to))
    setMessage(res.message)
    if (res.success) setPromoteModal(false)
  }

  const q = search.toLowerCase()
  const filtered = years.filter((y: any) => !q || [y.year_name, y.start_date, y.end_date].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Academic Years</h2>
        <div className="flex gap-2">
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            onClick={() => { setPromoteForm({ from: "", to: "" }); setMessage(""); setPromoteModal(true) }}>Promote Students</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm font-medium text-blue-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} years</span>
      </div>
      {filtered.length === 0 ? <p>No academic years found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Year Name</th><th className="px-3 py-2">Start Date</th><th className="px-3 py-2">End Date</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((y: any, i: number) => (
                <tr key={y.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{y.year_name}</td>
                  <td className="px-3 py-2">{y.start_date}</td>
                  <td className="px-3 py-2">{y.end_date}</td>
                  <td className="px-3 py-2">{y.is_active ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span> : "No"}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(y); setForm({ year_name: y.year_name || "", start_date: y.start_date || "", end_date: y.end_date || "", is_active: y.is_active ? "true" : "false" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(y.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Academic Year" : "Add Academic Year"}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Year Name (e.g. 2025-2026) *" value={form.year_name} onChange={set("year_name")} />
              <input className="w-full rounded border p-3 text-sm" type="date" value={form.start_date} onChange={set("start_date")} />
              <input className="w-full rounded border p-3 text-sm" type="date" value={form.end_date} onChange={set("end_date")} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active === "true"} onChange={e => setForm({ ...form, is_active: e.target.checked ? "true" : "false" })} />
                Set as Active Year
              </label>
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : "Save"}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {promoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Promote Students</h3>
            <p className="mb-4 text-sm text-slate-600">This will copy all students from the source year to the target year and increment their class by 1 (e.g. Class 3 → Class 4).</p>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Source Year (From)</label>
                <select className="w-full rounded border p-3 text-sm" value={promoteForm.from} onChange={e => setPromoteForm({ ...promoteForm, from: e.target.value })}>
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Target Year (To)</label>
                <select className="w-full rounded border p-3 text-sm" value={promoteForm.to} onChange={e => setPromoteForm({ ...promoteForm, to: e.target.value })}>
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                </select>
              </div>
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-green-600 px-5 py-2 text-white hover:bg-green-700" onClick={handlePromote}>Promote Now</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setPromoteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
