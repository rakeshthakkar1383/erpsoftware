"use client"

import { useState } from "react"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))

type DashboardClientProps = {
  user: any
  students: any[]
  divisions: any[]
  fees: any[]
  teacherClass: string
  schoolName: string
}

export default function DashboardClient({
  user, students, divisions, fees, teacherClass, schoolName,
}: DashboardClientProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(teacherClass || null)
  const [selectedDiv, setSelectedDiv] = useState<string | null>(null)
  const [selectedFeeClass, setSelectedFeeClass] = useState<string | null>(teacherClass || null)

  const paidStudentIds = new Set(
    fees.filter((f) => f.status?.toLowerCase() === "paid").map((f) => f.student_id)
  )

  const getStudentsByClass = (cls: string) => students.filter((s) => s.class_name === cls)
  const getStudentsByDiv = (cls: string, div: string) => students.filter((s) => s.class_name === cls && s.division === div)
  const getDivisionsForClass = (cls: string) => divisions.filter((d: any) => d.class_name === cls)

  const renderStudentList = (list: any[]) => {
    if (list.length === 0) return <p className="text-sm text-slate-500">No students</p>
    const paid = list.filter((s) => paidStudentIds.has(s.id))
    const unpaid = list.filter((s) => !paidStudentIds.has(s.id))
    return (
      <div className="space-y-1">
        {paid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700">Paid ({paid.length})</p>
            <div className="flex flex-wrap gap-1">
              {paid.map((s) => (
                <span key={s.id} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{s.full_name}</span>
              ))}
            </div>
          </div>
        )}
        {unpaid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700">Unpaid ({unpaid.length})</p>
            <div className="flex flex-wrap gap-1">
              {unpaid.map((s) => (
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
        <h2 className="text-2xl font-bold text-slate-800 uppercase">{schoolName || "DASHBOARD"}</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">School Performance Overview</p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-600">School</div>
              <div className="text-xl font-bold text-blue-800">{schoolName}</div>
            </div>
            <div className="text-right text-3xl font-bold text-blue-600">{students.length}</div>
          </div>
          <div className="mt-2 text-sm text-blue-600">Total Students</div>
        </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {classes.map((cls) => {
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
          {classes.map((cls) => {
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
          {classes.map((cls) => {
            const list = getStudentsByClass(cls)
            if (list.length === 0) return null
            const paid = list.filter((s) => paidStudentIds.has(s.id))
            const unpaid = list.filter((s) => !paidStudentIds.has(s.id))
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
    </div>
  )
}
