"use client"

import { useState, useRef } from "react"
import { getAllFeeTypes, addFeeType, updateFeeType, deleteFeeType, moveFeeType } from "./actions"

const allClasses = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const emptyForm = { name: "", description: "", class_names: "", fee_category: "School", school_id: "", trust_id: "" }

export default function FeeTypesClient({ initialFeeTypes, initialParticulars, allSchools, trusts, schoolId }: { initialFeeTypes: any[]; initialParticulars: any[]; allSchools: any[]; trusts: any[]; schoolId: number | null }) {
  const [feeTypes, setFeeTypes] = useState(initialFeeTypes)
  const [particulars, setParticulars] = useState(initialParticulars)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [heads, setHeads] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedClasses = form.class_names ? form.class_names.split(",").filter(Boolean) : []

  const toggleClass = (c: string) => {
    const current = selectedClasses
    const next = current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c]
    setForm({ ...form, class_names: next.join(",") })
  }

  const refresh = async () => {
    const { getAllFeeParticulars } = await import("../fee-particulars/actions")
    setFeeTypes(await getAllFeeTypes())
    setParticulars(await getAllFeeParticulars())
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === "name" ? e.target.value.toUpperCase() : e.target.value })

  const addHead = () => setHeads([...heads, { class_name: selectedClasses[0] || "", particular_name: "", amount: "", duration_months: 12, term: "Yearly" }])
  const updateHead = (i: number, updates: any) => {
    setHeads(prev => {
      const next = [...prev]
      next[i] = { ...next[i], ...updates }
      return next
    })
  }
  const removeHead = (i: number) => setHeads(heads.filter((_, idx) => idx !== i))

  const toFD = (obj: any) => { 
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    fd.append("heads", JSON.stringify(heads))
    return fd 
  }

  const handleSave = async () => {
    if (!form.name) { setMessage("Fee type name is required"); return }
    if (form.fee_category === "School" && !schoolId && !form.school_id) { setMessage("School is required for school fee type."); return }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Trust is required for trust fee type."); return }
    const res = editing ? await updateFeeType(editing.id, toFD(form)) : await addFeeType(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this fee type? All associated particulars will be lost.")) return
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
        <h2 className="text-2xl font-semibold">Fee Types & Heads</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setHeads([]); setMessage(""); setModal(true) }}>Add New Fee Type</button>
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
                <th className="px-3 py-2">Heads (Particulars)</th>
                <th className="px-3 py-2">Classes</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((ft: any, i: number) => {
                const ftHeads = particulars.filter((p: any) => p.fee_type_id === ft.id)
                return (
                  <tr key={ft.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-bold">{ft.name}</td>
                    <td className="px-3 py-2">
                       <div className="flex flex-wrap gap-1">
                         {ftHeads.length > 0 ? ftHeads.slice(0, 3).map((h: any) => (
                           <span key={h.id} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">{h.particular_name} (₹{h.amount})</span>
                         )) : <span className="text-slate-400 italic">No heads defined</span>}
                         {ftHeads.length > 3 && <span className="text-[10px] text-slate-400">+{ftHeads.length - 3} more</span>}
                       </div>
                    </td>
                    <td className="px-3 py-2">
                      {ft.class_names ? ft.class_names.split(",").map((c: string) => <span key={c} className="mr-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{c}</span>) : <span className="text-xs text-slate-400">All</span>}
                    </td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${ft.fee_category === "Trust" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{ft.fee_category || "School"}</span></td>
                    <td className="flex items-center gap-1 px-3 py-2">
                      <button className="text-slate-400 hover:text-slate-700" title="Move Up" onClick={async () => { const r = await moveFeeType(ft.id, "up"); setMessage(r.message); refresh() }}>▲</button>
                      <button className="text-slate-400 hover:text-slate-700" title="Move Down" onClick={async () => { const r = await moveFeeType(ft.id, "down"); setMessage(r.message); refresh() }}>▼</button>
                      <button className="ml-1 text-blue-600 hover:underline" onClick={() => { 
                        setEditing(ft); 
                        setForm({ name: ft.name || "", description: ft.description || "", class_names: ft.class_names || "", fee_category: ft.fee_category || "School", school_id: ft.school_id ? String(ft.school_id) : "", trust_id: ft.trust_id ? String(ft.trust_id) : "" }); 
                        setHeads(ftHeads.map((h: any) => ({ class_name: h.class_name, particular_name: h.particular_name, amount: String(h.amount), duration_months: h.duration_months || 12, term: h.term || "Yearly" })));
                        setMessage(""); 
                        setModal(true) 
                      }}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(ft.id)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Fee Type & Heads" : "Add Fee Type & Heads"}</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={set("fee_category")}>
                  <option value="School">School Fee</option>
                  <option value="Trust">Trust Fee</option>
                </select>
                <input className="rounded border p-3 text-sm font-bold" placeholder="FEE TYPE NAME" value={form.name} onChange={set("name")} />
              </div>
              
              {!schoolId && form.fee_category === "School" && (
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
              
              <textarea className="w-full rounded border p-3 text-sm" placeholder="Description" value={form.description} onChange={set("description")} rows={2} />
              
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500 uppercase tracking-widest">Assign to Classes</label>
                <div className="grid grid-cols-5 gap-2 rounded border p-3 bg-slate-50">
                  {allClasses.map(c => (
                    <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={selectedClasses.includes(c)} onChange={() => toggleClass(c)} className="rounded" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded border p-4 bg-blue-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Fee Heads (Dynamic Particulars)</h4>
                  <button className="rounded bg-blue-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-700" onClick={addHead}>+ Add Head</button>
                </div>
                
                {heads.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded border border-dashed">No heads defined for this fee type yet.</p>
                ) : (
                  <div className="space-y-2">
                    {heads.map((h, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 bg-white p-2 rounded border shadow-sm">
                        <select className="col-span-3 rounded border p-2 text-xs font-bold" value={h.class_name} onChange={e => updateHead(i, { class_name: e.target.value })}>
                          <option value="">CLASS</option>
                          {selectedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input className="col-span-3 rounded border p-2 text-xs" placeholder="HEAD NAME" value={h.particular_name} onChange={e => updateHead(i, { particular_name: e.target.value.toUpperCase() })} />
                        <input className="col-span-2 rounded border p-2 text-xs font-bold text-blue-600" type="number" placeholder="AMT" value={h.amount} onChange={e => updateHead(i, { amount: e.target.value })} />
                        <select className="col-span-3 rounded border p-2 text-xs" value={h.term} onChange={e => {
                          const val = e.target.value
                          updateHead(i, { term: val, duration_months: val === "Yearly" ? 12 : 6 })
                        }}>
                          <option value="Yearly">Yearly</option>
                          <option value="First Term">1st Term</option>
                          <option value="Second Term">2nd Term</option>
                        </select>
                        <button className="col-span-1 text-red-500 font-bold hover:text-red-700" onClick={() => removeHead(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-6 flex gap-3">
              <button className="rounded bg-blue-600 px-6 py-2.5 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700" onClick={handleSave}>{editing ? "Update ALL" : "Save ALL"}</button>
              <button className="rounded bg-slate-300 px-6 py-2.5 text-xs font-black text-slate-700 uppercase tracking-widest hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}