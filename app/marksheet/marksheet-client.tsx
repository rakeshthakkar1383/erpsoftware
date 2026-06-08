"use client"

import { useState, useMemo } from "react"

const classes = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const views = [
  { key: "student", label: "Student Report Card" },
  { key: "class", label: "Class Marksheet" },
  { key: "exam", label: "Exam Marksheet" },
]

function calcGrade(pct: number) {
  if (pct >= 90) return "A+"
  if (pct >= 75) return "A"
  if (pct >= 60) return "B"
  if (pct >= 45) return "C"
  if (pct >= 35) return "D"
  return "F"
}

export default function MarksheetClient({ data }: { data: { students: any[], marks: any[], exams: any[], subjects: any[], divisions: any[] } }) {
  const { students, marks, exams, subjects, divisions } = data
  const [view, setView] = useState("student")
  const [filterClass, setFilterClass] = useState("")
  const [filterDiv, setFilterDiv] = useState("")
  const [filterStudent, setFilterStudent] = useState("")
  const [filterExam, setFilterExam] = useState("")

  const examMap = useMemo(() => {
    const m: any = {}; exams.forEach((e: any) => { m[e.id] = e }); return m
  }, [exams])

  const studentMap = useMemo(() => {
    const m: any = {}; students.forEach((s: any) => { m[s.id] = s }); return m
  }, [students])

  const marksByStudent = useMemo(() => {
    const m: any = {}
    marks.forEach((mk: any) => {
      if (!m[mk.student_id]) m[mk.student_id] = []
      m[mk.student_id].push(mk)
    })
    return m
  }, [marks])

  const marksByExam = useMemo(() => {
    const m: any = {}
    marks.forEach((mk: any) => {
      if (!m[mk.exam_id]) m[mk.exam_id] = []
      m[mk.exam_id].push(mk)
    })
    return m
  }, [marks])

  const filteredStudents = students.filter((s: any) => {
    if (filterClass && s.class_name !== filterClass) return false
    if (filterDiv && s.division !== filterDiv) return false
    return true
  })

  const classDivisions = divisions.filter((d: any) => d.class_name === filterClass || !filterClass)

  const selectedStudentMarks = filterStudent ? marksByStudent[filterStudent] || [] : []
  const selectedExams = exams.filter((e: any) => e.class_name === filterClass || !filterClass)

  const getSubjectsForExam = (examId: number) => {
    const exam = examMap[examId]
    if (!exam) return []
    return subjects.filter((s: any) => s.class_name === exam.class_name)
  }

  const getMarksForStudentExam = (studentId: number, examId: number) => {
    const studentMarks = marksByStudent[studentId] || []
    return studentMarks.filter((m: any) => m.exam_id === examId)
  }

  const selectedExamMarks = filterExam ? marksByExam[filterExam] || [] : []
  const selectedExam = examMap[filterExam]
  const examSubjects = selectedExam ? subjects.filter((s: any) => s.class_name === selectedExam.class_name) : []

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Marksheet</h2>

      <div className="mb-4 flex items-center gap-4 border-b border-slate-200">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              view === v.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "student" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv(""); setFilterStudent("") }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => { setFilterDiv(e.target.value); setFilterStudent("") }}>
              <option value="">All Divisions</option>
              {classDivisions.map((d: any) => <option key={d.id} value={d.division_name}>{d.division_name}</option>)}
            </select>
            <select className="rounded border p-2 text-sm" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
              <option value="">Select Student</option>
              {filteredStudents.map((s: any) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}/{s.division || "-"})</option>
              ))}
            </select>
          </div>

          {filterStudent && studentMap[filterStudent] && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-6 border-b pb-4">
                <h3 className="text-xl font-bold uppercase">{studentMap[filterStudent].full_name}</h3>
                <p className="text-sm text-slate-500">
                  Class: {studentMap[filterStudent].class_name} | Division: {studentMap[filterStudent].division || "-"} | Roll No: {studentMap[filterStudent].roll_no || "-"} | GR No: {studentMap[filterStudent].gr_no || "-"}
                </p>
              </div>

              {selectedExams.length === 0 ? (
                <p className="text-sm text-slate-500">No exams found for this class.</p>
              ) : (
                <div className="space-y-6">
                  {selectedExams.map((exam: any) => {
                    const examMarks = getMarksForStudentExam(Number(filterStudent), exam.id)
                    const examSubjectList = subjects.filter((s: any) => s.class_name === exam.class_name)
                    const totalObtained = examMarks.reduce((sum: number, m: any) => sum + Number(m.marks || 0), 0)
                    const totalMax = examSubjectList.length * 100
                    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0

                    return (
                      <div key={exam.id}>
                        <h4 className="mb-2 text-sm font-bold uppercase text-blue-600">{exam.exam_name} {exam.semester ? `(${exam.semester})` : ""}</h4>
                        <table className="min-w-full divide-y divide-slate-200 rounded border text-left text-sm">
                          <thead className="bg-slate-50 uppercase text-slate-600">
                            <tr><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Max Marks</th><th className="px-3 py-2">Marks Obtained</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                            {examSubjectList.map((sub: any) => {
                              const mk = examMarks.find((m: any) => m.subject === sub.subject_name)
                              return (
                                <tr key={sub.id}>
                                  <td className="px-3 py-2 font-medium">{sub.subject_name}</td>
                                  <td className="px-3 py-2">100</td>
                                  <td className="px-3 py-2">{mk ? mk.marks : "-"}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-slate-50 font-semibold">
                            <tr>
                              <td className="px-3 py-2">Total</td>
                              <td className="px-3 py-2">{totalMax}</td>
                              <td className="px-3 py-2">{totalObtained}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2" colSpan={2}>Percentage</td>
                              <td className="px-3 py-2">{pct}%</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2" colSpan={2}>Grade</td>
                              <td className="px-3 py-2 font-bold">{calcGrade(pct)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === "class" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv("") }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
              <option value="">All Divisions</option>
              {classDivisions.map((d: any) => <option key={d.id} value={d.division_name}>{d.division_name}</option>)}
            </select>
            <select className="rounded border p-2 text-sm" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
              <option value="">Select Exam</option>
              {selectedExams.map((e: any) => (
                <option key={e.id} value={e.id}>{e.exam_name} {e.semester ? `(${e.semester})` : ""}</option>
              ))}
            </select>
          </div>

          {filterExam && selectedExam && (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Roll No</th>
                    {examSubjects.map((sub: any) => (
                      <th key={sub.id} className="px-3 py-2">{sub.subject_name}</th>
                    ))}
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredStudents.map((s: any, i: number) => {
                    const studentMarks = marks.filter((m: any) => m.student_id === s.id && m.exam_id === Number(filterExam))
                    const totalObtained = studentMarks.reduce((sum: number, m: any) => sum + Number(m.marks || 0), 0)
                    const totalMax = examSubjects.length * 100
                    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0

                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{s.full_name}</td>
                        <td className="px-3 py-2">{s.roll_no || "-"}</td>
                        {examSubjects.map((sub: any) => {
                          const mk = studentMarks.find((m: any) => m.subject === sub.subject_name)
                          return <td key={sub.id} className="px-3 py-2">{mk ? mk.marks : "-"}</td>
                        })}
                        <td className="px-3 py-2 font-semibold">{totalObtained}</td>
                        <td className="px-3 py-2">{pct}%</td>
                        <td className={`px-3 py-2 font-bold ${pct >= 35 ? "text-green-600" : "text-red-600"}`}>{calcGrade(pct)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "exam" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="rounded border p-2 text-sm" value={filterExam} onChange={e => {
              setFilterExam(e.target.value)
              const exam = examMap[e.target.value]
              if (exam) setFilterClass(exam.class_name)
            }}>
              <option value="">Select Exam</option>
              {exams.map((e: any) => (
                <option key={e.id} value={e.id}>{e.exam_name} - Class {e.class_name} {e.semester ? `(${e.semester})` : ""}</option>
              ))}
            </select>
          </div>

          {filterExam && selectedExam && (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Roll No</th>
                    {examSubjects.map((sub: any) => (
                      <th key={sub.id} className="px-3 py-2">{sub.subject_name}</th>
                    ))}
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {students.filter((s: any) => s.class_name === selectedExam.class_name).map((s: any, i: number) => {
                    const studentMarks = marks.filter((m: any) => m.student_id === s.id && m.exam_id === Number(filterExam))
                    const totalObtained = studentMarks.reduce((sum: number, m: any) => sum + Number(m.marks || 0), 0)
                    const totalMax = examSubjects.length * 100
                    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0

                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{s.full_name}</td>
                        <td className="px-3 py-2">{s.class_name}</td>
                        <td className="px-3 py-2">{s.roll_no || "-"}</td>
                        {examSubjects.map((sub: any) => {
                          const mk = studentMarks.find((m: any) => m.subject === sub.subject_name)
                          return <td key={sub.id} className="px-3 py-2">{mk ? mk.marks : "-"}</td>
                        })}
                        <td className="px-3 py-2 font-semibold">{totalObtained}</td>
                        <td className="px-3 py-2">{pct}%</td>
                        <td className={`px-3 py-2 font-bold ${pct >= 35 ? "text-green-600" : "text-red-600"}`}>{calcGrade(pct)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
