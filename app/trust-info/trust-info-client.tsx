"use client"

import { useState, useEffect } from "react"
import { getAllTrusts, addTrust, updateTrust, deleteTrust } from "./actions"
import { createClient } from "@/lib/supabase/client"

const emptyForm = {
  trust_name: "", address: "", phone: "", email: "", website: "", registration_no: "", logo_url: "",
}

export default function TrustInfoClient({ schoolId }: { schoolId: number | null }) {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"list" | "manage">("list")
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const refresh = () => { getAllTrusts().then(setItems) }
  useEffect(() => { refresh() }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "email" || field === "phone" ? e.target.value : e.target.value.toUpperCase() })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const prefix = schoolId ? `${schoolId}/trusts` : "trusts"
    const path = `${prefix}/${Date.now()}_logo.${ext}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) { alert(error.message); return }
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm(prev => ({ ...prev, logo_url: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(false) }
  }

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.trust_name) { setMessage("Trust name is required"); return }
    const payload = { ...form }
    if (schoolId && !editing) payload.school_id = String(schoolId)
    const res = editing ? await updateTrust(editing.id, toFD(payload)) : await addTrust(toFD(payload))
    if (!res.success) { setMessage(res.message); return }
    setEditing(null); setForm({ ...emptyForm }); setMessage(""); setTab("list"); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this trust?")) return
    const res = await deleteTrust(id)
    if (!res.success) { setMessage(res.message); return }
    refresh()
  }

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(""); setTab("manage")
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      trust_name: item.trust_name || "",
      address: item.address || "",
      phone: item.phone || "",
      email: item.email || "",
      website: item.website || "",
      registration_no: item.registration_no || "",
      logo_url: item.logo_url || "",
    })
    setMessage(""); setTab("manage")
  }

  const q = search.toLowerCase()
  const filtered = items.filter((i: any) => !q || [i.trust_name, i.address, i.phone, i.email, i.registration_no].some(v => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Trust Info</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manage and configure trust information</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-0 border-b">
        <button
          className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition ${tab === "list" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => { setTab("list"); setMessage("") }}
        >
          All Trusts
        </button>
        <button
          className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition ${tab === "manage" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => { setTab("manage"); if (!editing) setForm({ ...emptyForm }); setMessage("") }}
        >
          {editing ? "Edit Trust" : "Add Trust"}
        </button>
      </div>

      {message && <p className="mb-3 text-sm text-blue-700">{message}</p>}

      {/* All Trusts Tab */}
      {tab === "list" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <input className="rounded border p-2 text-sm w-64" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{filtered.length} records</span>
              <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 uppercase tracking-tighter" onClick={openAdd}>Add New</button>
            </div>
          </div>
          {filtered.length === 0 ? <p className="text-slate-500">No trusts found.</p> : (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Logo</th>
                    <th className="px-3 py-2">Trust Name</th>
                    <th className="px-3 py-2">Reg No</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filtered.map((item: any, i: number) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">
                        {item.logo_url ? (
                          <img src={item.logo_url} alt="" className="h-10 w-10 rounded border object-contain bg-slate-50" />
                        ) : (
                          <div className="h-10 w-10 rounded border border-dashed flex items-center justify-center bg-slate-50 text-[8px] text-slate-400">N/A</div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{item.trust_name}</td>
                      <td className="px-3 py-2">{item.registration_no || "-"}</td>
                      <td className="px-3 py-2">{item.phone || "-"}</td>
                      <td className="px-3 py-2">{item.email || "-"}</td>
                      <td className="flex gap-2 px-3 py-2">
                        <button className="text-blue-600 hover:underline" onClick={() => openEdit(item)}>Edit</button>
                        <button className="text-red-600 hover:underline" onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Manage Tab */}
      {tab === "manage" && (
        <div className="max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold uppercase text-slate-800">{editing ? "Edit Trust" : "Add New Trust"}</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Trust Name *</label>
              <input className="w-full rounded border p-3 text-sm" placeholder="Trust Name" value={form.trust_name} onChange={set("trust_name")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Registration No</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="Registration No" value={form.registration_no} onChange={set("registration_no")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Website</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="Website" value={form.website} onChange={set("website")} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Address</label>
              <input className="w-full rounded border p-3 text-sm" placeholder="Address" value={form.address} onChange={set("address")} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Logo</label>
              <input type="file" className="w-full text-sm" accept="image/*" onChange={handleLogoUpload} />
              {uploading && <p className="mt-1 text-xs font-bold uppercase text-blue-600">Uploading logo...</p>}
              {form.logo_url && !uploading && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.logo_url} alt="" className="h-12 w-12 rounded border object-contain bg-slate-50" />
                  <span className="text-xs text-green-600 font-bold uppercase">Logo uploaded</span>
                </div>
              )}
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
          </div>
          <div className="mt-6 flex gap-3">
            <button className="rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 uppercase" onClick={handleSave}>
              {editing ? "Update" : "Save"}
            </button>
            <button className="rounded bg-slate-200 px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300 uppercase" onClick={() => { setTab("list"); setEditing(null); setForm({ ...emptyForm }); setMessage("") }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
