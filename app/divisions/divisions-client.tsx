"use client"

import { useState, useRef } from "react"
import { getAllDivisions, addDivision, updateDivision, deleteDivision, bulkAddDivisions } from "./actions"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const bulkClasses = Array.from({ length: 12 }, (_, i) => String(i + 1))
const bulkDivisions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const emptyForm: Record<string, string> = { class_name: "", division_name: "" }

export default function DivisionsClient({ initialDivisions, teachers, allSchools, schoolId }: { initialDivisions: any[], teachers: any[], allSchools: any[], schoolId: number | null }) {
  const [divisions, setDivisions] = useState(initialDivisions)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkSelectedClasses, setBulkSelectedClasses] = useState<string[]>([])
  const [bulkSelectedDivisions, setBulkSelectedDivisions] = useState<string[]>([])
  const [bulkSchoolId, setBulkSchoolId] = useState<string>(schoolId ? String(schoolId) : "")
  const [bulkMessage, setBulkMessage] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  const refresh = async () => setDivisions(await getAllDivisions())

  const toggleBulkClass = (c: string) => setBulkSelectedClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const toggleBulkDiv = (d: string) => setBulkSelectedDivisions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const selectAllBulkClasses = () => setBulkSelectedClasses(bulkClasses)
  const selectAllBulkDivisions = () => setBulkSelectedDivisions(bulkDivisions)

  const handleBulkSave = async () => {
    if (bulkSelectedClasses.length === 0 || bulkSelectedDivisions.length === 0) {
      setBulkMessage("Select at least one class and one division")
      return
    }
    setBulkLoading(true)
    const fd = new FormData()
    fd.append("school_id", bulkSchoolId)
    fd.append("class_names", JSON.stringify(bulkSelectedClasses))
    fd.append("division_names", JSON.stringify(bulkSelectedDivisions))
    const res = await bulkAddDivisions(fd)
    setBulkLoading(false)
    if (res.success) {
      setBulkModal(false)
      setBulkSelectedClasses([])
      setBulkSelectedDivisions([])
      setBulkMessage("")
      refresh()
    } else {
      setBulkMessage(res.message)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: field === "class_name" ? e.target.value : e.target.value.toUpperCase() }))

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.class_name || !form.division_name) { setMessage("Class and Division are required"); return }
    const res = editing ? await updateDivision(editing.id, toFD(form)) : await addDivision(toFD(form))
    if (res.success) {
      setModal(false)
      refresh()
    } else {
      setMessage(res.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this division?")) return
    await deleteDivision(id); refresh()
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
      const res = await fetch("/api/excel/import/divisions", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} records. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const q = search.toLowerCase()
  const filtered = divisions.filter((d: any) => !q || [d.class_name, d.division_name, d.school_info?.school_name].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Divisions</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadFile("/api/excel/template/divisions", "divisions_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
          <button className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            onClick={() => { setBulkSelectedClasses([]); setBulkSelectedDivisions([]); setBulkSchoolId(schoolId ? String(schoolId) : ""); setBulkMessage(""); setBulkModal(true) }}>Bulk Create</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} divisions</span>
      </div>
      {filtered.length === 0 ? <p>No divisions found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">School</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Division</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((d: any, i: number) => (
                <tr key={d.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-500">{d.school_info?.school_name || "-"}</td>
                  <td className="px-3 py-2 font-bold">{d.class_name}</td>
                  <td className="px-3 py-2 font-black text-blue-600">{d.division_name}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline font-bold" onClick={() => { setEditing(d); setForm({ class_name: d.class_name || "", division_name: d.division_name || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline font-bold" onClick={() => handleDelete(d.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-slate-800">{editing ? "Edit Division" : "Add Multiple Divisions"}</h3>
            <div className="grid gap-4">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm(prev => ({...prev, school_id: e.target.value}))}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Class *</label>
                 <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={form.class_name} onChange={set("class_name")}>
                   <option value="">SELECT CLASS</option>
                   {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                 </select>
              </div>
              
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{editing ? "Division Name *" : "Division Names (Separate by comma) *"}</label>
                 <input className="w-full rounded border p-3 text-sm font-bold placeholder:font-normal" placeholder={editing ? "e.g. A" : "e.g. A, B, C, D"} value={form.division_name} onChange={set("division_name")} />
                 {!editing && <p className="text-[10px] font-medium text-slate-400 italic">Enter multiple divisions like "A, B, C" to create them at once.</p>}
              </div>
            </div>
            {message && (
              <p className={`mt-4 rounded p-3 text-xs font-bold text-center border uppercase ${
                message.includes("failed") || message.includes("error") || (message.includes("errors.") && !message.includes("0 errors."))
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-green-50 border-green-100 text-green-600"
              }`}>
                {message}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded bg-blue-600 px-5 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={handleSave}>{editing ? "Update Division" : "Create Divisions"}</button>
              <button className="rounded bg-slate-100 px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-slate-800">Bulk Create Divisions</h3>
            <p className="mb-4 text-xs text-slate-500">Select classes and divisions to create all combinations at once.</p>

            <div className="grid gap-4">
              {!schoolId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select School *</label>
                  <select className="w-full rounded border p-3 text-sm" value={bulkSchoolId} onChange={e => setBulkSchoolId(e.target.value)}>
                    <option value="">SELECT SCHOOL</option>
                    {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Classes (1-12) *</label>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline" onClick={selectAllBulkClasses}>Select All</button>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {bulkClasses.map(c => (
                    <label key={c} className={`flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${bulkSelectedClasses.includes(c) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      <input type="checkbox" className="hidden" checked={bulkSelectedClasses.includes(c)} onChange={() => toggleBulkClass(c)} />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Divisions (A-Z) *</label>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline" onClick={selectAllBulkDivisions}>Select All</button>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                  {bulkDivisions.map(d => (
                    <label key={d} className={`flex items-center justify-center rounded border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${bulkSelectedDivisions.includes(d) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      <input type="checkbox" className="hidden" checked={bulkSelectedDivisions.includes(d)} onChange={() => toggleBulkDiv(d)} />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded bg-slate-100 p-3 text-center">
                <span className="text-xs font-bold text-slate-700">
                  {bulkSelectedClasses.length} class(es) × {bulkSelectedDivisions.length} division(s) = <span className="text-blue-600">{bulkSelectedClasses.length * bulkSelectedDivisions.length}</span> division(s) will be created
                </span>
              </div>
            </div>

            {bulkMessage && (
              <p className={`mt-4 rounded p-3 text-xs font-bold text-center border uppercase ${
                bulkMessage.includes("failed") || bulkMessage.includes("error") || bulkMessage.includes("already exist")
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-green-50 border-green-100 text-green-600"
              }`}>
                {bulkMessage}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded bg-purple-600 px-5 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 disabled:opacity-50" onClick={handleBulkSave} disabled={bulkLoading}>
                {bulkLoading ? "Creating..." : "Create Divisions"}
              </button>
              <button className="rounded bg-slate-100 px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200" onClick={() => setBulkModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
