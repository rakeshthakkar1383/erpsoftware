"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]

type DashboardClientProps = {
  user: any
  schools: any[]
  students: any[]
  divisions: any[]
  fees: any[]
  teachers: any[]
  trusts: any[]
  leaves: any[]
  teacherClass: string
  defaultSchoolId: number | null
}

export default function DashboardClient({
  user, schools, students, divisions, fees, teachers, trusts, leaves, teacherClass, defaultSchoolId,
}: DashboardClientProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(defaultSchoolId)
  const [selectedClass, setSelectedClass] = useState<string | null>(teacherClass || null)
  const [selectedDiv, setSelectedDiv] = useState<string | null>(null)
  const [selectedFeeClass, setSelectedFeeClass] = useState<string | null>(teacherClass || null)
  const [selectedTrust, setSelectedTrust] = useState<number | null>(null)
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState("")
  const [studentFilterClass, setStudentFilterClass] = useState("")
  const [studentFilterDiv, setStudentFilterDiv] = useState("")
  const router = useRouter()

  const school = schools.find(s => s.id === selectedSchoolId)

  const filteredStudents = useMemo(
    () => students.filter(s => s.school_id === selectedSchoolId),
    [students, selectedSchoolId]
  )
  const filteredDivisions = useMemo(
    () => divisions.filter(d => d.school_id === selectedSchoolId),
    [divisions, selectedSchoolId]
  )
  const filteredFees = useMemo(
    () => fees.filter(f => f.school_id === selectedSchoolId),
    [fees, selectedSchoolId]
  )
  const filteredTeachers = useMemo(
    () => teachers.filter(t => t.school_id === selectedSchoolId),
    [teachers, selectedSchoolId]
  )
  const filteredTrusts = useMemo(
    () => trusts.filter(t => t.school_id === selectedSchoolId),
    [trusts, selectedSchoolId]
  )
  const filteredTeacherLeaves = useMemo(
    () => leaves.filter(l => l.school_id === selectedSchoolId && l.applicant_type === "teacher"),
    [leaves, selectedSchoolId]
  )

  const approvedLeaves = filteredTeacherLeaves.filter(l => l.status === "Approved")
  const rejectedLeaves = filteredTeacherLeaves.filter(l => l.status === "Rejected")
  const pendingLeaves = filteredTeacherLeaves.filter(l => l.status === "Pending")

  const paidStudentIds = new Set(
    filteredFees.filter(f => f.status?.toLowerCase() === "paid").map(f => f.student_id)
  )

  const trustFees = useMemo(
    () => filteredFees.filter(f => f.fee_category === "Trust"),
    [filteredFees]
  )

  const trustPaidStudentIds = useMemo(
    () => new Set(trustFees.filter(f => f.status?.toLowerCase() === "paid").map(f => f.student_id)),
    [trustFees]
  )

  const getTrustStudentIds = (trustId: number) => new Set(
    trustFees.filter(f => f.trust_id === trustId).map(f => f.student_id)
  )

  const getTrustPaidStudentIds = (trustId: number) => new Set(
    trustFees.filter(f => f.trust_id === trustId && f.status?.toLowerCase() === "paid").map(f => f.student_id)
  )

  const getStudentsByClass = (cls: string) => filteredStudents.filter(s => s.class_name === cls)
  const getStudentsByDiv = (cls: string, div: string) => filteredStudents.filter(s => s.class_name === cls && s.division === div)
  const getDivisionsForClass = (cls: string) => filteredDivisions.filter(d => d.class_name === cls)

  const renderStudentTable = (list: any[], paidSet?: Set<number>, showClass = true) => {
    if (list.length === 0) return <p className="text-sm text-slate-500">No students</p>
    const isPaid = paidSet || paidStudentIds
    return (
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">GR No</th>
              <th className="px-3 py-2">Roll No</th>
              <th className="px-3 py-2">Student Name</th>
              {showClass && <th className="px-3 py-2">Class/Div</th>}
              {!showClass && <th className="px-3 py-2">Division</th>}
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">DOB</th>
              <th className="px-3 py-2 text-right">Fee Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((s: any, i: number) => {
              const paid = isPaid.has(s.id)
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 text-xs font-black text-blue-600">{s.gr_no || "-"}</td>
                  <td className="px-3 py-2 text-xs font-bold">{s.roll_no || "-"}</td>
                  <td className="px-3 py-2">
                    <button className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors text-left" onClick={() => router.push(`/students/${s.id}`)}>{s.full_name}</button>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold">
                    {showClass ? `${s.class_name}${s.division ? ` / ${s.division}` : ""}` : (s.division || "-")}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>{s.gender || "-"}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatDate(s.dob)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {paid ? "PAID" : "UNPAID"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const displayStudents = useMemo(() => {
    let list = filteredStudents
    if (studentFilterClass) list = list.filter(s => s.class_name === studentFilterClass)
    if (studentFilterDiv) list = list.filter(s => s.division === studentFilterDiv)
    if (studentSearch) {
      const q = studentSearch.toLowerCase()
      list = list.filter(s =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.gr_no || "").toLowerCase().includes(q) ||
        (s.father_name || "").toLowerCase().includes(q) ||
        (s.admission_no || "").toLowerCase().includes(q)
      )
    }
    return list
  }, [filteredStudents, studentFilterClass, studentFilterDiv, studentSearch])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">Overview</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 uppercase">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">School performance overview</p>
          </div>

          <div className="w-full max-w-md">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Select School</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none ring-0 focus:border-blue-500 focus:bg-white"
              value={selectedSchoolId ?? ""}
              onChange={e => setSelectedSchoolId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- All Schools --</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.school_name}</option>
              ))}
            </select>
          </div>
        </div>

        {school && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Selected School</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{school.school_name}</h3>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-semibold text-slate-700">{school.trust_name || "Trust"}</p>
                <p className="text-sm text-slate-600">{school.address || "Address not available"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedSchoolId && school && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">{school.school_name}</div>
            <div className="mt-3 text-3xl font-black text-blue-900">{filteredStudents.length}</div>
            <div className="mt-1 text-sm text-blue-700">Total Students</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Teachers</div>
            <div className="mt-3 text-3xl font-black text-emerald-900">{filteredTeachers.length}</div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">Divisions</div>
            <div className="mt-3 text-3xl font-black text-violet-900">{filteredDivisions.length}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Fees Paid</div>
            <div className="mt-3 text-3xl font-black text-amber-900">{paidStudentIds.size}</div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">Trust Fees Paid</div>
            <div className="mt-3 text-3xl font-black text-indigo-900">{trustPaidStudentIds.size}</div>
          </div>
        </div>
      )}

      {selectedSchoolId && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md">{displayStudents.length}</div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">Students List</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{school?.school_name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input className="w-52 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500" placeholder="Search name, GR No..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" value={studentFilterClass} onChange={e => { setStudentFilterClass(e.target.value); setStudentFilterDiv("") }}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" value={studentFilterDiv} onChange={e => setStudentFilterDiv(e.target.value)}>
                <option value="">All Divisions</option>
                {filteredDivisions.filter((d: any) => !studentFilterClass || d.class_name === studentFilterClass).map((d: any) => (
                  <option key={d.id} value={d.division_name}>{d.division_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {displayStudents.length === 0 ? (
              <div className="p-12 text-center"><p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">No students found.</p></div>
            ) : (
              renderStudentTable(displayStudents)
            )}
          </div>
        </div>
      )}

      {selectedSchoolId && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${
              selectedLeaveStatus === "Approved" ? "border-green-500 bg-green-100" : "border-green-200 bg-green-50"
            }`}
            onClick={() => setSelectedLeaveStatus(selectedLeaveStatus === "Approved" ? null : "Approved")}
          >
            <div className="text-xs uppercase tracking-wide text-green-600">Teacher Approved Leaves</div>
            <div className="text-3xl font-bold text-green-800">{approvedLeaves.length}</div>
          </button>
          <button
            className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${
              selectedLeaveStatus === "Rejected" ? "border-red-500 bg-red-100" : "border-red-200 bg-red-50"
            }`}
            onClick={() => setSelectedLeaveStatus(selectedLeaveStatus === "Rejected" ? null : "Rejected")}
          >
            <div className="text-xs uppercase tracking-wide text-red-600">Teacher Rejected Leaves</div>
            <div className="text-3xl font-bold text-red-800">{rejectedLeaves.length}</div>
          </button>
          <button
            className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${
              selectedLeaveStatus === "Pending" ? "border-amber-500 bg-amber-100" : "border-amber-200 bg-amber-50"
            }`}
            onClick={() => setSelectedLeaveStatus(selectedLeaveStatus === "Pending" ? null : "Pending")}
          >
            <div className="text-xs uppercase tracking-wide text-amber-600">Teacher Pending Leaves</div>
            <div className="text-3xl font-bold text-amber-800">{pendingLeaves.length}</div>
          </button>
        </div>
      )}

      {selectedSchoolId && selectedLeaveStatus && (
        <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-700">Teacher {selectedLeaveStatus} Leaves</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Teacher Name</th>
                  <th className="px-4 py-2">From Date</th>
                  <th className="px-4 py-2">To Date</th>
                  <th className="px-4 py-2">Days</th>
                  <th className="px-4 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selectedLeaveStatus === "Approved" ? approvedLeaves :
                  selectedLeaveStatus === "Rejected" ? rejectedLeaves :
                  pendingLeaves).map((l: any) => {
                    const teacher = teachers.find(t => t.id === l.applicant_id)
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-2 font-medium">{teacher?.full_name || "Unknown"}</td>
                        <td className="px-4 py-2">{l.from_date}</td>
                        <td className="px-4 py-2">{l.to_date}</td>
                        <td className="px-4 py-2">{l.days}</td>
                        <td className="px-4 py-2">{l.reason}</td>
                      </tr>
                    )
                  })}
                {(selectedLeaveStatus === "Approved" ? approvedLeaves :
                  selectedLeaveStatus === "Rejected" ? rejectedLeaves :
                  pendingLeaves).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No {selectedLeaveStatus.toLowerCase()} leaves found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedSchoolId && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {schools.map(s => {
            const sc = students.filter(st => st.school_id === s.id)
            const sl = leaves.filter(l => l.school_id === s.id && l.applicant_type === "teacher")
            const approved = sl.filter(l => l.status === "Approved").length
            const rejected = sl.filter(l => l.status === "Rejected").length
            const pending = sl.filter(l => l.status === "Pending").length

            return (
              <button
                key={s.id}
                className="rounded-lg border bg-white p-4 text-center shadow-sm transition hover:shadow-md"
                onClick={() => setSelectedSchoolId(s.id)}
              >
                <div className="text-lg font-bold text-blue-700">{s.school_name}</div>
                <div className="mt-1 text-sm text-slate-500">{sc.length} Students</div>
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-green-600">A: {approved}</span>
                  <span className="text-red-600">R: {rejected}</span>
                  <span className="text-amber-600">P: {pending}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedSchoolId && (
        <>
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-slate-700">Trust-wise Fee Status</h3>
            <div className="space-y-3">
              {filteredTrusts.map((trust: any) => {
                const studentIds = getTrustStudentIds(trust.id)
                const studentsWithTrustFees = filteredStudents.filter(s => studentIds.has(s.id))
                if (studentsWithTrustFees.length === 0) return null
                const paidIds = getTrustPaidStudentIds(trust.id)
                const paid = studentsWithTrustFees.filter(s => paidIds.has(s.id))
                const unpaid = studentsWithTrustFees.filter(s => !paidIds.has(s.id))
                return (
                  <div key={trust.id} className="rounded-lg border bg-white shadow-sm">
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                      onClick={() => setSelectedTrust(selectedTrust === trust.id ? null : trust.id)}
                    >
                      <span className="font-semibold text-slate-700">{trust.trust_name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">{studentsWithTrustFees.length} students</span>
                        <span className="text-green-600">{paid.length} Paid</span>
                        <span className="text-red-600">{unpaid.length} Unpaid</span>
                        <span className="text-slate-400">{selectedTrust === trust.id ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {selectedTrust === trust.id && (
                      <div className="border-t px-4 py-3">
                        {renderStudentTable(studentsWithTrustFees, paidIds)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-6 mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {classes.map(cls => {
              const list = getStudentsByClass(cls)
              if (teacherClass && cls !== teacherClass) return null
              return (
                <button
                  key={cls}
                  className={`rounded-lg border p-4 text-center shadow-sm transition hover:shadow-md ${
                    selectedClass === cls ? "ring-2 ring-blue-500" : "bg-white"
                  }`}
                  onClick={() => !teacherClass && setSelectedClass(selectedClass === cls ? null : cls)}
                >
                  <div className="text-3xl font-bold text-blue-600">{list.length}</div>
                  <div className="mt-1 text-sm text-slate-600">Class {cls}</div>
                </button>
              )
            })}
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-slate-700">Division-wise Details</h3>
            <div className="space-y-4">
              {classes.map(cls => {
                const divs = getDivisionsForClass(cls)
                if (divs.length === 0) return null
                return (
                  <div key={cls} className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-slate-50 px-4 py-2 font-semibold text-slate-700">Class {cls}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-2">Division</th>
                            <th className="px-4 py-2">Class Teacher</th>
                            <th className="px-4 py-2">Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {divs.map((d: any) => {
                            const list = getStudentsByDiv(d.class_name, d.division_name)
                            const divKey = `${d.class_name}-${d.division_name}`
                            return (
                              <tr key={d.id}>
                                <td className="px-4 py-2 font-medium">{d.division_name}</td>
                                <td className="px-4 py-2">{d.teachers?.full_name || "-"}</td>
                                <td className="px-4 py-2">
                                  <button className="text-blue-600 hover:underline" onClick={() => setSelectedDiv(selectedDiv === divKey ? null : divKey)}>
                                    {list.length} students {selectedDiv === divKey ? "▲" : "▼"}
                                  </button>
                                  {selectedDiv === divKey && (
                                    <div className="mt-2">{renderStudentTable(list, undefined, false)}</div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-slate-700">Class-wise Fee Status</h3>
            <div className="space-y-3">
              {classes.map(cls => {
                const list = getStudentsByClass(cls)
                if (list.length === 0) return null
                const paid = list.filter(s => paidStudentIds.has(s.id))
                const unpaid = list.filter(s => !paidStudentIds.has(s.id))
                return (
                  <div key={cls} className="rounded-lg border bg-white shadow-sm">
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                      onClick={() => setSelectedFeeClass(selectedFeeClass === cls ? null : cls)}
                    >
                      <span className="font-semibold text-slate-700">Class {cls}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">{list.length} students</span>
                        <span className="text-green-600">{paid.length} Paid</span>
                        <span className="text-red-600">{unpaid.length} Unpaid</span>
                        <span className="text-slate-400">{selectedFeeClass === cls ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {selectedFeeClass === cls && (
                      <div className="border-t px-4 py-3">
                        {renderStudentTable(list)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
