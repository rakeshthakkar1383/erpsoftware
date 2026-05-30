"use client"

import { useState } from "react"
import { updateSchoolInfo } from "./actions"
import { createClient } from "@/lib/supabase/client"

const emptyForm = {
  school_name: "", address: "", phone: "", email: "", website: "",
  principal_name: "", affiliation: "", logo_url: "",
}

export default function SchoolInfoClient({ initialInfo, schoolId, role }: { initialInfo: any, schoolId: number | null, role?: string }) {
  const [form, setForm] = useState(initialInfo || { ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-uppercase for name, address, principal, affiliation
    const shouldUppercase = ["school_name", "address", "principal_name", "affiliation"].includes(field)
    setForm({ ...form, [field]: shouldUppercase ? value.toUpperCase() : value })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !schoolId) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${schoolId}/logo_${Date.now()}.${ext}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm((prev: any) => ({ ...prev, logo_url: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(false) }
  }

  const toFD = (obj: any) => { 
    const fd = new FormData(); 
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); 
    return fd 
  }

  const handleSave = async () => {
    const result = await updateSchoolInfo(toFD(form))
    setMessage(result.message)
  }
return (
  <div>
    <div className="mb-6 border-b pb-4">
      <h2 className="text-2xl font-bold text-slate-800 uppercase">{form.school_name || "SCHOOL INFO"}</h2>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Institutional Details & Branding</p>
    </div>
    {message && <p className="mb-3 text-sm font-medium text-blue-700">{message}</p>}
    {!schoolId && (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">No school linked to your account.</p>
        <p className="text-xs text-amber-600 mt-1">
          {role === "admin" ? "Go to All Schools to create or select a school first." : "Contact an admin to link your account to a school."}
        </p>
      </div>
    )}
    {!initialInfo && schoolId && (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-800">School record not found.</p>
        <p className="text-xs text-blue-600 mt-1">Fill in the details below and save to create your school profile.</p>
      </div>
    )}
    <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex justify-center mb-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="School Logo" className="h-32 w-32 rounded-lg border object-contain bg-slate-50" />
            ) : (
              <div className="h-32 w-32 rounded-lg border border-dashed flex items-center justify-center bg-slate-50 text-slate-400 text-xs text-center p-2">
                No Logo Uploaded
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">School Name</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="SCHOOL NAME" value={form.school_name || ""} onChange={set("school_name")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Phone" value={form.phone || ""} onChange={set("phone")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Email" value={form.email || ""} onChange={set("email")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Website</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Website" value={form.website || ""} onChange={set("website")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Principal Name</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="PRINCIPAL NAME" value={form.principal_name || ""} onChange={set("principal_name")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Affiliation</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="AFFILIATION (E.G. CBSE)" value={form.affiliation || ""} onChange={set("affiliation")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="FULL ADDRESS" value={form.address || ""} onChange={set("address")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Logo</label>
            <input type="file" className="w-full text-sm" accept="image/*" onChange={handleLogoUpload} />
            {uploading && <p className="text-xs text-blue-600 mt-1">Uploading logo...</p>}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
