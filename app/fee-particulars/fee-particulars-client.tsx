"use client"

import { useState, useRef } from "react"
import { getAllFeeParticulars, addFeeParticular, updateFeeParticular, deleteFeeParticular, moveFeeParticular } from "./actions"

const allClasses = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm: Record<string, string> = { class_name: "", particular_name: "", amount: "", duration_months: "12", term: "Yearly", fee_type_id: "", fee_category: "School", school_id: "", trust_id: "" }

export default function FeeParticularsClient({ initialParticulars, feeTypes, allSchools, trusts, schoolId }: { initialParticulars: any[], feeTypes: any[], allSchools: any[], trusts: any[], schoolId: number | null }) {
  const [particulars, setParticulars] = useState(initialParticulars)
  const [search, setSearch] = useState("")
  const [filterFeeType, setFilterFeeType] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const feeTypeMap: any = {}
  feeTypes.forEach((t: any) => { feeTypeMap[t.id] = t.name })
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = async () => setParticulars(await getAllFeeParticulars())

  const selectedClasses = form.class_name ? form.class_name.split(",").filter(Boolean) : []

  const toggleClass = (c: string) => {
    const current = selectedClasses
    const next = current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c]
    setForm({ ...form, class_name: next.join(",") })
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "amount" ? e.target.value : e.target.value.toUpperCase() })

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setForm({ ...form, duration_months: val, term: val === "12" ? "Yearly" : form.term === "Yearly" ? "First Term" : form.term })
  }

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.class_name || !form.particular_name || !form.amount || !form.fee_type_id) { setMessage("All fields are required"); return }
    if (selectedClasses.length === 0) { setMessage("Select at least one class"); return }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Trust is required for trust fee particulars."); return }
    const res = editing ? await updateFeeParticular(editing.id, toFD(form)) : await addFeeParticular(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this fee particular?")) return
    await deleteFeeParticular(id); refresh()
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
      const res = await fetch("/api/excel/import/fee-particulars", { method: "POST", body: fd })
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
  const filtered = particulars.filter((p: any) => {
    if (filterFeeType && String(p.fee_type_id) !== filterFeeType) return false
    if (!q) return true
    return [p.class_name, p.particular_name, feeTypeMap[p.fee_type_id], String(p.amount), p.fee_category].some((v: any) => v?.toLowerCase().includes(q))
  })

  const trustMap: any = {}
  trusts.forEach((t: any) => { trustMap[t.id] = t.trust_name })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Fee Particulars</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadFile("/api/excel/template/fee-particulars", "fee_particulars_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterFeeType} onChange={e => setFilterFeeType(e.target.value)}>
          <option value="">All Fee Types</option>
          {feeTypes.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} particulars</span>
      </div>
      {filtered.length === 0 ? <p>No fee particulars found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Fee Type</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Trust/School</th><th className="px-3 py-2">Particular Name</th><th className="px-3 py-2">Term</th><th className="px-3 py-2">Total Amount</th><th className="px-3 py-2">Frequency</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((p: any, i: number) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    {p.class_name ? p.class_name.split(",").map((c: string) => <span key={c} className="mr-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Class {c}</span>) : "-"}
                  </td>
                  <td className="px-3 py-2">{feeTypeMap[p.fee_type_id] || "-"}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${p.fee_category === "Trust" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{p.fee_category || "School"}</span></td>
                  <td className="px-3 py-2">{p.fee_category === "Trust" ? (trustMap[p.trust_id] || "-") : (p.school_id ? `School #${p.school_id}` : "-")}</td>
                  <td className="px-3 py-2">{p.particular_name}</td>
                  <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{p.term === "First Term" ? "1st Term" : p.term === "Second Term" ? "2nd Term" : "Yearly"}</span></td>
                  <td className="px-3 py-2 font-semibold">{Number(p.amount).toFixed(2)}</td>
                  <td className="px-3 py-2">{p.duration_months === 6 ? "Term Fees" : "Yearly Fees"}</td>
                  <td className="flex items-center gap-1 px-3 py-2">
                    <button className="text-slate-400 hover:text-slate-700" title="Move Up" onClick={async () => { const r = await moveFeeParticular(p.id, "up"); setMessage(r.message); refresh() }}>▲</button>
                    <button className="text-slate-400 hover:text-slate-700" title="Move Down" onClick={async () => { const r = await moveFeeParticular(p.id, "down"); setMessage(r.message); refresh() }}>▼</button>
                    <button className="ml-1 text-blue-600 hover:underline" onClick={() => { setEditing(p); setForm({ class_name: p.class_name || "", particular_name: p.particular_name || "", amount: p.amount || "", duration_months: String(p.duration_months || "12"), term: p.term || "Yearly", fee_type_id: p.fee_type_id ? String(p.fee_type_id) : "", fee_category: p.fee_category || "School", school_id: p.school_id ? String(p.school_id) : "", trust_id: p.trust_id ? String(p.trust_id) : "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(p.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Fee Particular" : "Add Fee Particular"}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={e => setForm({...form, fee_category: e.target.value})}>
                <option value="School">School Fee Particular</option>
                <option value="Trust">Trust Fee Particular</option>
              </select>
              {form.fee_category === "School" && !schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              {form.fee_category === "Trust" && (
                <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={e => setForm({...form, trust_id: e.target.value})}>
                  <option value="">SELECT TRUST</option>
                  {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
                </select>
              )}
              <select className="w-full rounded border p-3 text-sm" value={form.fee_type_id} onChange={set("fee_type_id")}> 
                <option value="">Select Fee Type *</option>
                {feeTypes.filter((t: any) => form.fee_category === "Trust" ? String(t.trust_id) === form.trust_id : !t.trust_id).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Classes *</label>
                <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto rounded border p-3">
                  {allClasses.map(c => (
                    <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedClasses.includes(c)} onChange={() => toggleClass(c)} className="rounded" />
                      Class {c}
                    </label>
                  ))}
                </div>
                {selectedClasses.length > 0 && <p className="mt-1 text-xs text-slate-500">{selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""} selected</p>}
              </div>
              <input className="w-full rounded border p-3 text-sm" placeholder="Particular Name (e.g. TUITION FEE) *" value={form.particular_name} onChange={set("particular_name")} />
              <input className="w-full rounded border p-3 text-sm" type="number" step="0.01" placeholder="Total Amount *" value={form.amount} onChange={set("amount")} />
               <select className="w-full rounded border p-3 text-sm" value={form.duration_months || "12"} onChange={handleDurationChange}>
                <option value="6">Term Fees (6 Months)</option>
                <option value="12">Yearly Fees (12 Months)</option>
              </select>
              {form.duration_months === "6" && (
                <select className="w-full rounded border p-3 text-sm" value={form.term || "Yearly"} onChange={e => setForm({...form, term: e.target.value})}>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                </select>
              )}
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