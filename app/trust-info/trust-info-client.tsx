"use client"

import { useState, useEffect } from "react"
import { getAllTrusts, addTrust, updateTrust, deleteTrust } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { Building2, MapPin, Phone, Mail, Globe, Sparkles, Plus, Edit2, Trash2, Search, ArrowRight, Shield } from "lucide-react"

const emptyForm = {
  trust_name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  registration_no: "",
  logo_url: "",
  school_id: "",
}

export default function TrustInfoClient({
  schoolId,
  schools = [],
}: {
  schoolId: number | null
  schools?: any[]
}) {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"list" | "manage">("list")
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({
    ...emptyForm,
    school_id: schoolId ? String(schoolId) : schools[0]?.id ? String(schools[0].id) : "",
  })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const refresh = () => {
    getAllTrusts().then(setItems)
  }
  useEffect(() => {
    refresh()
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: field === "email" || field === "phone" || field === "website" || field === "school_id" ? val : val.toUpperCase(),
      }
      return next
    })
  }

  // Auto fetch trust_name and address when school selection changes
  const handleSchoolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    const foundSchool = schools.find((s) => String(s.id) === selectedId)

    setForm((prev) => ({
      ...prev,
      school_id: selectedId,
      trust_name: foundSchool?.trust_name || prev.trust_name,
      address: foundSchool?.address || prev.address,
    }))
  }

  // Explicitly fetch/sync trust name and address from selected school
  const fetchFromSchool = () => {
    const foundSchool = schools.find((s) => String(s.id) === form.school_id)
    if (!foundSchool) {
      setMessage("Please select a valid school first.")
      return
    }
    let updated = false
    setForm((prev) => {
      const newTrustName = foundSchool.trust_name || prev.trust_name
      const newAddress = foundSchool.address || prev.address
      if (newTrustName !== prev.trust_name || newAddress !== prev.address) updated = true
      return {
        ...prev,
        trust_name: newTrustName,
        address: newAddress,
      }
    })
    setMessage(updated ? `Fetched Trust Name & Address from ${foundSchool.school_name}` : `School data already populated`)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const prefix = form.school_id ? `${form.school_id}/trusts` : "trusts"
    const path = `${prefix}/${Date.now()}_logo.${ext}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) {
        alert(error.message)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm((prev) => ({ ...prev, logo_url: publicUrl }))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const toFD = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    return fd
  }

  const handleSave = async () => {
    if (!form.trust_name) {
      setMessage("Trust name is required")
      return
    }
    const payload = { ...form }
    if (!payload.school_id && schoolId) payload.school_id = String(schoolId)

    const res = editing ? await updateTrust(editing.id, toFD(payload)) : await addTrust(toFD(payload))
    if (!res.success) {
      setMessage(res.message)
      return
    }
    setEditing(null)
    setForm({
      ...emptyForm,
      school_id: schoolId ? String(schoolId) : schools[0]?.id ? String(schools[0].id) : "",
    })
    setMessage("")
    setTab("list")
    refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this trust?")) return
    const res = await deleteTrust(id)
    if (!res.success) {
      setMessage(res.message)
      return
    }
    refresh()
  }

  const openAdd = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      school_id: schoolId ? String(schoolId) : schools[0]?.id ? String(schools[0].id) : "",
    })
    setMessage("")
    setTab("manage")
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
      school_id: item.school_id ? String(item.school_id) : schoolId ? String(schoolId) : "",
    })
    setMessage("")
    setTab("manage")
  }

  const q = search.toLowerCase()
  const filtered = items.filter(
    (i: any) =>
      !q ||
      [i.trust_name, i.address, i.phone, i.email, i.registration_no, i.school_info?.school_name]
        .some((v) => v?.toLowerCase().includes(q))
  )

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold uppercase tracking-wide">Trust Information</h2>
            </div>
            <p className="mt-1 text-sm text-blue-200">
              Manage trust records and auto-sync Trust Name & Address across connected schools.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-400 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add New Trust
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex border-b border-slate-200">
        <button
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition ${
            tab === "list"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => {
            setTab("list")
            setMessage("")
          }}
        >
          <Building2 className="h-4 w-4" /> All Trusts ({filtered.length})
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition ${
            tab === "manage"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => {
            setTab("manage")
            if (!editing)
              setForm({
                ...emptyForm,
                school_id: schoolId ? String(schoolId) : schools[0]?.id ? String(schools[0].id) : "",
              })
            setMessage("")
          }}
        >
          <Edit2 className="h-4 w-4" /> {editing ? "Edit Trust Details" : "Add Trust Details"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800 shadow-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-blue-500 hover:text-blue-700 font-bold">✕</button>
        </div>
      )}

      {/* Tab 1: All Trusts */}
      {tab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search trust name, school, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No Trusts Found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add New Trust" to configure a new trust record.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item: any) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 flex items-start gap-4">
                      {item.logo_url ? (
                        <img
                          src={item.logo_url}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-slate-50 p-1"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-400">
                          NO LOGO
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <h3 className="truncate font-bold text-slate-900 uppercase text-base">{item.trust_name}</h3>
                        {item.school_info?.school_name && (
                          <span className="inline-block mt-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase border border-blue-100">
                            {item.school_info.school_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {item.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.address}</span>
                        </div>
                      )}
                      {item.registration_no && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Reg: <strong>{item.registration_no}</strong></span>
                        </div>
                      )}
                      {item.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.email}</span>
                        </div>
                      )}
                      {item.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <a href={item.website} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                            {item.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manage Form */}
      {tab === "manage" && (
        <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 uppercase">
                {editing ? "Edit Trust Information" : "Add New Trust Information"}
              </h3>
              <p className="text-xs text-slate-500">
                Configure trust details. Select a school to fetch and synchronize Trust Name & Address automatically.
              </p>
            </div>
            {editing && (
              <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 uppercase border border-amber-200">
                Editing ID #{editing.id}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* School Selector & Fetch Button */}
            {schools.length > 0 && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Associated School *
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={form.school_id}
                      onChange={handleSchoolSelect}
                    >
                      <option value="">-- Select School --</option>
                      {schools.map((s: any) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.school_name} {s.trust_name ? `(${s.trust_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={fetchFromSchool}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-700 active:scale-95 whitespace-nowrap"
                    title="Fetch Trust Name and Address directly from selected school record"
                  >
                    <Sparkles className="h-4 w-4" /> Fetch Trust Name & Address
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Trust Name *
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. SARDAR VALLABHBHAI PATEL EDUCATION TRUST"
                value={form.trust_name}
                onChange={set("trust_name")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Trust Address
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter complete trust address..."
                value={form.address}
                onChange={set("address")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registration Number
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="REGISTRATION NO"
                  value={form.registration_no}
                  onChange={set("registration_no")}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phone Number
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+91 XXXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="trust@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Website URL
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://www.trustwebsite.org"
                  value={form.website}
                  onChange={set("website")}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Trust Logo
              </label>
              <input
                type="file"
                className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              {uploading && <p className="mt-1.5 text-xs font-bold uppercase text-blue-600">Uploading logo...</p>}
              {form.logo_url && !uploading && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                  <img src={form.logo_url} alt="" className="h-12 w-12 rounded border object-contain bg-slate-50" />
                  <div>
                    <span className="text-xs font-bold uppercase text-green-600 block">Logo Uploaded Successfully</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-md block">{form.logo_url}</span>
                  </div>
                </div>
              )}
            </div>

            {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-5">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700 active:scale-95 uppercase"
              onClick={handleSave}
            >
              {editing ? "Update Trust Info" : "Save Trust Info"} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 uppercase"
              onClick={() => {
                setTab("list")
                setEditing(null)
                setForm({
                  ...emptyForm,
                  school_id: schoolId ? String(schoolId) : schools[0]?.id ? String(schools[0].id) : "",
                })
                setMessage("")
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
