"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { getAllFees, addFee, updateFee, deleteFee } from "./actions"
import { getInstallmentsByFeeId, updateInstallmentStatus } from "./installment-actions"
import { addStudent, updateStudent } from "@/app/students/actions"
import { createClient } from "@/lib/supabase/client"
import { formatDate, safeJsonResponse } from "@/lib/utils"

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
  const [filterSchool, setFilterSchool] = useState(schoolId ? String(schoolId) : "")
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
  const [activeTab, setActiveTab] = useState<"fees" | "report" | "unpaid">("fees")
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")
  const [reportSchoolId, setReportSchoolId] = useState("")
  const [reportType, setReportType] = useState<"all" | "unpaid" | "paid">("unpaid")
  const [reportFeeCategory, setReportFeeCategory] = useState<"all" | "School" | "Trust">("all")
  const [reportTrustId, setReportTrustId] = useState("")
  const [reportClass, setReportClass] = useState("")
  const [reportDiv, setReportDiv] = useState("")
  const [reportAy, setReportAy] = useState("")
  const [reportFeeTypeId, setReportFeeTypeId] = useState("")
  const [reportFromDate, setReportFromDate] = useState("")
  const [reportToDate, setReportToDate] = useState("")
  const [reportGroupBy, setReportGroupBy] = useState<"none" | "class" | "school" | "trust" | "year" | "fee_type">("none")
  const [guidedClass, setGuidedClass] = useState("")
  const [guidedFeeTypeId, setGuidedFeeTypeId] = useState("")
  const [guidedSearchRoll, setGuidedSearchRoll] = useState("")
  const [guidedSearchGr, setGuidedSearchGr] = useState("")
  const [guidedSearchName, setGuidedSearchName] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [unpaidSearch, setUnpaidSearch] = useState("")
  const [unpaidClass, setUnpaidClass] = useState(teacherClass)
  const [unpaidDiv, setUnpaidDiv] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setGuidedSearchRoll("")
    setGuidedSearchGr("")
    setGuidedSearchName("")
  }, [guidedClass])

  const studentMap: any = {}
  students.forEach((s: any) => { studentMap[s.id] = s })

  const feeTypeMap: any = {}
  feeTypes.forEach((t: any) => { feeTypeMap[t.id] = t.name })

  const schoolMap: any = {}
  allSchools.forEach((s: any) => { schoolMap[s.id] = s.school_name })

  const trustMap: any = {}
  trusts.forEach((t: any) => { trustMap[t.id] = t.trust_name })

  const paidStudentIds = useMemo(
    () => new Set(fees.filter((f: any) => (f.status || "").toLowerCase() === "paid").map((f: any) => f.student_id)),
    [fees]
  )

  const studentUnpaidFees = useMemo(() => {
    const map: Record<string, any[]> = {}
    fees.forEach((f: any) => {
      const status = (f.status || "").toLowerCase()
      if (status !== "paid") {
        const studentId = String(f.student_id)
        if (!map[studentId]) map[studentId] = []
        map[studentId].push(f)
      }
    })
    return map
  }, [fees])

  const unpaidStudents = useMemo(() => {
    const qq = unpaidSearch.toLowerCase()
    return students.filter((s: any) => {
      const unpaid = studentUnpaidFees[String(s.id)]
      const hasUnpaid = unpaid && unpaid.length > 0
      if (paidStudentIds.has(s.id) && !hasUnpaid) return false
      if (filterSchool) {
        if (!s.school_id || String(s.school_id) !== filterSchool) return false
      }
      if (unpaidClass && s.class_name !== unpaidClass) return false
      if (unpaidDiv && s.division !== unpaidDiv) return false
      if (qq && !String(s.full_name || "").toLowerCase().includes(qq) && !String(s.gr_no || "").toLowerCase().includes(qq) && !String(s.roll_no || "").toLowerCase().includes(qq) && !String(s.father_name || "").toLowerCase().includes(qq)) return false
      return true
    })
  }, [students, studentUnpaidFees, paidStudentIds, filterSchool, unpaidSearch, unpaidClass, unpaidDiv])

  const downloadUnpaidFeesCsv = () => {
    const header = ["GR No", "Roll No", "Student Name", "Class", "Division", "Father Name", "Mobile", "Unpaid Count", "Unpaid Amount"]
    const rows = unpaidStudents.map((s: any) => {
      const unpaid = studentUnpaidFees[String(s.id)] || []
      const totalUnpaid = unpaid.reduce((sum, f) => sum + Number(f.amount), 0)
      return [s.gr_no || "", s.roll_no || "", s.full_name || "", s.class_name || "", s.division || "", s.father_name || "", s.mobile || "", unpaid.length, totalUnpaid.toFixed(2)]
    })
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "unpaid_fees_students.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const availableFeeTypeOptions = useMemo(() => {
    let base = feeTypes.filter((t: any) => {
      if (form.fee_category === "Trust") return String(t.trust_id || "") === String(form.trust_id || "")
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
    return students.filter((s: any) => {
      if (filterSchool && String(s.school_id) !== filterSchool) return false
      const matchesBase = s.class_name === guidedClass || String(s.id) === String(form.student_id)
      if (!matchesBase) return false

      if (String(s.id) === String(form.student_id)) return true

      if (guidedSearchRoll && !String(s.roll_no || "").toLowerCase().includes(guidedSearchRoll.toLowerCase())) {
        return false
      }
      if (guidedSearchGr && !String(s.gr_no || "").toLowerCase().includes(guidedSearchGr.toLowerCase())) {
        return false
      }
      if (guidedSearchName && !String(s.full_name || "").toLowerCase().includes(guidedSearchName.toLowerCase())) {
        return false
      }

      return true
    })
  }, [students, guidedClass, form.student_id, guidedSearchRoll, guidedSearchGr, guidedSearchName, filterSchool])

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
    if (filterSchool) {
      if (!s.school_id || String(s.school_id) !== filterSchool) return false
    }
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    if (filterAy && String(s.academic_year_id) !== filterAy) return false
    return true
  })

  const filteredStudentIds = new Set(filteredStudents.map((s: any) => s.id))
  const q = search.toLowerCase()
  const filtered = fees.filter((f: any) => {
    if (filterSchool && f.school_id && String(f.school_id) !== filterSchool) return false
    if (!filteredStudentIds.has(f.student_id)) return false
    if (filterFeeType && String(f.fee_type_id) !== filterFeeType) return false
    const payDate = (f.payment_date || "").split("T")[0].split(" ")[0]
    if (filterFromDate && (!payDate || payDate < filterFromDate)) return false
    if (filterToDate && (!payDate || payDate > filterToDate)) return false
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
    if (p.class_name) {
      const pClasses = (p.class_name || "").split(",").map((c: string) => c.trim().toUpperCase())
      const isGlobal = pClasses.includes("ALL")
      if (!isGlobal && !pClasses.includes(className.toUpperCase())) return false
    }
    
    if (feeTypeIds && feeTypeIds.length > 0) {
      if (p.fee_type_id && !feeTypeIds.includes(String(p.fee_type_id))) return false
    }
    
    const pTerm = p.term || "Yearly"
    const targetTerm = term || "Yearly"
    if (targetTerm !== "Yearly" && pTerm !== targetTerm) return false
    
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
      category: s.category || "",
      school_id: s.school_id ? String(s.school_id) : prev.school_id
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
        const pTerm = p.term || "Yearly"
        const targetTerm = form.term || "Yearly"
        return pClasses.includes(className) && String(p.fee_type_id) === feeTypeId && pTerm === targetTerm
      })
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  }

  const handleStudentSelect = (studentId: string) => {
    if (String(studentId) === String(form.student_id)) return
    reloadParticulars(studentId, form.selectedFeeTypeIds)
    const unpaid = studentUnpaidFees[String(studentId)]
    if (unpaid && unpaid.length > 0) {
      const totalUnpaid = unpaid.reduce((sum, f) => sum + Number(f.amount), 0)
      setMessage(`⚠️ This student has ${unpaid.length} unpaid fee record(s) totaling ₹${totalUnpaid.toFixed(2)}. Please collect old dues.`)
    } else {
      setMessage("")
    }
  }

  const studentSearchResults = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    if (!query) return []
    return students
      .filter((s: any) => {
        if (filterSchool && String(s.school_id) !== filterSchool) return false
        return (
          String(s.full_name || "").toLowerCase().includes(query) ||
          String(s.gr_no || "").toLowerCase().includes(query) ||
          String(s.roll_no || "").toLowerCase().includes(query) ||
          String(s.father_name || "").toLowerCase().includes(query)
        )
      })
      .slice(0, 30)
  }, [students, studentSearch, filterSchool])

  const handleStudentSearchSelect = (s: any) => {
    setStudentSearch("")
    setGuidedClass(s.class_name || "")
    setGuidedFeeTypeId("")
    reloadParticulars(String(s.id), [])
    const unpaid = studentUnpaidFees[String(s.id)]
    if (unpaid && unpaid.length > 0) {
      const totalUnpaid = unpaid.reduce((sum, f) => sum + Number(f.amount), 0)
      setMessage(`⚠️ This student has ${unpaid.length} unpaid fee record(s) totaling ₹${totalUnpaid.toFixed(2)}. Please collect old dues.`)
    } else {
      setMessage("")
    }
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

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type && !file.type.toLowerCase().includes("pdf")) {
      setMessage("Please upload a PDF file for the receipt attachment.")
      return
    }
    setUploadingReceipt(true)
    try {
      const path = `fees/receipts/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm(prev => ({ ...prev, receipt_file_url: publicUrl }))
      setReceiptFile(file)
      setMessage("Receipt PDF attached successfully.")
    } catch (err: any) {
      setMessage(err.message || "PDF upload failed")
    } finally {
      setUploadingReceipt(false)
      e.target.value = ""
    }
  }

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
    if (form.fee_category !== "Advance") {
       const hasParticulars = form.particulars.length > 0
       const hasSelectedTypes = form.selectedFeeTypeIds.length > 0
       const hasManualAmount = !!form.amount && Number(form.amount) > 0
       
       if (!hasParticulars && !hasSelectedTypes && !hasManualAmount) {
         setMessage("Select at least one fee type or enter an amount")
         return
       }
    }
    if (form.fee_category === "Trust" && !form.trust_id) { setMessage("Select a trust"); return }
    if (form.fee_category === "Advance" && !form.amount) { setMessage("Enter advance amount"); return }

    if (!schoolId && !form.school_id) {
      setMessage("Please select a school from the dropdown before saving, or the record will be invisible to clerks.")
      return
    }

    const primaryFeeTypeId = form.selectedFeeTypeIds.find(id => id !== "bhojan" && id !== "record") || null
    let payload: any = {
      ...form,
      student_id: studentId,
      fee_type_id: primaryFeeTypeId || "",
      fee_category: form.fee_category === "Advance" ? "School" : form.fee_category,
      particulars: form.fee_category === "Advance" ? [{ particular_name: "Advance Fee", amount: String(form.amount), duration_months: 1 }] : (() => {
        const filtered = form.particulars.filter((p: any) => Number(p.amount) > 0)
        if (filtered.length > 0) return filtered
        const activeTypeIds = form.selectedFeeTypeIds.filter(id => id !== "bhojan" && id !== "record")
        if (activeTypeIds.length > 0) {
          const names = activeTypeIds.map(id => feeTypeMap[id]).filter(Boolean)
          return [{ particular_name: names.length > 0 ? names.join(", ") : `Fee Type ${activeTypeIds[0]}`, amount: String(form.amount || "0"), duration_months: 1, term: form.term || "Yearly" }]
        }
        return filtered
      })(),
      duration_months: 1
    }

    if (form.receipt_file_url) {
      payload.receipt_file_url = form.receipt_file_url
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
      const { data, error } = await safeJsonResponse(res)
      if (error || !data) setMessage(error || "Import failed")
      else {
        setMessage(`Imported ${data.imported || 0} records. ${data.errors?.length || 0} errors.`)
        refresh()
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const viewReceipt = (id: number) => window.open(`/api/fees/receipt/${id}`, "_blank")

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button className={`rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${activeTab === "fees" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`} onClick={() => setActiveTab("fees")}>Fees</button>
          <button className={`rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${activeTab === "unpaid" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`} onClick={() => setActiveTab("unpaid")}>Unpaid Fees</button>
          <button className={`rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${activeTab === "report" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`} onClick={() => setActiveTab("report")}>Reports</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => downloadBlob("/api/excel/template/fees", "fees_template.xlsx")}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={() => { setEditing(null); setForm({ ...emptyForm, school_id: filterSchool }); setInstallments([]); setMessage(""); setAdmissionType("old"); setGuidedClass(""); setGuidedFeeTypeId(""); setActiveTab("fees"); setModal(true) }}>Add New</button>
        </div>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      {activeTab === "fees" && (<>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        {!schoolId && allSchools.length > 0 && (
          <select className="rounded border p-2 text-sm" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
            <option value="">All Schools</option>
            {allSchools.map((s: any) => <option key={s.id} value={String(s.id)}>{s.school_name}</option>)}
          </select>
        )}
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
        <input type="date" className="rounded border p-2 text-sm" title="Payment From Date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
        <input type="date" className="rounded border p-2 text-sm" title="Payment To Date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
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
                const unpaid = studentUnpaidFees[String(f.student_id)]
                const hasUnpaid = unpaid && unpaid.length > 0
                return (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 flex items-center gap-2">
                      {s?.full_name || f.student_id}
                      {hasUnpaid && (
                        <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-medium cursor-help" title={`${unpaid.length} unpaid fee(s) totaling ₹${unpaid.reduce((sum: number, uf: any) => sum + Number(uf.amount), 0).toFixed(2)}`}>
                          ⚠ {unpaid.length}
                        </span>
                      )}
                    </td>
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
                        const unpaid = studentUnpaidFees[String(f.student_id)]
                        if (unpaid && unpaid.length > 0) {
                          const totalUnpaid = unpaid.reduce((sum, uf) => sum + Number(uf.amount), 0)
                          setMessage(`⚠️ This student has ${unpaid.length} unpaid fee record(s) totaling ₹${totalUnpaid.toFixed(2)}. Please collect old dues.`)
                        } else {
                          setMessage("")
                        }
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
      </>)}
      {activeTab === "unpaid" && (
        <div className="rounded border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-red-700">Students with Unpaid Fees</h3>
              <p className="text-sm text-slate-500">Students having pending/unpaid fee records ({unpaidStudents.length}).</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700" onClick={downloadUnpaidFeesCsv}>Download CSV</button>
              <button className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200" onClick={() => setActiveTab("fees")}>Back to Fees</button>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <input className="rounded border p-2 text-sm" placeholder="Search name / GR / roll..." value={unpaidSearch} onChange={e => setUnpaidSearch(e.target.value)} />
            {!schoolId && allSchools.length > 0 && (
              <select className="rounded border p-2 text-sm" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
                <option value="">All Schools</option>
                {allSchools.map((s: any) => <option key={s.id} value={String(s.id)}>{s.school_name}</option>)}
              </select>
            )}
            <select className="rounded border p-2 text-sm" value={unpaidClass} onChange={e => { setUnpaidClass(e.target.value); setUnpaidDiv("") }} disabled={!!teacherClass}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select className="rounded border p-2 text-sm" value={unpaidDiv} onChange={e => setUnpaidDiv(e.target.value)}>
              <option value="">All Divisions</option>
              {divisions.filter((d: any) => d.class_name === unpaidClass || !unpaidClass).map((d: any) => (
                <option key={d.id} value={d.division_name}>{d.division_name}</option>
              ))}
            </select>
          </div>
          {unpaidStudents.length === 0 ? <p>No unpaid students found.</p> : (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">GR No</th>
                    <th className="px-3 py-2">Roll No</th>
                    <th className="px-3 py-2">Student Name</th>
                    <th className="px-3 py-2">Class/Div</th>
                    <th className="px-3 py-2">Father Name</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {unpaidStudents.map((s: any, i: number) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 text-xs font-bold text-blue-600">{s.gr_no || "-"}</td>
                      <td className="px-3 py-2">{s.roll_no || "-"}</td>
                      <td className="px-3 py-2 font-semibold">{s.full_name || "-"}</td>
                      <td className="px-3 py-2">{s.class_name}{s.division ? ` / ${s.division}` : ""}</td>
                      <td className="px-3 py-2">{s.father_name || "-"}</td>
                      <td className="px-3 py-2">{s.mobile || "-"}</td>
                      <td className="px-3 py-2"><span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">NOT PAID</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === "report" && (
        <div className="rounded border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Unpaid Fees Report</h3>
              <p className="text-sm text-slate-500">Generate class-wise, school-wise, trust-wise, year-wise, or fee type-wise Excel reports with summary totals.</p>
            </div>
            <button className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setActiveTab("fees")}>Back to Fees</button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {!schoolId && (
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">School</label>
                <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportSchoolId} onChange={e => setReportSchoolId(e.target.value)}>
                  <option value="">ALL SCHOOLS</option>
                  {allSchools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Category</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportFeeCategory} onChange={e => setReportFeeCategory(e.target.value as "all" | "School" | "Trust")}>
                <option value="all">ALL FEES</option>
                <option value="School">School Fees</option>
                <option value="Trust">Trust Fees</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Trust</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportTrustId} onChange={e => setReportTrustId(e.target.value)}>
                <option value="">ALL TRUSTS</option>
                {trusts.map((t: any) => <option key={t.id} value={String(t.id)}>{t.trust_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Report Type</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportType} onChange={e => setReportType(e.target.value as "all" | "unpaid" | "paid")}>
                <option value="unpaid">Unpaid Fees Only</option>
                <option value="paid">Paid Fees Only</option>
                <option value="all">All Fees</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Academic Year</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportAy} onChange={e => setReportAy(e.target.value)}>
                <option value="">ALL YEARS</option>
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Class</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportClass} onChange={e => { setReportClass(e.target.value); setReportDiv("") }} disabled={!!teacherClass}>
                <option value="">ALL CLASSES</option>
                {classes.map(c => <option key={c} value={c}>CLASS {c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Division</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportDiv} onChange={e => setReportDiv(e.target.value)}>
                <option value="">ALL DIVISIONS</option>
                {divisions.filter((d: any) => d.class_name === reportClass || !reportClass).map((d: any) => (
                  <option key={d.id} value={d.division_name}>{d.division_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Fee Type</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportFeeTypeId} onChange={e => setReportFeeTypeId(e.target.value)}>
                <option value="">ALL FEE TYPES</option>
                {feeTypes.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid gap-3 lg:col-span-2 xl:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">From Date</label>
                <input type="date" className="w-full rounded border p-2 text-sm bg-slate-50" value={reportFromDate} onChange={e => setReportFromDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">To Date</label>
                <input type="date" className="w-full rounded border p-2 text-sm bg-slate-50" value={reportToDate} onChange={e => setReportToDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-600">Group Summary By</label>
              <select className="w-full rounded border p-2 text-sm bg-slate-50" value={reportGroupBy} onChange={e => setReportGroupBy(e.target.value as any)}>
                <option value="none">NO GROUPING</option>
                <option value="class">CLASS-WISE</option>
                <option value="school">SCHOOL-WISE</option>
                <option value="trust">TRUST-WISE</option>
                <option value="year">YEAR-WISE</option>
                <option value="fee_type">FEE TYPE-WISE</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="flex-1 rounded bg-green-600 px-5 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-green-700" onClick={() => {
              const params = new URLSearchParams()
              const exportSchool = reportSchoolId || filterSchool || (schoolId ? String(schoolId) : "")
              if (reportClass) params.set("class_name", reportClass)
              if (reportDiv) params.set("division", reportDiv)
              if (reportAy) params.set("academic_year_id", reportAy)
              if (exportSchool) params.set("school_id", String(exportSchool))
              if (reportFromDate) params.set("from_date", reportFromDate)
              if (reportToDate) params.set("to_date", reportToDate)
              if (reportType === "unpaid") params.set("status", "unpaid")
              if (reportType === "paid") params.set("status", "Paid")
              if (reportFeeCategory !== "all") params.set("fee_category", reportFeeCategory)
              if (reportTrustId) params.set("trust_id", reportTrustId)
              if (reportFeeTypeId) params.set("fee_type_ids", reportFeeTypeId)
              if (reportGroupBy !== "none") params.set("group_by", reportGroupBy)
              window.open(`/api/fees/export?${params.toString()}`, "_blank")
            }}>DOWNLOAD EXCEL REPORT</button>
            <button className="rounded bg-slate-100 px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200" onClick={() => {
              setReportSchoolId("")
              setReportType("unpaid")
              setReportFeeCategory("all")
              setReportTrustId("")
              setReportClass("")
              setReportDiv("")
              setReportAy("")
              setReportFeeTypeId("")
              setReportFromDate("")
              setReportToDate("")
              setReportGroupBy("none")
            }}>RESET FILTERS</button>
          </div>
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
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""}){s.roll_no ? ` | Roll: ${s.roll_no}` : ""}{s.gr_no ? ` | GR: ${s.gr_no}` : ""}
                        </option>
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
                  
                  {/* Receipt Number - only for School and Trust */}
                  {(form.fee_category === "School" || form.fee_category === "Trust") && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        className="w-full rounded border p-3 text-sm font-bold"
                        placeholder="Receipt No (Auto-generated if empty)"
                        value={form.receipt_no || ""}
                        onChange={set("receipt_no")}
                        disabled={!!(editing && form.receipt_no)}
                        readOnly={!!(editing && form.receipt_no)}
                      />
                      <input
                        className="w-full rounded border p-3 text-sm font-bold"
                        placeholder="Receipt Year"
                        value={form.receipt_year || ""}
                        onChange={set("receipt_year")}
                        disabled={!!(editing && form.receipt_no)}
                        readOnly={!!(editing && form.receipt_no)}
                      />
                    </div>
                  )}

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
                  <div className="rounded border bg-blue-50/50 p-3">
                    <h4 className="mb-2 text-xs font-black text-blue-700 uppercase tracking-widest">Search Student</h4>
                    <input
                      type="text"
                      placeholder="Search by Name / GR No / Roll No..."
                      className="w-full rounded border p-3 text-sm font-bold"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                    {studentSearch && studentSearchResults.length === 0 && (
                      <p className="mt-1 text-xs text-slate-500">No students found.</p>
                    )}
                    {studentSearchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded border bg-white">
                        {studentSearchResults.map((s: any) => (
                          <button key={s.id} type="button" className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm hover:bg-blue-50" onClick={() => handleStudentSearchSelect(s)}>
                            <span className="font-semibold text-slate-800">{s.full_name}</span>
                            <span className="text-xs text-slate-500">{s.class_name}{s.division ? ` - ${s.division}` : ""} | GR: {s.gr_no || "-"} | Roll: {s.roll_no || "-"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

                      <select className="w-full rounded border p-3 text-sm font-bold bg-slate-50" value={guidedFeeTypeId} onChange={e => handleGuidedFeeTypeChange(e.target.value)}>
                        <option value="">STEP 2: SELECT FEE TYPE *</option>
                        {availableFeeTypeOptions.map((t: any) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                      </select>

                      <div className="space-y-2">
                        <select className="w-full rounded border p-3 text-sm font-bold bg-blue-50 border-blue-200" value={form.student_id || ""} onChange={e => handleStudentSelect(e.target.value)}>
                          <option value="">STEP 3: SELECT STUDENT *</option>
                          {filteredStudentsForGuided.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ""}){s.roll_no ? ` | Roll: ${s.roll_no}` : ""}{s.gr_no ? ` | GR: ${s.gr_no}` : ""}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Search Roll No"
                            className="w-full rounded border p-2 text-xs font-semibold text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={guidedSearchRoll}
                            onChange={e => setGuidedSearchRoll(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Search GR No"
                            className="w-full rounded border p-2 text-xs font-semibold text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={guidedSearchGr}
                            onChange={e => setGuidedSearchGr(e.target.value)}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Search Student Name"
                          className="w-full rounded border p-2 text-xs font-semibold text-slate-700 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={guidedSearchName}
                          onChange={e => setGuidedSearchName(e.target.value)}
                        />
                      </div>
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
                  <select className="w-full rounded border p-3 text-sm" value={form.fee_category || "School"} onChange={e => { setForm({ ...form, fee_category: e.target.value, selectedFeeTypeIds: [], trust_id: "", particulars: [], amount: "" }); setGuidedFeeTypeId("") }}>
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
                    <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={e => { setForm({ ...form, trust_id: e.target.value, selectedFeeTypeIds: [], particulars: [] }); setGuidedFeeTypeId("") }}>
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
                  <div className="rounded border bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-600">Receipt PDF Attachment</label>
                    <input type="file" accept=".pdf" onChange={handleReceiptFileChange} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
                    {uploadingReceipt && <p className="mt-2 text-xs text-blue-600">Uploading PDF...</p>}
                    {form.receipt_file_url && <a href={form.receipt_file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline">View attached PDF</a>}
                  </div>
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
