"use client"

import { useState } from "react"
import { addSchool, deleteSchool, getAllSchools, updateSchoolById } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

const emptyForm = {
  school_name: "", trust_name: "", address: "", phone: "", email: "", website: "",
  principal_name: "", affiliation: "", logo_url: "",
}

export default function ManageSchoolsClient({ initialSchools }: { initialSchools: any[] }) {
  const router = useRouter()
  const [schools, setSchools] = useState(initialSchools)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setForm({ ...form, [field]: value })
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ ...emptyForm })
    setMessage("")
    setModal(true)
  }

  const openEdit = (s: any) => {
    setEditId(s.id)
    setForm({
      school_name: s.school_name || "",
      trust_name: s.trust_name || "",
      address: s.address || "",
      phone: s.phone || "",
      email: s.email || "",
      website: s.website || "",
      principal_name: s.principal_name || "",
      affiliation: s.affiliation || "",
      logo_url: s.logo_url || "",
    })
    setMessage("")
    setModal(true)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `logos/${Date.now()}_logo.${ext}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm(prev => ({ ...prev, logo_url: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(false) }
  }

  const toFD = (obj: any) => { 
    const fd = new FormData(); 
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); 
    return fd 
  }

  const handleSave = async () => {
    if (!form.school_name) { setMessage("School name is required"); return }
    const result = editId
      ? await updateSchoolById(editId, toFD(form))
      : await addSchool(toFD(form))
    setMessage(result.message)
    if (result.success) {
      setModal(false)
      setForm({ ...emptyForm })
      setSchools(await getAllSchools())
      router.refresh()
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure? This will delete the school record.")) return
    const result = await deleteSchool(id)
    if (result.success) setSchools(await getAllSchools())
    else alert(result.message)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Manage All Schools</h2>
        <button 
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={openAdd}
        >
          Add New School
        </button>
      </div>

      {message && <p className="mb-4 text-sm font-medium text-blue-700">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((s) => (
          <div key={s.id} className="relative rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md">
            <button
              onClick={() => openEdit(s)}
              className="absolute right-3 top-3 text-slate-400 hover:text-blue-600 transition"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <div className="mb-4 flex items-center gap-4">
              {s.logo_url ? (
                <img src={s.logo_url} alt="" className="h-12 w-12 rounded border object-contain bg-slate-50" />
              ) : (
                <div className="h-12 w-12 rounded border border-dashed flex items-center justify-center bg-slate-50 text-[10px] text-slate-400">NO LOGO</div>
              )}
              <div>
                <h3 className="font-bold text-slate-800 uppercase">{s.school_name}</h3>
                <p className="text-xs text-slate-500">{s.trust_name ? `TRUST: ${s.trust_name}` : s.city || "CITY NOT SET"}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p><strong>Trust:</strong> {s.trust_name || "N/A"}</p>
              <p><strong>Principal:</strong> {s.principal_name || "N/A"}</p>
              <p><strong>Phone:</strong> {s.phone || "N/A"}</p>
              <p><strong>Affiliation:</strong> {s.affiliation || "N/A"}</p>
            </div>
            <div className="mt-4 flex justify-end border-t pt-3">
              <button 
                onClick={() => handleDelete(s.id)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-xl font-bold">{editId ? "EDIT SCHOOL" : "ADD NEW SCHOOL"}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">School Name *</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="SCHOOL NAME" value={form.school_name} onChange={set("school_name")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Trust Name</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="TRUST NAME" value={form.trust_name} onChange={set("trust_name")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="PHONE" value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="EMAIL" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Address</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="ADDRESS" value={form.address} onChange={set("address")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Principal Name</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="PRINCIPAL NAME" value={form.principal_name} onChange={set("principal_name")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Affiliation</label>
                <input className="w-full rounded border p-3 text-sm" placeholder="AFFILIATION" value={form.affiliation} onChange={set("affiliation")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Logo</label>
                <input type="file" className="w-full text-sm" accept="image/*" onChange={handleLogoUpload} />
                {uploading && <p className="mt-1 text-xs font-bold uppercase text-blue-600">Uploading logo...</p>}
                {form.logo_url && !uploading && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.logo_url} alt="" className="h-12 w-12 rounded border object-contain bg-slate-50" />
                    <span className="text-xs font-bold uppercase text-green-600">Logo uploaded</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="rounded bg-blue-600 px-6 py-2 text-sm text-white font-bold hover:bg-blue-700" onClick={handleSave}>
                {editId ? "UPDATE SCHOOL" : "CREATE SCHOOL"}
              </button>
              <button className="rounded bg-slate-200 px-6 py-2 text-sm text-slate-700 font-bold hover:bg-slate-300" onClick={() => setModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
