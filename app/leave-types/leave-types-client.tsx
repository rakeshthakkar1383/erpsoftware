"use client"

import { useState } from "react"
import { getAllLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType } from "./actions"

const emptyForm: Record<string, string> = { name: "", short_code: "", description: "", max_days: "", school_id: "" }

export default function LeaveTypesClient({ initialData, allSchools, schoolId }: { initialData: any[], allSchools: any[], schoolId: number | null }) {
  const [items, setItems] = useState(initialData)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const refresh = async () => setItems(await getAllLeaveTypes())

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "name" ? e.target.value.toUpperCase() : e.target.value })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.name) { setMessage("Leave type name is required"); return }
    const res = editing ? await updateLeaveType(editing.id, toFD(form)) : await addLeaveType(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this leave type?")) return
    await deleteLeaveType(id); refresh()
  }

  const q = search.toLowerCase()
  const filtered = items.filter((s: any) => !q || [s.name, s.short_code, s.description].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Leave Types</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
      </div>
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <p>No leave types found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Max Days</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((s: any, i: number) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.short_code || "-"}</td>
                  <td className="px-3 py-2">{s.max_days || "-"}</td>
                  <td className="px-3 py-2">{s.description || "-"}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(s); setForm({ name: s.name || "", short_code: s.short_code || "", description: s.description || "", max_days: s.max_days ? String(s.max_days) : "", school_id: s.school_id ? String(s.school_id) : "" }); setMessage(""); setModal(true) }}>Edit</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Leave Type" : "Add Leave Type"}</h3>
            <div className="grid gap-3">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              <input className="w-full rounded border p-3 text-sm" placeholder="Leave Type Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Short Code (e.g. SL, CL, ML)" value={form.short_code} onChange={e => setForm({...form, short_code: e.target.value.toUpperCase()})} />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Max Days Allowed</label>
                <input className="w-full rounded border p-3 text-sm" type="number" placeholder="0 = Unlimited" value={form.max_days} onChange={e => setForm({...form, max_days: e.target.value})} />
              </div>
              <textarea className="w-full rounded border p-3 text-sm" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
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
