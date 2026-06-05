"use client"

import { useState } from "react"
import { getAllAcademicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear } from "./actions"

const emptyForm: Record<string, string> = { year_name: "", start_date: "", end_date: "", is_active: "", school_id: "" }

export default function AcademicYearsClient({ initialData, allSchools, schoolId }: { initialData: any[], allSchools: any[], schoolId: number | null }) {
  const [items, setItems] = useState(initialData)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const refresh = async () => setItems(await getAllAcademicYears())

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.year_name || !form.start_date || !form.end_date) { setMessage("Year name, start date, and end date are required"); return }
    if (editing) {
      const res = await updateAcademicYear(editing.id, toFD(form))
      if (!res.success) { setMessage(res.message); return }
    } else {
      const res = await addAcademicYear(toFD(form))
      if (!res.success) { setMessage(res.message); return }
    }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this academic year?")) return
    await deleteAcademicYear(id); refresh()
  }

  const q = search.toLowerCase()
  const filtered = items.filter((s: any) => !q || [s.year_name, s.start_date, s.end_date].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Academic Years</h2>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} years</span>
      </div>
      {filtered.length === 0 ? <p>No academic years found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Year Name</th><th className="px-3 py-2">Start Date</th><th className="px-3 py-2">End Date</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((s: any, i: number) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold">{s.year_name}</td>
                  <td className="px-3 py-2">{s.start_date}</td>
                  <td className="px-3 py-2">{s.end_date}</td>
                  <td className="px-3 py-2">
                    {s.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Active</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Inactive</span>
                    )}
                  </td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(s); setForm({ year_name: s.year_name || "", start_date: s.start_date || "", end_date: s.end_date || "", is_active: s.is_active ? "true" : "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
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
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              <input className="w-full rounded border p-3 text-sm" placeholder="Year Name * (e.g. 2025-26)" value={form.year_name} onChange={e => setForm({...form, year_name: e.target.value.toUpperCase()})} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date *</label>
                  <input className="w-full rounded border p-3 text-sm" type="date" value={form.start_date} onChange={set("start_date")} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">End Date *</label>
                  <input className="w-full rounded border p-3 text-sm" type="date" value={form.end_date} onChange={set("end_date")} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active === "true"} onChange={e => setForm({...form, is_active: e.target.checked ? "true" : ""})} />
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
    </div>
  )
}
