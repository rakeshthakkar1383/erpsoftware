"use client"

import { useState, useMemo } from "react"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]

type DashboardClientProps = {
  user: any
  schools: any[]
  students: any[]
  divisions: any[]
  fees: any[]
  teachers: any[]
  trusts: any[]
  teacherClass: string
  defaultSchoolId: number | null
}

export default function DashboardClient({
  user, schools, students, divisions, fees, teachers, trusts, teacherClass, defaultSchoolId,
}: DashboardClientProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(defaultSchoolId)
  const [selectedClass, setSelectedClass] = useState<string | null>(teacherClass || null)
  const [selectedDiv, setSelectedDiv] = useState<string | null>(null)
  const [selectedFeeClass, setSelectedFeeClass] = useState<string | null>(teacherClass || null)
  const [selectedTrust, setSelectedTrust] = useState<number | null>(null)

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

  const renderStudentList = (list: any[], paidSet?: Set<number>) => {
    if (list.length === 0) return <p className="text-sm text-slate-500">No students</p>
    const isPaid = paidSet || paidStudentIds
    const paid = list.filter(s => isPaid.has(s.id))
    const unpaid = list.filter(s => !isPaid.has(s.id))
    return (
      <div className="space-y-1">
        {paid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700">Paid ({paid.length})</p>
            <div className="flex flex-wrap gap-1">
              {paid.map(s => (
                <span key={s.id} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{s.full_name}</span>
              ))}
            </div>
          </div>
        )}
        {unpaid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700">Unpaid ({unpaid.length})</p>
            <div className="flex flex-wrap gap-1">
              {unpaid.map(s => (
                <span key={s.id} className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">{s.full_name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">DASHBOARD</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">School Performance Overview</p>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-xs font-medium text-slate-600 uppercase tracking-wider">Select School</label>
        <select
          className="w-full max-w-md rounded border p-3 text-sm"
          value={selectedSchoolId ?? ""}
          onChange={e => setSelectedSchoolId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- All Schools --</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.school_name}</option>
          ))}
        </select>
      </div>

      {selectedSchoolId && school && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-blue-600">{school.school_name}</div>
            <div className="text-3xl font-bold text-blue-800">{filteredStudents.length}</div>
            <div className="mt-1 text-sm text-blue-600">Total Students</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-green-600">Teachers</div>
            <div className="text-3xl font-bold text-green-800">{filteredTeachers.length}</div>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-purple-600">Divisions</div>
            <div className="text-3xl font-bold text-purple-800">{filteredDivisions.length}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-amber-600">Fees Paid</div>
            <div className="text-3xl font-bold text-amber-800">{paidStudentIds.size}</div>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-indigo-600">Trust Fees Paid</div>
            <div className="text-3xl font-bold text-indigo-800">{trustPaidStudentIds.size}</div>
          </div>
        </div>
      )}

      {!selectedSchoolId && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {schools.map(s => {
            const sc = students.filter(st => st.school_id === s.id)
            return (
              <button
                key={s.id}
                className="rounded-lg border bg-white p-4 text-center shadow-sm transition hover:shadow-md"
                onClick={() => setSelectedSchoolId(s.id)}
              >
                <div className="text-lg font-bold text-blue-700">{s.school_name}</div>
                <div className="mt-1 text-sm text-slate-500">{sc.length} Students</div>
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
                        {renderStudentList(studentsWithTrustFees, paidIds)}
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
                                    <div className="mt-2">{renderStudentList(list)}</div>
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
                        {renderStudentList(list)}
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
