"use client"

import { useState, useRef } from "react"
import { getAllFeeTypes, addFeeType, updateFeeType, deleteFeeType, moveFeeType } from "./actions"

const emptyForm = { name: "", description: "", fee_category: "School", school_id: "", trust_id: "" }

export default function FeeTypesClient({ initialFeeTypes, allSchools, trusts, schoolId }: { initialFeeTypes: any[]; allSchools: any[]; trusts: any[]; schoolId: number | null }) {
  const [feeTypes, setFeeTypes] = useState(initialFeeTypes)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = async () => setFeeTypes(await getAllFeeTypes())

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "name" ? e.target.value.toUpperCase() : e.target.value })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.name) { setMessage("Fee type name is required"); return }
    if (form.fee_category === "School" && !schoolId && !form.school_id) { setMessage("School is required for school fee type."); return }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Trust is required for trust fee type."); return }
    const res = editing ? await updateFeeType(editing.id, toFD(form)) : await addFeeType(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this fee type?")) return
    await deleteFeeType(id)
    refresh()
  }

  const q = search.toLowerCase()
  const filtered = feeTypes.filter((ft: any) => !q || [ft.name, ft.description, ft.fee_category, ft.trust_name].some((v: any) => v?.toLowerCase().includes(q)))

  const trustMap: any = {}
  trusts.forEach((t: any) => { trustMap[t.id] = t.trust_name })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Fee Types</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search fee types..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <p>No fee types found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Trust/School</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((ft: any, i: number) => (
                <tr key={ft.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{ft.name}</td>
                  <td className="px-3 py-2">{ft.description || "-"}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${ft.fee_category === "Trust" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{ft.fee_category || "School"}</span></td>
                  <td className="px-3 py-2">{ft.fee_category === "Trust" ? (trustMap[ft.trust_id] || "-") : (ft.school_id ? `School #${ft.school_id}` : "-")}</td>
                  <td className="flex items-center gap-1 px-3 py-2">
                    <button className="text-slate-400 hover:text-slate-700" title="Move Up" onClick={async () => { const r = await moveFeeType(ft.id, "up"); setMessage(r.message); refresh() }}>▲</button>
                    <button className="text-slate-400 hover:text-slate-700" title="Move Down" onClick={async () => { const r = await moveFeeType(ft.id, "down"); setMessage(r.message); refresh() }}>▼</button>
                    <button className="ml-1 text-blue-600 hover:underline" onClick={() => { setEditing(ft); setForm({ name: ft.name || "", description: ft.description || "", fee_category: ft.fee_category || "School", school_id: ft.school_id ? String(ft.school_id) : "", trust_id: ft.trust_id ? String(ft.trust_id) : "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(ft.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Fee Type" : "Add Fee Type"}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={set("fee_category")}>
                <option value="School">School Fee Type</option>
                <option value="Trust">Trust Fee Type</option>
              </select>
              {form.fee_category === "School" && !schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={set("school_id")}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              {form.fee_category === "Trust" && (
                <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={set("trust_id")}>
                  <option value="">SELECT TRUST</option>
                  {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
                </select>
              )}
              <input className="w-full rounded border p-3 text-sm" placeholder="Fee Type Name" value={form.name} onChange={set("name")} />
              <textarea className="w-full rounded border p-3 text-sm" placeholder="Description" value={form.description} onChange={set("description")} rows={3} />
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