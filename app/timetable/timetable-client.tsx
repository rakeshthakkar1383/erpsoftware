"use client"

import { useMemo, useState } from "react"
import { addTimetable, deleteTimetable, getAllTimetable, updateTimetable } from "./actions"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const PERIODS = Array.from({ length: 8 }, (_, i) => i + 1)
const CLASSES = ["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
const VIEW_TABS = [
  { key: "class", label: "Class Wise" },
  { key: "teacher", label: "Teacher Wise" },
  { key: "day", label: "Day Wise" },
  { key: "subject", label: "Subject Wise" },
] as const

type ViewMode = (typeof VIEW_TABS)[number]["key"]

const emptyForm: Record<string, string> = {
  class_name: "",
  division: "",
  day: "Monday",
  period_no: "1",
  start_time: "",
  end_time: "",
  subject_id: "",
  teacher_id: "",
  school_id: "",
}

export default function TimetableClient({ initialEntries, subjects, teachers, allSchools, schoolId }: { initialEntries: any[], subjects: any[], teachers: any[], allSchools: any[], schoolId: number | null }) {
  const [entries, setEntries] = useState(initialEntries)
  const [view, setView] = useState<ViewMode>("class")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const subjectMap = useMemo(() => {
    const map: Record<string, any> = {}
    subjects.forEach((subject: any) => { map[subject.id] = subject })
    return map
  }, [subjects])

  const teacherMap = useMemo(() => {
    const map: Record<string, any> = {}
    teachers.forEach((teacher: any) => { map[teacher.id] = teacher })
    return map
  }, [teachers])

  const refresh = async () => setEntries(await getAllTimetable())

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toFD = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([key, value]) => fd.append(key, String(value ?? "")))
    return fd
  }

  const handleSave = async () => {
    if (!form.class_name || !form.day || !form.period_no || !form.subject_id || !form.teacher_id) {
      setMessage("Class, day, period, subject and teacher are required")
      return
    }

    const fd = toFD(form)
    const result = editing ? await updateTimetable(editing.id, fd) : await addTimetable(fd)

    setMessage(result.message)
    if (result.success) {
      setModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
      refresh()
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this timetable entry?")) return
    const result = await deleteTimetable(id)
    setMessage(result.message)
    if (result.success) refresh()
  }

  const q = search.toLowerCase()
  const filteredEntries = entries.filter((entry: any) => {
    if (!q) return true
    const teacherName = teacherMap[entry.teacher_id]?.full_name || ""
    const subjectName = subjectMap[entry.subject_id]?.subject_name || ""
    return [entry.class_name, entry.division, entry.day, String(entry.period_no), teacherName, subjectName].some((value: any) =>
      String(value || "").toLowerCase().includes(q)
    )
  })

  const entriesByClass = filteredEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    const key = `${entry.class_name}${entry.division ? ` / ${entry.division}` : ""}`
    acc[key] = acc[key] || []
    acc[key].push(entry)
    return acc
  }, {})

  const entriesByTeacher = filteredEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    const key = teacherMap[entry.teacher_id]?.full_name || `Teacher #${entry.teacher_id || "Unknown"}`
    acc[key] = acc[key] || []
    acc[key].push(entry)
    return acc
  }, {})

  const entriesByDay = filteredEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    const key = entry.day || "Unknown"
    acc[key] = acc[key] || []
    acc[key].push(entry)
    return acc
  }, {})

  const entriesBySubject = filteredEntries.reduce((acc: Record<string, any[]>, entry: any) => {
    const key = subjectMap[entry.subject_id]?.subject_name || `Subject #${entry.subject_id || "Unknown"}`
    acc[key] = acc[key] || []
    acc[key].push(entry)
    return acc
  }, {})

  const renderTable = (rows: any[], title: string) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
        {title}
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2">Period</th>
            <th className="px-3 py-2">Class</th>
            <th className="px-3 py-2">Division</th>
            <th className="px-3 py-2">Subject</th>
            <th className="px-3 py-2">Teacher</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort((a, b) => {
            const dayA = DAYS.indexOf(a.day || "Monday")
            const dayB = DAYS.indexOf(b.day || "Monday")
            return dayA - dayB || (Number(a.period_no) || 0) - (Number(b.period_no) || 0)
          }).map((entry: any) => (
            <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2">{entry.day}</td>
              <td className="px-3 py-2">{entry.period_no}</td>
              <td className="px-3 py-2">{entry.class_name}</td>
              <td className="px-3 py-2">{entry.division || "-"}</td>
              <td className="px-3 py-2">{subjectMap[entry.subject_id]?.subject_name || "-"}</td>
              <td className="px-3 py-2">{teacherMap[entry.teacher_id]?.full_name || "-"}</td>
              <td className="px-3 py-2">{entry.start_time || "-"}{entry.end_time ? ` - ${entry.end_time}` : ""}</td>
              <td className="px-3 py-2">
                <div className="flex gap-3">
                  <button className="text-blue-600 hover:underline" onClick={() => {
                    setEditing(entry)
                    setForm({
                      class_name: entry.class_name || "",
                      division: entry.division || "",
                      day: entry.day || "Monday",
                      period_no: String(entry.period_no || 1),
                      start_time: entry.start_time || "",
                      end_time: entry.end_time || "",
                      subject_id: String(entry.subject_id || ""),
                      teacher_id: String(entry.teacher_id || ""),
                      school_id: entry.school_id ? String(entry.school_id) : "",
                    })
                    setMessage("")
                    setModal(true)
                  }}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(entry.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderView = () => {
    if (view === "teacher") {
      return Object.entries(entriesByTeacher).map(([teacherName, rows]) => renderTable(rows, teacherName))
    }

    if (view === "day") {
      return Object.entries(entriesByDay).map(([day, rows]) => renderTable(rows, day))
    }

    if (view === "subject") {
      return Object.entries(entriesBySubject).map(([subjectName, rows]) => renderTable(rows, subjectName))
    }

    return Object.entries(entriesByClass).map(([className, rows]) => renderTable(rows, className))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Time Table</h2>
          <p className="text-sm text-slate-500">Class-wise, teacher-wise, day-wise and subject-wise schedule management.</p>
        </div>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => {
            setEditing(null)
            setForm({ ...emptyForm, school_id: schoolId ? String(schoolId) : "" })
            setMessage("")
            setModal(true)
          }}
        >
          Add New Schedule
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${view === tab.key ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-200"}`}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          className="w-full rounded border border-slate-200 bg-white p-2.5 text-sm md:max-w-xs"
          placeholder="Search class / teacher / subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {message && <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</p>}

      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No timetable entries found for the current filter.
        </div>
      ) : (
        <div className="space-y-5">{renderView()}</div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-5 text-xl font-bold text-slate-800">{editing ? "Edit Timetable" : "Add Timetable"}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {!schoolId && (
                <select className="w-full rounded border p-3 text-sm" value={form.school_id} onChange={setField("school_id")}>
                  <option value="">Select School</option>
                  {allSchools.map((school: any) => (
                    <option key={school.id} value={school.id}>{school.school_name}</option>
                  ))}
                </select>
              )}

              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={setField("class_name")}>
                <option value="">Select Class</option>
                {CLASSES.map((item) => (
                  <option key={item} value={item}>Class {item}</option>
                ))}
              </select>

              <input className="w-full rounded border p-3 text-sm" placeholder="Division (A/B/...)" value={form.division} onChange={setField("division")} />

              <select className="w-full rounded border p-3 text-sm" value={form.day} onChange={setField("day")}>
                <option value="">Select Day</option>
                {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>

              <select className="w-full rounded border p-3 text-sm" value={form.period_no} onChange={setField("period_no")}>
                <option value="">Select Period</option>
                {PERIODS.map((period) => <option key={period} value={String(period)}>Period {period}</option>)}
              </select>

              <input className="w-full rounded border p-3 text-sm" type="time" value={form.start_time} onChange={setField("start_time")} />

              <input className="w-full rounded border p-3 text-sm" type="time" value={form.end_time} onChange={setField("end_time")} />

              <select className="w-full rounded border p-3 text-sm md:col-span-2" value={form.subject_id} onChange={setField("subject_id")}>
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.class_name} - {subject.subject_name}</option>
                ))}
              </select>

              <select className="w-full rounded border p-3 text-sm md:col-span-2" value={form.teacher_id} onChange={setField("teacher_id")}>
                <option value="">Select Teacher</option>
                {teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                ))}
              </select>
            </div>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

            <div className="mt-5 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={handleSave}>
                {editing ? "Update" : "Save"}
              </button>
              <button className="rounded bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300" onClick={() => {
                setModal(false)
                setEditing(null)
                setForm({ ...emptyForm, school_id: schoolId ? String(schoolId) : "" })
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
