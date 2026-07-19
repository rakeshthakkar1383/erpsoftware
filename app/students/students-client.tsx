"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getAllStudents, getStudentsGrouped, addStudent, updateStudent, deleteStudent, findDuplicateNames, removeDuplicateStudents } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const emptyForm: Record<string, string> = {
  full_name: "", gender: "", father_name: "", mother_name: "",
  dob: "", birthplace: "", address: "", village: "", district: "", pincode: "",
  last_school: "", roll_no: "", division: "", class_name: "", stream: "",
  photo_url: "", birth_cert_url: "", aadhar_no: "", aadhar_url: "", father_aadhar_url: "",
  father_mobile: "", mother_mobile: "", category: "", ration_card_url: "", category_cert_url: "",
  gr_no: "", admission_no: "", school_id: "", mobile: ""
}

type ViewMode = "list" | "school" | "class"

type StudentsClientProps = {
  students: any[]
  groupedStudents?: Record<string, any[]>
  totalStudents: number
  totalPages: number
  currentPage: number
  pageSize: number
  viewMode: ViewMode
  groupBy?: string
  filters: Record<string, any>
  divisions: any[]
  streams: any[]
  allSchools: any[]
  teacherClass: string
  schoolId: number | null
  schoolName?: string
  schoolLogo?: string
}

