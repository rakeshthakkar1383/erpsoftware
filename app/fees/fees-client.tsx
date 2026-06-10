"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { getAllFees, addFee, updateFee, deleteFee } from "./actions"
import { getInstallmentsByFeeId, updateInstallmentStatus } from "./installment-actions"
import { addStudent, updateStudent } from "@/app/students/actions"
import { formatDate } from "@/lib/utils"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
type ParticularItem = { particular_name: string; amount: string; duration_months?: number; term?: string }
type FeeForm = { student_id: string; fee_category: string; selectedFeeTypeIds: string[]; trust_id: string; particulars: ParticularItem[]; status: string; payment_date: string; payment_mode: string; transaction_id: string; cheque_number: string; cheque_date: string; bank_name: string; school_id: string; receipt_file_url: string; full_name: string; class_name: string; mobile: string; gender: string; dob: string; category: string; term: string; receipt_no: string; receipt_year: string; [key: string]: any }
const emptyForm: FeeForm = { student_id: "", fee_category: "School", selectedFeeTypeIds: [], trust_id: "", particulars: [] as ParticularItem[], amount: "", status: "Paid", payment_date: "", payment_mode: "", transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "", school_id: "", receipt_file_url: "", full_name: "", class_name: "", mobile: "", gender: "", dob: "", category: "", term: "Yearly", receipt_no: "", receipt_year: "" }

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
  preSelectedStudentId?: string
}

