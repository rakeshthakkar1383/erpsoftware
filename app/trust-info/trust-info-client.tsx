"use client"

import { useState, useEffect } from "react"
import { getAllTrusts, addTrust, updateTrust, deleteTrust } from "./actions"

export default function TrustInfoClient({ schoolId }: { schoolId: number | null }) {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({ trust_name: "", address: "", phone: "", email: "", website: "", registration_no: "" })
  const [message, setMessage] = useState("")

  const refresh = () => { getAllTrusts().then(setItems) }
  useEffect(() => { refresh() }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "email" || field === "phone" ? e.target.value : e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.trust_name) { setMessage("Trust name is required"); return }
    const res = editing ? await updateTrust(editing.id, toFD(form)) : await addTrust(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this trust?")) return
    const res = await deleteTrust(id)
    if (!res.success) { setMessage(res.message); return }
    refresh()
  }

  const q = search.toLowerCase()
  const filtered = items.filter((i: any) => !q || [i.trust_name, i.address, i.phone, i.email, i.registration_no].some(v => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Trust Info</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manage and configure trust information</p>
      </div>
      {message && <p className="mb-3 text-sm text-blue-700">{message}</p>}
      <div className="mb-4 flex items-center justify-between">
        <input className="rounded border p-2 text-sm w-64" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{filtered.length} records</span>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 uppercase tracking-tighter"
            onClick={() => { setEditing(null); setForm({ trust_name: "", address: "", phone: "", email: "", website: "", registration_no: "" }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {filtered.length === 0 ? <p className="text-slate-500">No trusts found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Trust Name</th><th className="px-3 py-2">Reg No</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((item: any, i: number) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{item.trust_name}</td>
                  <td className="px-3 py-2">{item.registration_no || "-"}</td>
                  <td className="px-3 py-2">{item.phone || "-"}</td>
                  <td className="px-3 py-2">{item.email || "-"}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(item); setForm({ trust_name: item.trust_name, address: item.address || "", phone: item.phone || "", email: item.email || "", website: item.website || "", registration_no: item.registration_no || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(item.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Trust" : "Add Trust"}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Trust Name *" value={form.trust_name} onChange={set("trust_name")} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Registration No" value={form.registration_no} onChange={set("registration_no")} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Address" value={form.address} onChange={set("address")} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Website" value={form.website} onChange={set("website")} />
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
