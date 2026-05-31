"use client"

import { useState, useCallback, useRef } from "react"
import { getAllFees, addFee, updateFee, deleteFee } from "./actions"
import { createClient } from "@/lib/supabase/client"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
type ParticularItem = { particular_name: string; amount: string }
type FeeForm = { student_id: string; trust_id: string; particulars: ParticularItem[]; status: string; payment_date: string; payment_mode: string; transaction_id: string; cheque_number: string; cheque_date: string; bank_name: string; school_id: string; receipt_file_url: string; [key: string]: any }
const emptyForm: FeeForm = { student_id: "", trust_id: "", particulars: [] as ParticularItem[], status: "Paid", payment_date: "", payment_mode: "", transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "", school_id: "", receipt_file_url: "" }

type FeesClientProps = {
  initialFees: any[]
  students: any[]
  particulars: any[]
  divisions: any[]
  years: any[]
  allSchools: any[]
  schoolId: number | null
  teacherClass: string
  trusts: any[]
}

export default function FeesClient({ initialFees, students, particulars, divisions, years, allSchools, schoolId, teacherClass, trusts }: FeesClientProps) {
  const [fees, setFees] = useState(initialFees)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [filterAy, setFilterAy] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [generateReceipt, setGenerateReceipt] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const studentMap: any = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const refresh = useCallback(async () => {
    const data = await getAllFees()
    setFees(data)
  }, [])

  const setRaw = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const filteredStudents = students.filter((s: any) => {
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    if (filterAy && String(s.academic_year_id) !== filterAy) return false
    return true
  })

  const filteredStudentIds = new Set(filteredStudents.map((s: any) => s.id))
  const q = search.toLowerCase()
  const filtered = fees.filter((f: any) => {
    if (!filteredStudentIds.has(f.student_id)) return false
    if (!q) return true
    const s = studentMap[f.student_id]
    return [f.amount, f.status, f.payment_mode, f.transaction_id, f.cheque_number, f.bank_name, f.payment_date, s?.full_name, s?.class_name].some((v: any) => v?.toLowerCase().includes(q))
  })

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value
    setForm({ ...form, payment_mode: mode, transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "" })
  }

  const getParticularsForClass = (className: string) => particulars.filter((p: any) => p.class_name === className)

  const handleStudentSelect = (studentId: string) => {
    const s = studentMap[studentId]
    const classParticulars = getParticularsForClass(s?.class_name || "")
    const parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount) }))
    setForm({ ...form, student_id: studentId, particulars: parts })
  }

  const setParticularAmount = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...form.particulars]
    updated[index] = { ...updated[index], amount: e.target.value }
    setForm({ ...form, particulars: updated })
  }

  const totalAmount = form.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

  const handleSave = async () => {
    if (!form.student_id) { setMessage("Select a student"); return }
    const payload = { ...form, particulars: form.particulars.filter((p: any) => Number(p.amount) > 0) }
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (k === "particulars") fd.append(k, JSON.stringify(v))
      else fd.append(k, String(v ?? ""))
    })
    const feeId = editing?.id
    const res = editing ? await updateFee(editing.id, fd) : await addFee(fd)
    if (!res.success) { setMessage(res.message || "Save failed"); return }
    setModal(false)
    refresh()
    if (generateReceipt) {
      const savedId = res.id || feeId
      if (savedId) {
        downloadBlob(`/api/fees/receipt/${savedId}?copy=office&download=1`, `office_${savedId}.pdf`)
        downloadBlob(`/api/fees/receipt/${savedId}?copy=student&download=1`, `student_${savedId}.pdf`)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this fee record?")) return
    await deleteFee(id)
    refresh()
  }

  const downloadBlob = async (url: string, filename: string) => {
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
      const res = await fetch("/api/excel/import/fees", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} records. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const viewReceipt = (id: number) => window.open(`/api/fees/receipt/${id}?download=1`, "_blank")

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Fees</h2>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadBlob("/api/excel/template/fees", "fees_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700" onClick={() => downloadBlob(`/api/fees/export?class_name=${filterClass}&division=${filterDiv}&academic_year_id=${filterAy}`, "fees_report.xlsx")}>Download Report</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setGenerateReceipt(false); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv("") }} disabled={!!teacherClass}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.filter((d: any) => d.class_name === filterClass || !filterClass).map((d: any) => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <select className="rounded border p-2 text-sm" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
          <option value="">All Years</option>
          {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} records</span>
      </div>
      {filtered.length === 0 ? <p>No fee records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Payment Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((f: any, i: number) => {
                const s = studentMap[f.student_id]
                return (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : f.student_id}</td>
                    <td className="px-3 py-2">{Number(f.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">{f.status}</td>
                    <td className="px-3 py-2">{f.payment_mode || "-"}</td>
                    <td className="px-3 py-2">{f.payment_date || "-"}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => { setEditing(f); setForm({ ...f, particulars: f.particulars?.length > 0 ? f.particulars : [{ particular_name: "Tuition Fee", amount: String(f.amount) }] }); setMessage(""); setGenerateReceipt(false); setModal(true) }}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(f.id)}>Delete</button>
                      <button className="text-green-600 hover:underline" onClick={() => viewReceipt(f.id)}>Receipt</button>
                      {f.receipt_file_url && <a href={f.receipt_file_url} target="_blank" className="text-purple-600 hover:underline">PDF</a>}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Fee Record" : "Add Fee Record"}</h3>
            <div className="grid gap-3">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              <select className="w-full rounded border p-3 text-sm" value={form.student_id || ""} onChange={e => handleStudentSelect(e.target.value)}>
                <option value="">Select Student *</option>
                {filteredStudents.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""})</option>
                ))}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={setRaw("trust_id")}>
                <option value="">Select Trust</option>
                {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
              </select>
              <div className="rounded border bg-slate-50 p-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Fee Particulars</h4>
                {form.particulars.length === 0 ? (
                  <p className="text-xs text-slate-500">No fee particulars defined for this class.</p>
                ) : (
                  <div className="space-y-2">
                    {form.particulars.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-medium text-slate-600">{p.particular_name}</span>
                        <input className="w-40 rounded border p-2 text-sm text-right" type="number" step="0.01" placeholder="Amount" value={p.amount} onChange={setParticularAmount(i)} />
                      </div>
                    ))}
                    <div className="flex items-center gap-2 border-t pt-2">
                      <span className="flex-1 text-sm font-bold text-slate-800">Total</span>
                      <span className="w-40 text-right text-sm font-bold text-slate-800">{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <select className="w-full rounded border p-3 text-sm" value={form.status || "Paid"} onChange={setRaw("status")}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.payment_mode || ""} onChange={handleModeChange}>
                <option value="">Select Mode</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
              </select>
              {form.payment_mode === "Online" && (
                <input className="w-full rounded border p-3 text-sm" placeholder="Transaction ID" value={form.transaction_id} onChange={set("transaction_id")} />
              )}
              {form.payment_mode === "Cheque" && (
                <div className="grid gap-3">
                  <input className="w-full rounded border p-3 text-sm" placeholder="Cheque Number" value={form.cheque_number} onChange={set("cheque_number")} />
                  <input className="w-full rounded border p-3 text-sm" type="date" placeholder="Cheque Date" value={form.cheque_date} onChange={setRaw("cheque_date")} />
                  <input className="w-full rounded border p-3 text-sm" placeholder="Bank Name" value={form.bank_name} onChange={set("bank_name")} />
                </div>
              )}
              <input className="w-full rounded border p-3 text-sm" type="date" value={form.payment_date} onChange={setRaw("payment_date")} />
              <div className="rounded border bg-slate-50 p-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Receipt Attachment (PDF)</h4>
                <input type="file" className="w-full text-sm" accept=".pdf" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !schoolId) return
                  setUploadingReceipt(true)
                  const path = `${schoolId}/fees/receipt_${Date.now()}.pdf`
                  try {
                    const { error } = await supabase.storage.from("school-files").upload(path, file)
                    if (error) throw error
                    const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
                    setForm(prev => ({ ...prev, receipt_file_url: publicUrl }))
                  } catch (err: any) { alert(err.message) }
                  finally { setUploadingReceipt(false) }
                }} />
                {uploadingReceipt && <p className="text-[10px] text-blue-600 mt-1">Uploading...</p>}
                {form.receipt_file_url && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-green-600">Uploaded</span>
                    <a href={form.receipt_file_url} target="_blank" className="text-[10px] text-blue-600 hover:underline">View PDF</a>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 rounded border p-3 text-sm">
                <input type="checkbox" checked={generateReceipt} onChange={e => setGenerateReceipt(e.target.checked)} className="h-4 w-4" />
                <span className="font-medium text-slate-700">Generate Receipt</span>
              </label>
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