export default function FeesClient({ initialFees, students, particulars, feeTypes, divisions, years, allSchools, schoolId, teacherClass, trusts, preSelectedStudentId }: FeesClientProps) {
  const [fees, setFees] = useState(initialFees)
  const [filterClass, setFilterClass] = useState(teacherClass)
  const [filterDiv, setFilterDiv] = useState("")
  const [filterAy, setFilterAy] = useState("")
  const [filterFeeType, setFilterFeeType] = useState("")
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'receipt_no', direction: 'asc'})
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [installments, setInstallments] = useState<any[]>([])
  const [installmentModal, setInstallmentModal] = useState(false)
  const [admissionType, setAdmissionType] = useState<"new" | "old">("old")
  const [reportModal, setReportModal] = useState(false)
  const [reportFeeTypeIds, setReportFeeTypeIds] = useState<string[]>([])
  const [reportSchoolId, setReportSchoolId] = useState("")
  const [reportFromDate, setReportFromDate] = useState("")
  const [reportToDate, setReportToDate] = useState("")
  const [guidedClass, setGuidedClass] = useState("")
  const [guidedFeeTypeId, setGuidedFeeTypeId] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentMap: any = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const feeTypeMap: any = {}
  feeTypes.forEach((t: any) => { feeTypeMap[t.id] = t.name })

  const schoolMap: any = {}
  allSchools.forEach((s: any) => { schoolMap[s.id] = s.school_name })

  const trustMap: any = {}
  trusts.forEach((t: any) => { trustMap[t.id] = t.trust_name })

  const availableFeeTypeOptions = useMemo(() => {
    let base = feeTypes.filter((t: any) => {
      if (form.fee_category === "Trust") return String(t.trust_id) === form.trust_id
      return !t.trust_id
    })
    
    // Filter by guidedClass if set
    if (guidedClass) {
      base = base.filter((t: any) => {
        if (!t.class_names) return true // Applies to all if empty
        const assigned = t.class_names.split(",").map((c: string) => c.trim())
        return assigned.includes(guidedClass)
      })
    }
    return base
  }, [feeTypes, form.fee_category, form.trust_id, guidedClass])

  const filteredStudentsForGuided = useMemo(() => {
    if (!guidedClass) return []
    return students.filter((s: any) => s.class_name === guidedClass || String(s.id) === String(form.student_id))
  }, [students, guidedClass, form.student_id])

  useEffect(() => {
    if (preSelectedStudentId) {
      setEditing(null)
      setInstallments([])
      setMessage("")
      setAdmissionType("old")
      setGuidedClass(studentMap[preSelectedStudentId]?.class_name || "")
      setGuidedFeeTypeId("")
      setModal(true)
      setTimeout(() => handleStudentSelect(preSelectedStudentId), 0)
    }
  }, [preSelectedStudentId])

  const refresh = useCallback(async () => {
    const data = await getAllFees()
    setFees(data)
  }, [])

  const setRaw = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value
    const noUpper = ["class_name", "dob", "payment_date", "cheque_date", "receipt_no", "receipt_year"]
    setForm(prev => ({ ...prev, [field]: noUpper.includes(field) ? val : val.toUpperCase() }))
  }

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
    return [f.amount, f.status, f.payment_mode, f.transaction_id, f.cheque_number, f.bank_name, f.payment_date, s?.full_name, s?.class_name].some((v: any) => String(v || "").toLowerCase().includes(q))
  })

  const sortedFees = useMemo(() => {
    let sortable = [...filtered]
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aVal: any = "", bVal: any = ""
        
        // Map columns to values
        if (sortConfig.key === 'student') {
            aVal = studentMap[a.student_id]?.full_name || ""
            bVal = studentMap[b.student_id]?.full_name || ""
        } else if (sortConfig.key === 'fee_type') {
            aVal = feeTypeMap[a.fee_type_id] || ""
            bVal = feeTypeMap[b.fee_type_id] || ""
        } else if (sortConfig.key === 'trust') {
            aVal = trustMap[a.trust_id] || ""
            bVal = trustMap[b.trust_id] || ""
        } else if (sortConfig.key === 'school') {
            aVal = schoolMap[a.school_id] || ""
            bVal = schoolMap[b.school_id] || ""
        } else {
            aVal = a[sortConfig.key] || ""
            bVal = b[sortConfig.key] || ""
        }

        // Compare
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [filtered, sortConfig, studentMap, feeTypeMap, trustMap, schoolMap])

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value
    setForm(prev => ({ ...prev, payment_mode: mode, transaction_id: "", cheque_number: "", cheque_date: "", bank_name: "" }))
  }

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const bd = new Date(dob)
    const td = new Date()
    let age = td.getFullYear() - bd.getFullYear()
    const m = td.getMonth() - bd.getMonth()
    if (m < 0 || (m === 0 && td.getDate() < bd.getDate())) age--
    return age >= 0 ? `${age} years` : ""
  }

  const getParticularsForClass = (className: string, feeTypeIds?: string[], term?: string) => particulars.filter((p: any) => {
    const pClasses = (p.class_name || "").split(",").map((c: string) => c.trim())
    if (!pClasses.includes(className)) return false
    if (feeTypeIds && feeTypeIds.length > 0) {
      if (p.fee_type_id && !feeTypeIds.includes(String(p.fee_type_id))) return false
    }
    if (term) {
       if (p.term !== term) return false
    }
    return true
  })

  const reloadParticulars = (studentId: string, selectedIds: string[]) => {
    const s = studentMap[studentId]
    if (!s) { setForm(prev => ({ ...prev, student_id: studentId, selectedFeeTypeIds: selectedIds, particulars: [] })); return }
    const isAllRecord = selectedIds.includes("record")
    const activeTypeIds = isAllRecord ? [] : selectedIds
    let classParticulars = getParticularsForClass(s.class_name || "", activeTypeIds.length > 0 ? activeTypeIds : undefined, form.term)
    let parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount), duration_months: p.duration_months || 12, term: p.term || "Yearly" }))
    setForm(prev => ({ 
      ...prev, 
      student_id: studentId, 
      selectedFeeTypeIds: selectedIds, 
      particulars: parts,
      full_name: s.full_name || "",
      class_name: s.class_name || "",
      mobile: s.mobile || "",
      gender: s.gender || "",
      dob: s.dob || "",
      category: s.category || ""
    }))
  }

  const reloadParticularsForClassAndType = (className: string, feeTypeId: string, term?: string) => {
    const activeTerm = term || form.term
    if (!className || !feeTypeId) { setForm(prev => ({ ...prev, particulars: [] })); return }
    let classParticulars = getParticularsForClass(className, [feeTypeId], activeTerm)
    let parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount), duration_months: p.duration_months || 12, term: p.term || "Yearly" }))
    setForm(prev => ({ ...prev, selectedFeeTypeIds: [feeTypeId], particulars: parts }))
  }

  const reloadParticularsForClass = (className: string, selectedIds: string[]) => {
    if (!className) { setForm(prev => ({ ...prev, selectedFeeTypeIds: selectedIds, particulars: [] })); return }
    const isAllRecord = selectedIds.includes("record")
    const activeTypeIds = isAllRecord ? [] : selectedIds
    let classParticulars = getParticularsForClass(className, activeTypeIds.length > 0 ? activeTypeIds : undefined, form.term)
    let parts = classParticulars.map((p: any) => ({ particular_name: p.particular_name, amount: String(p.amount), duration_months: p.duration_months || 12, term: p.term || "Yearly" }))
    setForm(prev => ({ ...prev, selectedFeeTypeIds: selectedIds, particulars: parts }))
  }

  const getFeeTypeAmount = (feeTypeId: string) => {
    const className = guidedClass || (form.student_id ? (studentMap[form.student_id]?.class_name || "") : form.class_name)
    if (!className) return 0
    return particulars
      .filter((p: any) => {
        const pClasses = (p.class_name || "").split(",").map((c: string) => c.trim())
        return pClasses.includes(className) && String(p.fee_type_id) === feeTypeId
      })
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  }

  const handleStudentSelect = (studentId: string) => {
    if (String(studentId) === String(form.student_id)) return
    reloadParticulars(studentId, form.selectedFeeTypeIds)
  }

  const handleFeeTypeToggle = (id: string) => {
    const current = form.selectedFeeTypeIds
    const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    if (form.student_id) {
      reloadParticulars(form.student_id, next)
    } else if (admissionType === "new" && form.class_name) {
      reloadParticularsForClass(form.class_name, next)
    } else {
      setForm(prev => ({ ...prev, selectedFeeTypeIds: next }))
    }
  }

  const handleGuidedClassChange = (className: string) => {
    setGuidedClass(className)
    setGuidedFeeTypeId("")
    setForm(prev => ({ ...prev, class_name: className, student_id: "", particulars: [], selectedFeeTypeIds: [] }))
  }

  const handleGuidedFeeTypeChange = (feeTypeId: string) => {
    setGuidedFeeTypeId(feeTypeId)
    reloadParticularsForClassAndType(guidedClass, feeTypeId)
  }

  const handleGuidedTermChange = (term: string) => {
    setForm(prev => ({ ...prev, term }))
    if (guidedClass && guidedFeeTypeId) {
       reloadParticularsForClassAndType(guidedClass, guidedFeeTypeId, term)
    }
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
    setMessage("")

    let studentId = form.student_id
    console.log("DEBUG: handleSave studentId:", studentId, "form:", form);

    if (admissionType === "new") {
      if (!form.full_name || !form.class_name) { setMessage("Name and Class are required"); return }
      const fd = new FormData()
      fd.append("full_name", form.full_name)
      fd.append("class_name", form.class_name)
      fd.append("mobile", form.mobile)
      fd.append("gender", form.gender)
      fd.append("dob", form.dob)
      fd.append("category", form.category)
      if (schoolId) fd.append("school_id", String(schoolId))
      else if (form.school_id) fd.append("school_id", String(form.school_id))
      const activeYear = years.find((y: any) => y.is_active)
      if (activeYear) fd.append("academic_year_id", String(activeYear.id))
      const res = await addStudent(fd)
      if (!res.success || !res.studentId) { setMessage(res.message || "Failed to create student"); return }
      studentId = String(res.studentId)
    }

    if (studentId === null || studentId === undefined || studentId === "") { 
      console.error("DEBUG: Save failed, missing studentId:", studentId);
      setMessage(`Select a student (ID: ${studentId})`); 
      return 
    }
    if (form.fee_category !== "Advance" && form.selectedFeeTypeIds.length === 0 && form.particulars.length === 0) { setMessage("Select at least one fee type"); return }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Select a trust"); return }
    if (form.fee_category === "Advance" && !form.amount) { setMessage("Enter advance amount"); return }

    const primaryFeeTypeId = form.selectedFeeTypeIds.find(id => id !== "bhojan" && id !== "record") || null
    const payload: any = { 
      ...form, 
      student_id: studentId,
      fee_type_id: primaryFeeTypeId || "",
      fee_category: form.fee_category === "Advance" ? "School" : form.fee_category,
      particulars: form.fee_category === "Advance" ? [{ particular_name: "Advance Fee", amount: String(form.amount), duration_months: 1 }] : form.particulars.filter((p: any) => Number(p.amount) > 0), 
      duration_months: 1 
    }
    delete payload.selectedFeeTypeIds
    delete payload.full_name
    delete payload.class_name
    delete payload.mobile
    delete payload.gender
    delete payload.dob
    delete payload.category
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (k === "particulars") fd.append(k, JSON.stringify(v))
      else fd.append(k, String(v ?? ""))
    })
    const res = editing ? await updateFee(editing.id, fd) : await addFee(fd)
    if (editing && res.success) {
      const sFd = new FormData()
      sFd.append("full_name", form.full_name)
      sFd.append("class_name", form.class_name)
      sFd.append("mobile", form.mobile)
      sFd.append("gender", form.gender)
      sFd.append("dob", form.dob)
      sFd.append("category", form.category)
      await updateStudent(Number(form.student_id), sFd)
    }
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
    
    // For admins, ensure a school is selected if we don't have a fixed schoolId
    if (!schoolId && !form.school_id) {
       alert("Please select a school from the 'Add New' modal dropdown before importing to ensure records are visible to clerks.")
       if (fileInputRef.current) fileInputRef.current.value = ""
       return
    }

    const fd = new FormData()
    fd.append("file", file)
    if (schoolId) fd.append("school_id", String(schoolId))
    else if (form.school_id) fd.append("school_id", String(form.school_id))

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
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700" onClick={() => { setReportFeeTypeIds([]); setReportModal(true) }}>Report</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setInstallments([]); setMessage(""); setAdmissionType("old"); setGuidedClass(""); setGuidedFeeTypeId(""); setModal(true) }}>Add New</button>
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
      {sortedFees.length === 0 ? <p>No fee records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'student', direction: sortConfig.key === 'student' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Student</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'class_name', direction: sortConfig.key === 'class_name' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Class</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'receipt_no', direction: sortConfig.key === 'receipt_no' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Receipt No</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'fee_category', direction: sortConfig.key === 'fee_category' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Category</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'fee_type', direction: sortConfig.key === 'fee_type' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Fee Type</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'trust', direction: sortConfig.key === 'trust' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Trust</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'school', direction: sortConfig.key === 'school' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>School</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'amount', direction: sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Amount</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'status', direction: sortConfig.key === 'status' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Status</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'payment_mode', direction: sortConfig.key === 'payment_mode' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Mode</th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-200" onClick={() => setSortConfig({key: 'payment_date', direction: sortConfig.key === 'payment_date' && sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>Payment Date</th>
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
              {sortedFees.map((f: any, i: number) => {
                const s = studentMap[f.student_id]
                return (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s?.full_name || f.student_id}</td>
                    <td className="px-3 py-2">{s?.class_name || "-"}</td>
                    <td className="px-3 py-2 text-xs font-mono">{f.receipt_year && f.receipt_no ? `FEE-${f.receipt_year}-${String(f.receipt_no).padStart(4, "0")}` : "-"}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${f.fee_category === "Trust" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{f.fee_category || "School"}</span></td>
                    <td className="px-3 py-2">{feeTypeMap[f.fee_type_id] || "-"}</td>
                    <td className="px-3 py-2">{trustMap[f.trust_id] || "-"}</td>
                    <td className="px-3 py-2">{schoolMap[f.school_id] || "-"}</td>
                    <td className="px-3 py-2">{Number(f.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">{f.status}</td>
                    <td className="px-3 py-2">{f.payment_mode || "-"}</td>
                    <td className="px-3 py-2">{formatDate(f.payment_date)}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={async () => {
                        const selectedIds: string[] = []
                        if (f.fee_type_id) selectedIds.push(String(f.fee_type_id))
                        setEditing(f)
                        setAdmissionType("old")
                        setGuidedClass(studentMap[f.student_id]?.class_name || "")
                        setGuidedFeeTypeId(f.fee_type_id ? String(f.fee_type_id) : "")
                        const s = studentMap[f.student_id]
                        setForm({ 
                          ...f, 
                          receipt_no: String(f.receipt_no || ""),
                          full_name: s?.full_name || "",
                          class_name: s?.class_name || "",
                          mobile: s?.mobile || "",
                          gender: s?.gender || "",
                          dob: s?.dob || "",
                          category: s?.category || "",
                          fee_category: f.fee_category || "School", 
                          selectedFeeTypeIds: selectedIds, 
                          particulars: f.particulars?.length > 0 ? f.particulars.map((p: any) => ({ ...p, term: p.term || "Yearly" })) : [{ particular_name: "Tuition Fee", amount: String(f.amount), term: "Yearly" }] 
                        })
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? `Edit Fee Record - ${form.full_name}` : (admissionType === "new" ? "Admit & Collect Fee" : "Add Fee Record")}</h3>
            {!editing && (
              <div className="mb-4 flex rounded-lg border bg-slate-50 p-1">
                <button
                  className={`flex-1 rounded-md py-2 text-xs font-black uppercase tracking-widest transition-all ${admissionType === "new" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => { setAdmissionType("new"); setForm(prev => ({ ...prev, student_id: "", particulars: [] })); setGuidedClass(""); setGuidedFeeTypeId("") }}
                >New Admission</button>
                <button
                  className={`flex-1 rounded-md py-2 text-xs font-black uppercase tracking-widest transition-all ${admissionType === "old" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => { setAdmissionType("old"); setForm(prev => ({ ...prev, full_name: "", class_name: "", mobile: "", gender: "", dob: "", category: "", particulars: [] })); setGuidedClass(""); setGuidedFeeTypeId("") }}
                >Old Student</button>
              </div>
            )}
            <div className="grid gap-3">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              )}
              {(admissionType === "new" || editing) ? (
                <div className="space-y-3 rounded border bg-blue-50/50 p-3">
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">{editing ? "Edit Student Details" : "Student Details"}</h4>
                  <input className="w-full rounded border p-3 text-sm font-bold" placeholder="FULL NAME *" value={form.full_name} onChange={set("full_name")} />
                  <select className="w-full rounded border bg-white p-3 text-sm font-bold" value={form.class_name} onChange={e => { setForm(prev => ({...prev, class_name: e.target.value})); handleGuidedClassChange(e.target.value) }}>
                    <option value="">SELECT CLASS *</option>
                    {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                  </select>
                  
                  {/* Student dropdown for existing records */}
                  {editing && (
                    <select className="w-full rounded border p-3 text-sm font-bold bg-blue-50 border-blue-200" value={form.student_id || ""} onChange={e => handleStudentSelect(e.target.value)}>
                      <option value="">SELECT STUDENT *</option>
                      {filteredStudentsForGuided.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""})</option>
                      ))}
                    </select>
                  )}

                  {/* Fee category/particulars selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={form.term} onChange={e => handleGuidedTermChange(e.target.value)}>
                      <option value="Yearly">YEARLY</option>
                      <option value="First Term">1st TERM</option>
                      <option value="Second Term">2nd TERM</option>
                    </select>

                    <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={guidedFeeTypeId} onChange={e => handleGuidedFeeTypeChange(e.target.value)}>
                      <option value="">SELECT FEE TYPE *</option>
                      {availableFeeTypeOptions.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                    </select>
                  </div>
                  
                  <input className="w-full rounded border p-3 text-sm font-bold" placeholder="MOBILE NO" value={form.mobile} onChange={set("mobile")} />
                  
                  {/* Receipt Number editing - Always visible for manual override */}
                  <div className="grid grid-cols-2 gap-3">
                      <input className="w-full rounded border p-3 text-sm font-bold" placeholder="Receipt No (Auto-generated if empty)" value={form.receipt_no || ""} onChange={set("receipt_no")} />
                      <input className="w-full rounded border p-3 text-sm font-bold" placeholder="Receipt Year" value={form.receipt_year || ""} onChange={set("receipt_year")} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <select className="rounded border bg-white p-3 text-sm font-bold" value={form.gender} onChange={set("gender")}>
                      <option value="">GENDER</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                    <div>
                      <input className="w-full rounded border p-3 text-sm font-bold" type="date" value={form.dob} onChange={setRaw("dob")} />
                      {form.dob && <p className="mt-1 text-right text-xs font-black text-blue-600">{calculateAge(form.dob)}</p>}
                    </div>
                  </div>
                  <select className="w-full rounded border bg-white p-3 text-sm font-bold" value={form.category} onChange={setRaw("category")}>
                    <option value="">CATEGORY</option>
                    <option value="General">GENERAL</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Other">OTHER</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={guidedClass} onChange={e => handleGuidedClassChange(e.target.value)} disabled={!!editing}>
                    <option value="">STEP 1: SELECT CLASS *</option>
                    {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                  </select>

                  {guidedClass && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={form.term} onChange={e => handleGuidedTermChange(e.target.value)}>
                        <option value="Yearly">YEARLY</option>
                        <option value="First Term">1st TERM</option>
                        <option value="Second Term">2nd TERM</option>
                      </select>

                      <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={guidedFeeTypeId} onChange={e => handleGuidedFeeTypeChange(e.target.value)} disabled={!!editing}>
                        <option value="">STEP 2: SELECT FEE TYPE *</option>
                        {availableFeeTypeOptions.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                      </select>

                      <select className="w-full rounded border p-3 text-sm font-bold bg-blue-50 border-blue-200" value={form.student_id || ""} onChange={e => handleStudentSelect(e.target.value)}>
                        <option value="">STEP 3: SELECT STUDENT *</option>
                        {filteredStudentsForGuided.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              {editing && (
                <div className="rounded border bg-slate-100 p-3 mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Editing Record for:</p>
                  <p className="text-sm font-black">{studentMap[form.student_id]?.full_name} (Class {studentMap[form.student_id]?.class_name})</p>
                </div>
              )}

              {(form.student_id || (admissionType === "new" && form.class_name)) && (
                <>
                  <select className="w-full rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={e => setForm({ ...form, fee_category: e.target.value, selectedFeeTypeIds: [], trust_id: "", particulars: [], amount: "" })}>
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

                  {form.fee_category !== "Advance" && !guidedFeeTypeId && (
                    <div className="rounded border bg-slate-50 p-3">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">Select Fee Types</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableFeeTypeOptions.map((opt: any) => {
                          const amt = getFeeTypeAmount(String(opt.id))
                          return (
                            <label key={opt.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-100 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                checked={form.selectedFeeTypeIds.includes(String(opt.id))}
                                onChange={() => handleFeeTypeToggle(String(opt.id))}
                              />
                              <span className="flex-1 text-sm font-medium text-slate-700">{opt.name}</span>
                              {amt > 0 && <span className="text-xs font-semibold text-blue-600">₹{amt.toFixed(2)}</span>}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {form.fee_category === "Trust" && (
                    <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={e => setForm({ ...form, trust_id: e.target.value, selectedFeeTypeIds: [], particulars: [] })}>
                      <option value="">Select Trust *</option>
                      {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
                    </select>
                  )}

                  {form.fee_category !== "Advance" && (
                    <div className="rounded border bg-slate-50 p-3">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">Fee Particulars (Dynamic Heads)</h4>
                      {form.particulars.length === 0 ? (
                        <div>
                          <p className="mb-2 text-xs text-slate-500">No fee particulars defined for this class / selected types.</p>
                          <input className="w-full rounded border p-3 text-sm" type="number" step="0.01" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {form.particulars.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="flex-1 text-sm font-medium text-slate-600">{p.particular_name}</span>
                              <span className="text-xs text-slate-400">({p.duration_months === 6 ? "Term Fee" : "Yearly Fee"}{p.term && p.term !== "Yearly" ? ` - ${p.term}` : ""})</span>
                              <input className="w-32 rounded border p-2 text-sm text-right font-bold" type="number" step="0.01" placeholder="Amount" value={p.amount} onChange={setParticularAmount(i)} />
                            </div>
                          ))}
                          <div className="flex items-center gap-2 border-t pt-2">
                            <span className="flex-1 text-base font-bold text-slate-900">Final Fees to Collect</span>
                            <span className="w-32 text-right text-base font-bold text-blue-700">₹{totalAmount.toFixed(2)}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500 italic">* Collected as a single installment.</p>
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
                </>
              )}
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : (admissionType === "new" ? "Admit & Collect Fee" : "Save")}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setReportModal(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase tracking-tight text-slate-800">Generate Fees Report</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setReportModal(false)}>✕</button>
            </div>
            
            <div className="space-y-4">
              {!schoolId && (
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">School</label>
                  <select className="w-full rounded border p-2 text-sm font-bold bg-slate-50" value={reportSchoolId} onChange={e => setReportSchoolId(e.target.value)}>
                    <option value="">ALL SCHOOLS</option>
                    {allSchools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">From Date</label>
                  <input type="date" className="w-full rounded border p-2 text-sm font-bold bg-slate-50" value={reportFromDate} onChange={e => setReportFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">To Date</label>
                  <input type="date" className="w-full rounded border p-2 text-sm font-bold bg-slate-50" value={reportToDate} onChange={e => setReportToDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">Class</label>
                  <select className="w-full rounded border p-2 text-sm font-bold bg-slate-50" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv("") }} disabled={!!teacherClass}>
                    <option value="">ALL CLASSES</option>
                    {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">Academic Year</label>
                  <select className="w-full rounded border p-2 text-sm font-bold bg-slate-50" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
                    <option value="">ALL YEARS</option>
                    {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black text-slate-600 uppercase tracking-widest">Fee Types (Optional)</label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded border p-2 bg-slate-50">
                  {feeTypes.map((t: any) => (
                    <label key={t.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={reportFeeTypeIds.includes(String(t.id))} onChange={() => setReportFeeTypeIds(prev => prev.includes(String(t.id)) ? prev.filter(i => i !== String(t.id)) : [...prev, String(t.id)])} />
                      <span className="text-[11px] font-bold text-slate-700">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded bg-green-600 px-5 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100" onClick={() => {
                const params = new URLSearchParams()
                if (filterClass) params.set("class_name", filterClass)
                if (filterDiv) params.set("division", filterDiv)
                if (filterAy) params.set("academic_year_id", filterAy)
                if (reportSchoolId || schoolId) params.set("school_id", String(reportSchoolId || schoolId))
                if (reportFromDate) params.set("from_date", reportFromDate)
                if (reportToDate) params.set("to_date", reportToDate)
                if (reportFeeTypeIds.length > 0) params.set("fee_type_ids", reportFeeTypeIds.join(","))
                window.open(`/api/fees/export?${params.toString()}`, "_blank")
              }}>GENERATE EXCEL REPORT</button>
              <button className="rounded bg-slate-100 px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200" onClick={() => setReportModal(false)}>CANCEL</button>
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
                        <td className="px-3 py-2">{formatDate(inst.due_date)}</td>
                        <td className="px-3 py-2">{Number(inst.amount).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${inst.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{inst.status}</span>
                        </td>
                        <td className="px-3 py-2">{formatDate(inst.paid_date)}</td>
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