export default function StudentsClient({
  students: initStudents, groupedStudents: initGrouped, totalStudents: initTotal,
  totalPages: initPages, currentPage: initPage, pageSize: initPageSize,
  viewMode: initViewMode, filters: initFilters, divisions, streams,
  allSchools, teacherClass, schoolId, schoolName, schoolLogo
}: StudentsClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initViewMode)
  const [students, setStudents] = useState(initStudents)
  const [groupedStudents, setGroupedStudents] = useState<Record<string, any[]>>(initGrouped || {})
  const [totalPages, setTotalPages] = useState(initPages)
  const [totalStudents, setTotalStudents] = useState(initTotal)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [pageSize, setPageSize] = useState(initPageSize)
  const [search, setSearch] = useState(initFilters.search || "")
  const [filterSchool, setFilterSchool] = useState(initFilters.school_id ? String(initFilters.school_id) : (schoolId ? String(schoolId) : ""))
  const [filterClass, setFilterClass] = useState(initFilters.class_name || teacherClass || "")
  const [filterDiv, setFilterDiv] = useState(initFilters.division || "")
  const [filterStream, setFilterStream] = useState(initFilters.stream || "")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [duplicates, setDuplicates] = useState<{ name: string; class_name: string; dob: string; students: any[] }[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [selectedToRemove, setSelectedToRemove] = useState<Record<number, number[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const getFilters = useCallback(() => {
    const f: Record<string, any> = {}
    if (filterSchool) f.school_id = Number(filterSchool)
    if (filterClass) f.class_name = filterClass
    if (filterDiv) f.division = filterDiv
    if (filterStream) f.stream = filterStream
    if (search) f.search = search
    return f
  }, [filterSchool, filterClass, filterDiv, filterStream, search])

  const loadList = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const result = await getAllStudents(page, pageSize, getFilters())
      setStudents(result.data)
      setTotalPages(result.totalPages)
      setTotalStudents(result.total)
      setCurrentPage(page)
    } catch (err: any) {
      setMessage(err.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [pageSize, getFilters])

  const loadGrouped = useCallback(async (groupBy: "school_id" | "class_name") => {
    setLoading(true)
    try {
      const result = await getStudentsGrouped(groupBy, getFilters())
      setGroupedStudents(result)
      const total = Object.values(result).reduce((sum, arr) => sum + arr.length, 0)
      setTotalStudents(total)
    } catch (err: any) {
      setMessage(err.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [getFilters])

  const switchView = useCallback(async (vm: ViewMode) => {
    setViewMode(vm)
    if (vm === "list") {
      await loadList(1)
    } else {
      await loadGrouped(vm === "school" ? "school_id" : "class_name")
    }
  }, [loadList, loadGrouped])

  const applyFilters = useCallback(async () => {
    if (viewMode === "list") {
      await loadList(1)
    } else {
      await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
    }
  }, [viewMode, loadList, loadGrouped])

  const goToPage = useCallback(async (p: number) => {
    await loadList(p)
  }, [loadList])

  const changePageSize = useCallback(async (newSize: number) => {
    setPageSize(newSize)
    setLoading(true)
    try {
      const f = getFilters()
      const result = await getAllStudents(1, newSize, f)
      setStudents(result.data)
      setTotalPages(result.totalPages)
      setTotalStudents(result.total)
      setCurrentPage(1)
    } catch (err: any) {
      setMessage(err.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [getFilters])

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age >= 0 ? `${age} years` : ""
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    const noUpper = ["class_name", "dob", "school_id"]
    setForm({ ...form, [field]: noUpper.includes(field) ? val : val.toUpperCase() })
  }

  const toFormData = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    return fd
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(field)
    const path = `students/${field}/${Date.now()}_${file.name}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm(prev => ({ ...prev, [field]: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(null) }
  }

  const handleSave = async () => {
    if (!form.full_name || !form.class_name) { setMessage("Name and Class are required"); return }
    try {
      const res = editing
        ? await updateStudent(editing.id, toFormData(form))
        : await addStudent(toFormData(form))
      if (!res.success) { setMessage(res.message); return }
      setModal(false)
      if (viewMode === "list") await loadList(currentPage)
      else await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
    } catch (err: any) {
      setMessage(err.message || "Save failed")
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this student?")) return
    const res = await deleteStudent(id)
    if (!res.success) { setMessage(res.message); return }
    if (viewMode === "list") await loadList(currentPage)
    else await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    if (schoolId) fd.append("school_id", String(schoolId))
    try {
      const res = await fetch("/api/excel/import/students", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) setMessage(data.error)
      else {
        setMessage(`Imported ${data.imported} students. ${data.errors?.length || 0} errors.`)
        if (viewMode === "list") await loadList(currentPage)
        else await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
      }
    } catch (err: any) { setMessage(err.message || "Import failed") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFindDuplicates = async () => {
    setLoading(true)
    setShowDuplicates(true)
    setSelectedToRemove({})
    try {
      const f: Record<string, any> = {}
      if (filterSchool) f.school_id = Number(filterSchool)
      if (filterClass) f.class_name = filterClass
      if (filterDiv) f.division = filterDiv
      const result = await findDuplicateNames(f)
      setDuplicates(result)
      const initial: Record<number, number[]> = {}
      result.forEach((group, gi) => {
        initial[gi] = group.students.slice(1).map(s => s.id)
      })
      setSelectedToRemove(initial)
    } catch (err: any) {
      setMessage(err.message || "Failed to find duplicates")
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentSelection = (groupIndex: number, studentId: number) => {
    setSelectedToRemove(prev => {
      const current = prev[groupIndex] || []
      const next = current.includes(studentId)
        ? current.filter(id => id !== studentId)
        : [...current, studentId]
      return { ...prev, [groupIndex]: next }
    })
  }

  const toggleGroupAll = (groupIndex: number, studentIds: number[]) => {
    setSelectedToRemove(prev => {
      const current = prev[groupIndex] || []
      const allSelected = studentIds.every(id => current.includes(id))
      return { ...prev, [groupIndex]: allSelected ? [] : studentIds }
    })
  }

  const handleRemoveDuplicates = async (groupIndex: number) => {
    const ids = selectedToRemove[groupIndex] || []
    if (!ids.length) return
    if (!window.confirm(`Remove ${ids.length} duplicate student(s)?`)) return
    setLoading(true)
    try {
      const res = await removeDuplicateStudents(ids)
      if (!res.success) { setMessage(res.message); return }
      setMessage(res.message)
      await handleFindDuplicates()
      if (viewMode === "list") await loadList(currentPage)
      else await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
    } catch (err: any) {
      setMessage(err.message || "Remove failed")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAllDuplicates = async () => {
    const allIds: number[] = Object.values(selectedToRemove).flat()
    if (!allIds.length) return
    if (!window.confirm(`Remove ${allIds.length} duplicate students across all groups?`)) return
    setLoading(true)
    try {
      const res = await removeDuplicateStudents(allIds)
      if (!res.success) { setMessage(res.message); return }
      setMessage(res.message)
      await handleFindDuplicates()
      if (viewMode === "list") await loadList(currentPage)
      else await loadGrouped(viewMode === "school" ? "school_id" : "class_name")
    } catch (err: any) {
      setMessage(err.message || "Remove failed")
    } finally {
      setLoading(false)
    }
  }

  const getSchoolName = (sid: number | string) => {
    const school = allSchools.find((s: any) => s.id === Number(sid))
    return school?.school_name || "Unknown School"
  }

  const renderRow = (s: any, index: number, showClass = true) => (
    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs font-bold text-slate-400">{index + 1}</td>
      <td className="px-4 py-3 text-xs font-black text-blue-600">{s.gr_no || "-"}</td>
      <td className="px-4 py-3 text-xs font-bold">{s.roll_no || "-"}</td>
      <td className="px-4 py-3">
        <button className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-left" onClick={() => router.push(`/students/${s.id}`)}>{s.full_name}</button>
      </td>
      <td className="px-4 py-3 font-semibold text-xs">
        {showClass ? `${s.class_name}${s.division ? ` / ${s.division}` : ""}` : (s.division || "-")}
      </td>
      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>{s.gender}</span></td>
      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.dob)}</td>
      <td className="px-4 py-3 text-right">
        <button className="text-[10px] font-black text-blue-600 hover:text-blue-800" onClick={() => { setEditing(s); setForm({ ...s, school_id: String(s.school_id || ""), academic_year_id: s.academic_year_id || "" }); setMessage(""); setModal(true) }}>Edit</button>
        <button className="ml-3 text-[10px] font-black text-red-600 hover:text-red-800" onClick={() => handleDelete(s.id)}>Remove</button>
      </td>
    </tr>
  )

  const TableHead = ({ showClass }: { showClass: boolean }) => (
    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 select-none">
      <tr>
        <th className="px-4 py-3 w-12">#</th>
        <th className="px-4 py-3">GR No</th>
        <th className="px-4 py-3">Roll No</th>
        <th className="px-4 py-3">Student Name</th>
        <th className="px-4 py-3">{showClass ? "Class/Div" : "Division"}</th>
        <th className="px-4 py-3">Gender</th>
        <th className="px-4 py-3">DOB</th>
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          {schoolLogo && <img src={schoolLogo} alt="" className="h-12 w-12 rounded border object-contain bg-white shadow-sm" />}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{schoolName || "STUDENT MANAGEMENT"}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Administrative Data Center</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          <button className="rounded bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all" onClick={() => { const a = document.createElement("a"); a.href = "/api/excel/template/students"; a.download = "students_template.xlsx"; a.click() }}>Template</button>
          <button className="rounded bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="rounded bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-all" onClick={handleFindDuplicates}>Find Duplicates</button>
          <button className="rounded bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 shadow-lg transition-all" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>+ New Student</button>
        </div>
      </div>

      {/* View Tabs + Filters */}
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm space-y-3">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-slate-100 p-0.5">
            {(["list", "school", "class"] as ViewMode[]).map(vm => (
              <button key={vm}
                className={`rounded-md px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${viewMode === vm ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => switchView(vm)}>
                {vm === "list" ? "List" : vm === "school" ? "School" : "Class"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-bold text-slate-400">{totalStudents} students</span>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <input className="w-48 rounded-lg border bg-slate-50 p-2.5 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && applyFilters()} />
          {allSchools.length > 1 && (
            <select className="rounded-lg border bg-slate-50 p-2.5 text-sm font-semibold text-slate-600" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
              <option value="">All Schools</option>
              {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
            </select>
          )}
          <select className="rounded-lg border bg-slate-50 p-2.5 text-sm font-semibold text-slate-600" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv("") }} disabled={!!teacherClass}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="rounded-lg border bg-slate-50 p-2.5 text-sm font-semibold text-slate-600" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
            <option value="">All Divisions</option>
            {divisions.filter((d: any) => d.class_name === filterClass || !filterClass).map((d: any) => (
              <option key={d.id} value={d.division_name}>{d.division_name}</option>
            ))}
          </select>
          <select className="rounded-lg border bg-slate-50 p-2.5 text-sm font-semibold text-slate-600" value={filterStream} onChange={e => setFilterStream(e.target.value)}>
            <option value="">All Streams</option>
            {streams.map((st: any) => <option key={st.id} value={st.stream_name}>{st.stream_name}</option>)}
          </select>
          <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition-all" onClick={applyFilters}>Apply</button>
        </div>

        {/* Page Size (only in list view) */}
        {viewMode === "list" && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Per page:</span>
            {[10, 25, 50, 100].map(size => (
              <button key={size} className={`rounded px-3 py-1 font-bold transition-all ${pageSize === size ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`} onClick={() => changePageSize(size)}>{size}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border-2 border-dashed bg-slate-50/50 p-16 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {students.length === 0 ? (
            <div className="p-16 text-center"><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No students found.</p></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <TableHead showClass={true} />
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map((s: any, i: number) => renderRow(s, (currentPage - 1) * pageSize + i))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50">
                  <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1 rounded border text-xs font-medium hover:bg-slate-100 disabled:opacity-40" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                    {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                      let p: number
                      if (totalPages <= 9) p = i + 1
                      else if (currentPage <= 5) p = i + 1
                      else if (currentPage >= totalPages - 4) p = totalPages - 8 + i
                      else p = currentPage - 4 + i
                      return (
                        <button key={p} className={`w-8 h-8 rounded text-xs font-bold transition-all ${currentPage === p ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`} onClick={() => goToPage(p)}>{p}</button>
                      )
                    })}
                    <button className="px-3 py-1 rounded border text-xs font-medium hover:bg-slate-100 disabled:opacity-40" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedStudents).length === 0 ? (
            <div className="rounded-xl border-2 border-dashed bg-slate-50/50 p-16 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No students found.</p>
            </div>
          ) : viewMode === "school" ? (
            Object.entries(groupedStudents).map(([sId, sList]) => (
              <div key={sId} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-black">{sList.length}</div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase">{getSchoolName(sId)}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sList.length} students</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y text-left text-sm">
                    <TableHead showClass={true} />
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sList.map((s: any, i: number) => renderRow(s, i))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            classes.map(cls => {
              const sList = groupedStudents[cls]
              if (!sList || sList.length === 0) return null
              return (
                <div key={cls} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-black">{sList.length}</div>
                      <div>
                        <h3 className="text-sm font-black text-blue-800 uppercase">Class {cls}</h3>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{sList.length} students</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y text-left text-sm">
                      <TableHead showClass={false} />
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sList.map((s: any, i: number) => renderRow(s, i, false))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Duplicates Panel */}
      {showDuplicates && (
        <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 px-6 py-4 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white text-sm font-black">{Object.values(selectedToRemove).flat().length}</div>
              <div>
                <h3 className="text-sm font-black text-amber-800 uppercase">Duplicate Students (Same Name + Class + DOB)</h3>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{duplicates.length} groups found</p>
              </div>
            </div>
            <div className="flex gap-2">
              {Object.values(selectedToRemove).flat().length > 0 && (
                <button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 transition-all" onClick={handleRemoveAllDuplicates} disabled={loading}>
                  Remove {Object.values(selectedToRemove).flat().length} Selected
                </button>
              )}
              <button className="rounded-lg bg-slate-300 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-400 transition-all" onClick={() => { setShowDuplicates(false); setDuplicates([]); setSelectedToRemove({}) }}>Close</button>
            </div>
          </div>
          {duplicates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-green-600">No duplicate students found!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {duplicates.map((group, gi) => {
                const studentIds = group.students.map(s => s.id)
                const selected = selectedToRemove[gi] || []
                const allSelected = studentIds.every(id => selected.includes(id))
                const maxPaid = Math.max(...group.students.map((s: any) => s.total_paid || 0))
                return (
                  <div key={gi} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{group.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Class {group.class_name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">DOB: {group.dob}</span>
                        <span className="text-[10px] font-bold text-slate-400">{group.students.length} students</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={allSelected} onChange={() => toggleGroupAll(gi, studentIds)} className="h-3.5 w-3.5 rounded border-amber-400 text-amber-500 focus:ring-amber-400" />
                          <span className="text-[10px] font-bold text-amber-600">Select All</span>
                        </label>
                        {selected.length > 0 && (
                          <button className="rounded bg-red-500 px-3 py-1.5 text-[10px] font-black text-white hover:bg-red-600 transition-all" onClick={() => handleRemoveDuplicates(gi)} disabled={loading}>
                            Remove {selected.length}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-3 py-2 w-8"></th>
                            <th className="px-3 py-2">GR No</th>
                            <th className="px-3 py-2">Roll No</th>
                            <th className="px-3 py-2">Div</th>
                            <th className="px-3 py-2">Gender</th>
                            <th className="px-3 py-2">Father</th>
                            <th className="px-3 py-2">Admission No</th>
                            <th className="px-3 py-2 text-right">Total Paid</th>
                            <th className="px-3 py-2 text-right">Receipts</th>
                            <th className="px-3 py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {group.students.map((s: any) => (
                            <tr key={s.id} className={`hover:bg-slate-50 ${selected.includes(s.id) ? "bg-red-50/50" : ""}`}>
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleStudentSelection(gi, s.id)} className="h-3.5 w-3.5 rounded border-slate-300 text-red-500 focus:ring-red-400" />
                              </td>
                              <td className="px-3 py-2 font-bold text-blue-600">{s.gr_no || "-"}</td>
                              <td className="px-3 py-2 font-semibold">{s.roll_no || "-"}</td>
                              <td className="px-3 py-2 font-semibold">{s.division || "-"}</td>
                              <td className="px-3 py-2">{s.gender || "-"}</td>
                              <td className="px-3 py-2 text-slate-500">{s.father_name || "-"}</td>
                              <td className="px-3 py-2 text-slate-500">{s.admission_no || "-"}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={`font-black ${s.total_paid > 0 ? "text-green-600" : "text-slate-400"}`}>
                                  {s.total_paid > 0 ? `\u20B9${s.total_paid.toLocaleString()}` : "-"}
                                </span>
                                {s.total_paid === maxPaid && s.total_paid > 0 && (
                                  <span className="ml-1 rounded bg-green-100 px-1 py-0.5 text-[8px] font-black text-green-600">MAX</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-500">{s.fees?.length || 0}</td>
                              <td className="px-3 py-2">
                                <button className="font-bold text-blue-600 hover:text-blue-800" onClick={() => router.push(`/students/${s.id}`)}>View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Fees History per student */}
                    {group.students.some((s: any) => s.fees?.length > 0) && (
                      <div className="mt-3 rounded-lg border bg-slate-50 overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">Fees Paid History</div>
                        <div className="divide-y divide-slate-100">
                          {group.students.map((s: any) => (
                            <div key={s.id} className="px-4 py-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-black text-slate-700">{s.full_name}</span>
                                <span className="text-[10px] font-bold text-slate-400">GR: {s.gr_no || "-"}</span>
                                <span className={`text-[10px] font-black ${s.total_paid > 0 ? "text-green-600" : "text-slate-400"}`}>
                                  {s.total_paid > 0 ? `Total: \u20B9${s.total_paid.toLocaleString()}` : "No payments"}
                                </span>
                              </div>
                              {s.fees?.length > 0 ? (
                                <table className="w-full text-[10px]">
                                  <thead className="text-slate-400 font-bold uppercase">
                                    <tr>
                                      <th className="text-left py-1">Date</th>
                                      <th className="text-left py-1">Receipt</th>
                                      <th className="text-left py-1">Term</th>
                                      <th className="text-left py-1">Mode</th>
                                      <th className="text-left py-1">Category</th>
                                      <th className="text-right py-1">Amount</th>
                                      <th className="text-center py-1">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-slate-600">
                                    {s.fees.map((f: any) => (
                                      <tr key={f.id} className="hover:bg-white">
                                        <td className="py-0.5">{f.payment_date || "-"}</td>
                                        <td className="py-0.5 font-bold">{f.receipt_no || "-"}</td>
                                        <td className="py-0.5">{f.term || "-"}</td>
                                        <td className="py-0.5">{f.payment_mode || "-"}</td>
                                        <td className="py-0.5">{f.fee_category || "-"}</td>
                                        <td className="py-0.5 text-right font-bold">{"\u20B9"}{Number(f.amount || 0).toLocaleString()}</td>
                                        <td className="py-0.5 text-center">
                                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-black ${f.status === "Paid" ? "bg-green-100 text-green-600" : f.status === "Partial" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                                            {f.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">No fee records</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-4 rounded-xl p-3 text-xs font-black text-center border ${message.includes("error") || message.includes("fail") ? "bg-red-50 border-red-100 text-red-600" : "bg-green-50 border-green-100 text-green-600"}`}>
          {message}
        </p>
      )}

      {/* Student Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-black uppercase">{editing ? "Edit Student" : "New Student"}</h3>
              <button className="rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-600" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="grid gap-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="w-full md:w-1/4">
                  <label className="mb-2 block text-[10px] font-black uppercase text-slate-400 text-center">Photo</label>
                  <div className="relative h-48 w-full rounded-xl border-2 border-dashed bg-slate-50 flex items-center justify-center overflow-hidden">
                    {form.photo_url ? <img src={form.photo_url} className="h-full w-full object-cover" /> : <span className="text-3xl">🎓</span>}
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" onChange={e => handleFileUpload(e, "photo_url")} />
                    {uploading === "photo_url" && <div className="absolute inset-0 bg-blue-600/80 flex items-center justify-center text-white text-[10px] font-black animate-pulse">Uploading...</div>}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Full Name *</label>
                    <input className="w-full rounded-lg border p-3 text-sm font-bold" value={form.full_name} onChange={set("full_name")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">GR No</label>
                    <input className="w-full rounded-lg border p-3 text-sm font-bold text-blue-700 bg-blue-50/50" value={form.gr_no} onChange={set("gr_no")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Gender</label>
                    <select className="w-full rounded-lg border p-3 text-sm font-bold" value={form.gender} onChange={set("gender")}>
                      <option value="">Select</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">DOB</label>
                    <div className="flex gap-2">
                      <input className="flex-1 rounded-lg border p-3 text-sm font-bold" type="date" value={form.dob} onChange={set("dob")} />
                      {form.dob && <span className="flex items-center rounded bg-blue-600 px-2 text-[10px] font-black text-white">{calculateAge(form.dob)}</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Mobile</label>
                    <input className="w-full rounded-lg border p-3 text-sm font-bold" value={form.mobile} onChange={set("mobile")} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="border-b-2 border-blue-600 text-[11px] font-black text-blue-600 uppercase pb-1">Academic</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">School *</label>
                      <select className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.school_id} onChange={set("school_id")}>
                        <option value="">Select School</option>
                        {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Class *</label>
                      <select className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.class_name} onChange={set("class_name")}>
                        <option value="">Select</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Division</label>
                      <select className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.division} onChange={set("division")}>
                        <option value="">Select</option>
                        {divisions.filter((d: any) => d.class_name === form.class_name).map((d: any) => (
                          <option key={d.id} value={d.division_name}>{d.division_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Roll No</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" type="number" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Admission No</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.admission_no} onChange={set("admission_no")} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Last School</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.last_school} onChange={set("last_school")} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="border-b-2 border-orange-500 text-[11px] font-black text-orange-600 uppercase pb-1">Family</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Father Name</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.father_name} onChange={set("father_name")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Father Mobile</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.father_mobile} onChange={set("father_mobile")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Mother Name</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.mother_name} onChange={set("mother_name")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Mother Mobile</label>
                      <input className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.mother_mobile} onChange={set("mother_mobile")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Category</label>
                      <select className="w-full rounded-lg border p-2.5 text-sm font-bold" value={form.category} onChange={set("category")}>
                        <option value="">Select</option>
                        <option value="General">General</option><option value="OBC">OBC</option><option value="SC">SC</option>
                        <option value="ST">ST</option><option value="EWS">EWS</option><option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase">Address</h4>
                  <input className="w-full rounded-lg border bg-white p-2.5 text-sm" placeholder="Full Address" value={form.address} onChange={set("address")} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="rounded-lg border bg-white p-2.5 text-sm" placeholder="Village" value={form.village} onChange={set("village")} />
                    <input className="rounded-lg border bg-white p-2.5 text-sm" placeholder="District" value={form.district} onChange={set("district")} />
                    <input className="rounded-lg border bg-white p-2.5 text-sm" placeholder="Pincode" value={form.pincode} onChange={set("pincode")} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase">Documents</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ l: "Birth Cert", f: "birth_cert_url" }, { l: "Aadhar", f: "aadhar_url" }, { l: "Father Aadhar", f: "father_aadhar_url" }, { l: "Ration Card", f: "ration_card_url" }, { l: "Category Cert", f: "category_cert_url" }].map(d => (
                      <div key={d.f} className="flex items-center gap-2 rounded border bg-white p-2">
                        <input type="file" className="text-[10px] flex-1" accept=".pdf,image/*" onChange={e => handleFileUpload(e, d.f)} />
                        {form[d.f] && <a href={form[d.f]} target="_blank" className="text-[10px] font-bold text-green-600">View</a>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 border-t pt-4">
              <button className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700 transition-all" onClick={handleSave}>{editing ? "Update" : "Register"}</button>
              <button className="rounded-xl bg-slate-100 px-8 py-3 text-sm font-black text-slate-500 hover:bg-slate-200" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
