"use client"

import { useState, useCallback, useRef } from "react"
import { getAllFees, addFee, updateFee, deleteFee } from "./actions"
import { getInstallmentsByFeeId, updateInstallmentStatus } from "./installment-actions"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
type ParticularItem = { particular_name: string; amount: string; duration_months?: number; term?: string }
type FeeForm = { student_id: string; fee_category: string; fee_type_id: string; trust_id: string; particulars: ParticularItem[]; status: string; payment_date: string; payment_mode: string; transaction_id: string; cheque_number: string; cheque_date: string; bank_name: string; school_id: string; receipt_file_url: string; [key: string]: any }
const emptyForm: FeeForm = { student_id: "", fee_category: "School", fee_type_id: "", trust_id: "", particulars: [] as ParticularItem[], amount: "", status: "Paid", payment_date: "", payment_mode: "", transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "", school_id: "", receipt_file_url: "" }

type FeesClientProps = {
  initialFees: any[]
  students: any[]
  particulars: any[]
  feeTypes: any[]
  divisions: any[]
  years: any[]
  allSchools: any[]
  schoolId: number | null
  teacherClass: string
  trusts: any[]
}

export default function FeesClient({ initialFees, students, particulars, feeTypes, divisions, years, allSchools, schoolId, teacherClass, trusts }: FeesClientProps) {
  const [fees, setFees] = useState(initialFees)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [filterAy, setFilterAy] = useState("")
  const [filterFeeType, setFilterFeeType] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [installments, setInstallments] = useState<any[]>([])
  const [installmentModal, setInstallmentModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentMap: any = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const feeTypeMap: any = {}
  feeTypes.forEach((t: any) => { feeTypeMap[t.id] = t.name })

  const schoolMap: any = {}
  allSchools.forEach((s: any) => { schoolMap[s.id] = s.school_name })

  const trustMap: any = {}
  trusts.forEach((t: any) => { trustMap[t.id] = t.trust_name })

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
    if (filterFeeType && String(f.fee_type_id) !== filterFeeType) return false
    if (!q) return true
    const s = studentMap[f.student_id]
    return [f.amount, f.status, f.payment_mode, f.transaction_id, f.cheque_number, f.bank_name, f.payment_date, s?.full_name, s?.class_name].some((v: any) => v?.toLowerCase().includes(q))
  })

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value
    setForm({ ...form, payment_mode: mode, transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "" })
  }

  const getParticularsForClass = (className: string, feeTypeId?: string) => particulars.filter((p: any) => {
    const classes = (p.class_name || "").split(",").map((c: string) => c.trim())
    if (!classes.includes(className)) return false
    if (feeTypeId && String(p.fee_type_id) !== String(feeTypeId)) return false
    return true
  })

  const handleStudentSelect = (studentId: string) => {
    const s = studentMap[studentId]
    const classParticulars = form.fee_type_id ? getParticularsForClass(s?.class_name || "", form.fee_type_id) : []
    const parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount), duration_months: p.duration_months || 12, term: p.term || "Yearly" }))
    setForm({ ...form, student_id: studentId, particulars: parts })
  }

  const handleFeeTypeChange = (feeTypeId: string) => {
    const student = studentMap[form.student_id]
    // If 'record' is selected, load ALL particulars for the class instead of filtering by type
    const classParticulars = student ? getParticularsForClass(student.class_name || "", feeTypeId === "record" ? undefined : feeTypeId) : []
    const parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount), duration_months: p.duration_months || 12, term: p.term || "Yearly" }))
    setForm({ ...form, fee_type_id: feeTypeId === "record" ? "" : feeTypeId, particulars: parts })
  }

  const setParticularAmount = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...form.particulars]
    updated[index] = { ...updated[index], amount: e.target.value }
    setForm({ ...form, particulars: updated })
  }

  const totalAmount = form.fee_category === "Advance" 
    ? (Number(form.amount) || 0)
    : form.particulars.length > 0
      ? form.particulars.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
      : (Number(form.amount) || 0)

  const handleSave = async () => {
    if (!form.student_id) { setMessage("Select a student"); return }
    if (form.fee_category === "School" && !form.fee_type_id && form.particulars.length === 0) { setMessage("Select a fee type"); return }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Select a trust"); return }
    if (form.fee_category === "Advance" && !form.amount) { setMessage("Enter advance amount"); return }

    const payload = { 
      ...form, 
      fee_category: form.fee_category === "Advance" ? "School" : form.fee_category,
      particulars: form.fee_category === "Advance" ? [{ particular_name: "Advance Fee", amount: String(form.amount), duration_months: 1 }] : form.particulars.filter((p: any) => Number(p.amount) > 0), 
      duration_months: 1 
    }
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (k === "particulars") fd.append(k, JSON.stringify(v))
      else fd.append(k, String(v ?? ""))
    })
    const res = editing ? await updateFee(editing.id, fd) : await addFee(fd)
    if (!res.success) { setMessage(res.message || "Save failed"); return }
    setModal(false)
    refresh()
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

  const viewReceipt = (id: number) => window.open(`/api/fees/receipt/${id}`, "_blank")

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
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setInstallments([]); setMessage(""); setModal(true) }}>Add New</button>
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
        <select className="rounded border p-2 text-sm" value={filterFeeType} onChange={e => setFilterFeeType(e.target.value)}>
          <option value="">All Fee Types</option>
          {feeTypes.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
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
                <th className="px-3 py-2">Receipt No</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Fee Type</th>
                <th className="px-3 py-2">Trust</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Payment Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              <tr className="bg-blue-50/50">
                <td className="px-3 py-2 font-bold text-blue-600">Quick</td>
                <td className="px-3 py-2">
                  <select className="w-full rounded border p-1 text-xs" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value, fee_category: "Advance" })}>
                    <option value="">SELECT STUDENT FOR ADVANCE FEE</option>
                    {filteredStudents.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""})</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-slate-400">-</td>
                <td className="px-3 py-2 text-xs font-semibold text-blue-700 uppercase">Advance</td>
                <td className="px-3 py-2">-</td>
                <td className="px-3 py-2">-</td>
                <td className="px-3 py-2">-</td>
                <td className="px-3 py-2">
                  <input className="w-24 rounded border p-1 text-xs font-bold" type="number" placeholder="Amt" value={form.student_id ? (form.fee_category === "Advance" ? form.amount : "") : ""} onChange={e => setForm({ ...form, amount: e.target.value, fee_category: "Advance" })} />
                </td>
                <td className="px-3 py-2 text-xs">PAID</td>
                <td className="px-3 py-2">
                   <select className="rounded border p-1 text-xs" value={form.payment_mode} onChange={handleModeChange}>
                     <option value="Cash">Cash</option>
                     <option value="Online">Online</option>
                     <option value="Cheque">Cheque</option>
                   </select>
                </td>
                <td className="px-3 py-2">
                   <input type="date" className="rounded border p-1 text-xs" value={form.payment_date || new Date().toISOString().split("T")[0]} onChange={e => setForm({...form, payment_date: e.target.value})} />
                </td>
                <td className="px-3 py-2">
                  <button className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700" onClick={handleSave}>PAY</button>
                </td>
              </tr>
              {filtered.map((f: any, i: number) => {
                const s = studentMap[f.student_id]
                return (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : f.student_id}</td>
                    <td className="px-3 py-2 text-xs font-mono">{f.receipt_year && f.receipt_no ? `FEE-${f.receipt_year}-${String(f.receipt_no).padStart(4, "0")}` : "-"}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${f.fee_category === "Trust" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{f.fee_category || "School"}</span></td>
                    <td className="px-3 py-2">{feeTypeMap[f.fee_type_id] || "-"}</td>
                    <td className="px-3 py-2">{trustMap[f.trust_id] || "-"}</td>
                    <td className="px-3 py-2">{schoolMap[f.school_id] || "-"}</td>
                    <td className="px-3 py-2">{Number(f.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">{f.status}</td>
                    <td className="px-3 py-2">{f.payment_mode || "-"}</td>
                    <td className="px-3 py-2">{f.payment_date || "-"}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={async () => {
                        setEditing(f)
                        setForm({ ...f, fee_category: f.fee_category || "School", particulars: f.particulars?.length > 0 ? f.particulars.map((p: any) => ({ ...p, term: p.term || "Yearly" })) : [{ particular_name: "Tuition Fee", amount: String(f.amount), term: "Yearly" }] })
                        setMessage("")
                        setModal(true)
                        const inst = await getInstallmentsByFeeId(f.id)
                        setInstallments(inst)
                      }}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(f.id)}>Delete</button>
                      <button className="text-green-600 hover:underline" onClick={() => viewReceipt(f.id)}>Receipt</button>
                      {f.receipt_file_url && <a href={f.receipt_file_url} target="_blank" className="text-purple-600 hover:underline">PDF</a>}
                      <button className="text-indigo-600 hover:underline" onClick={async () => {
                        const inst = await getInstallmentsByFeeId(f.id)
                        setInstallments(inst)
                        setInstallmentModal(true)
                      }}>Installments</button>
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
              <select className="w-full rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={e => setForm({ ...form, fee_category: e.target.value, fee_type_id: "", trust_id: "", particulars: [], amount: "" })}>
                <option value="School">School Fee</option>
                <option value="Trust">Trust Fee</option>
                <option value="Advance">Advance Fee (Enter Amount)</option>
              </select>
              {form.fee_category === "Advance" && (
                <div className="rounded border bg-blue-50 p-3">
                  <label className="mb-1 block text-sm font-semibold text-blue-700">Advance Fee Amount</label>
                  <input className="w-full rounded border p-3 text-sm" type="number" step="0.01" placeholder="Enter Amount *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              )}
              {form.fee_category === "School" && (
                <select className="w-full rounded border p-3 text-sm" value={form.fee_type_id || ""} onChange={e => handleFeeTypeChange(e.target.value)}>
                  <option value="">Select Fee Type *</option>
                  <option value="record" className="font-bold text-blue-600">Fee Record (Load All Class Fees)</option>
                  {feeTypes.filter((t: any) => !t.trust_id).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              {form.fee_category === "Trust" && (
                <>
                  <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={e => setForm({ ...form, trust_id: e.target.value, fee_type_id: "", particulars: [] })}>
                    <option value="">Select Trust *</option>
                    {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
                  </select>
                  <select className="w-full rounded border p-3 text-sm" value={form.fee_type_id || ""} onChange={e => handleFeeTypeChange(e.target.value)}>
                    <option value="">Select Fee Type *</option>
                    <option value="record" className="font-bold text-blue-600">Fee Record (Load All Trust Fees)</option>
                    {feeTypes.filter((t: any) => String(t.trust_id) === form.trust_id).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </>
              )}
              {form.fee_category !== "Advance" && (
                <div className="rounded border bg-slate-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Fee Particulars</h4>
                  {form.particulars.length === 0 ? (
                    <div>
                      <p className="mb-2 text-xs text-slate-500">No fee particulars defined for this class.</p>
                      <input className="w-full rounded border p-3 text-sm" type="number" step="0.01" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.particulars.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-medium text-slate-600">{p.particular_name}</span>
                          <span className="text-xs text-slate-400">({p.duration_months === 6 ? "Term Fee" : "Yearly Fee"}{p.term && p.term !== "Yearly" ? ` - ${p.term}` : ""})</span>
                          <input className="w-32 rounded border p-2 text-sm text-right" type="number" step="0.01" placeholder="Amount" value={p.amount} onChange={setParticularAmount(i)} />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 border-t pt-2">
                        <span className="flex-1 text-base font-bold text-slate-900">Grand Total</span>
                        <span className="w-32 text-right text-base font-bold text-blue-700">{totalAmount.toFixed(2)}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 italic">* Full amount will be collected in a single installment.</p>
                    </div>
                  )}
                </div>
              )}
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
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : "Save"}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {installmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Fee Installments</h3>
            {installments.length === 0 ? (
              <p className="text-sm text-slate-500">No installments found for this fee record.</p>
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Paid Date</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {installments.map((inst: any) => (
                      <tr key={inst.id}>
                        <td className="px-3 py-2">Month {inst.month_number}</td>
                        <td className="px-3 py-2">{inst.due_date || "-"}</td>
                        <td className="px-3 py-2">{Number(inst.amount).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${inst.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{inst.status}</span>
                        </td>
                        <td className="px-3 py-2">{inst.paid_date || "-"}</td>
                        <td className="px-3 py-2">
                          {inst.status !== "Paid" && (
                            <button className="text-green-600 hover:underline" onClick={async () => {
                              await updateInstallmentStatus(inst.id, "Paid", new Date().toISOString().split("T")[0], "", "")
                              const inst2 = await getInstallmentsByFeeId(installments[0]?.fee_id)
                              setInstallments(inst2)
                            }}>Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setInstallmentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
