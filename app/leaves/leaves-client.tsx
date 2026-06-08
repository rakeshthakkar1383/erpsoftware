"use client"

import { useState } from "react"
import { getAllLeaves, addLeave, updateLeaveStatus, deleteLeave, getAllStudents, getAllTeachers } from "./actions"
import { formatDate } from "@/lib/utils"

const emptyForm: Record<string, string> = {
  applicant_type: "student", applicant_id: "", leave_type_id: "",
  from_date: "", to_date: "", days: "1", reason: "", school_id: "", trust_id: ""
}

type LeavesClientProps = {
  initialLeaves: any[]
  leaveTypes: any[]
  schools: any[]
  trusts: any[]
  schoolId: number | null
  currentUserRole?: string
  currentUserType?: string | null
  currentUserId?: number | null
}

export default function LeavesClient({ initialLeaves, leaveTypes, schools, trusts, schoolId, currentUserRole, currentUserType, currentUserId }: LeavesClientProps) {
  const isStudent = currentUserRole === "student"
  const isTeacher = currentUserRole === "teacher"
  const isAdmin = !isStudent && !isTeacher
  const [leaves, setLeaves] = useState(initialLeaves)
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const refresh = async () => setLeaves(await getAllLeaves())

  const openModal = () => {
    setEditing(null)
    const prefill = { ...emptyForm }
    if (currentUserType && currentUserId) {
      prefill.applicant_type = currentUserType
      prefill.applicant_id = String(currentUserId)
    }
    setForm(prefill)
    setMessage("")
    setModal(true)
    if (isAdmin) {
      getAllStudents().then(setStudents)
      getAllTeachers().then(setTeachers)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.applicant_id || !form.leave_type_id || !form.from_date || !form.to_date) { setMessage("All fields are required"); return }
    const res = await addLeave(toFD(form))
    if (!res.success) { setMessage(res.message); return }
    setModal(false); refresh()
  }

  const handleStatus = async (id: number, status: string) => {
    const remarks = prompt(`Enter remarks for ${status}:`) || ""
    const res = await updateLeaveStatus(id, status, remarks)
    if (!res.success) { setMessage(res.message); return }
    refresh()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this leave record?")) return
    await deleteLeave(id); refresh()
  }

  const leaveTypeMap: any = {}
  leaveTypes.forEach((lt: any) => { leaveTypeMap[lt.id] = lt })

  const q = search.toLowerCase()
  const filtered = leaves.filter((l: any) => {
    if (filterStatus && l.status !== filterStatus) return false
    if (!q) return true
    return [l.applicant_type, String(l.applicant_id), l.reason, l.status, l.remarks].some((v: any) => v?.toLowerCase().includes(q))
  })

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Cancelled: "bg-slate-100 text-slate-500",
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Leave Applications</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openModal}>Apply Leave</button>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      {filtered.length === 0 ? <p>No leave records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Trust</th>
                <th className="px-3 py-2">Leave Type</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Days</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((l: any, i: number) => {
                const lt = leaveTypeMap[l.leave_type_id]
                return (
                  <tr key={l.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${l.applicant_type === "student" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {l.applicant_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">#{l.applicant_id}</td>
                    <td className="px-3 py-2">{schools.find((s: any) => s.id === l.school_id)?.school_name || "-"}</td>
                    <td className="px-3 py-2">{trusts.find((t: any) => t.id === l.trust_id)?.trust_name || "-"}</td>
                    <td className="px-3 py-2">{lt?.name || "-"}</td>
                    <td className="px-3 py-2">{formatDate(l.from_date)}</td>
                    <td className="px-3 py-2">{formatDate(l.to_date)}</td>
                    <td className="px-3 py-2">{l.days}</td>
                    <td className="max-w-[200px] truncate px-3 py-2">{l.reason || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusColors[l.status] || "bg-slate-100 text-slate-600"}`}>{l.status}</span>
                    </td>
                    <td className="flex gap-2 px-3 py-2">
                      {isAdmin && l.status === "Pending" && (
                        <>
                          <button className="text-green-600 hover:underline" onClick={() => handleStatus(l.id, "Approved")}>Approve</button>
                          <button className="text-red-600 hover:underline" onClick={() => handleStatus(l.id, "Rejected")}>Reject</button>
                        </>
                      )}
                      {isAdmin && <button className="text-slate-500 hover:underline" onClick={() => handleDelete(l.id)}>Delete</button>}
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
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Apply Leave</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.school_id || ""} onChange={e => setForm({...form, school_id: e.target.value})}>
                <option value="">SELECT SCHOOL *</option>
                {schools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.trust_id || ""} onChange={e => setForm({...form, trust_id: e.target.value})}>
                <option value="">SELECT TRUST</option>
                {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
              </select>
              {isAdmin && (
                <select className="w-full rounded border p-3 text-sm" value={form.applicant_type} onChange={e => setForm({...form, applicant_type: e.target.value, applicant_id: "" })}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              )}
              {isAdmin ? (
                <select className="w-full rounded border p-3 text-sm" value={form.applicant_id} onChange={set("applicant_id")}>
                  <option value="">Select {form.applicant_type} *</option>
                  {(form.applicant_type === "student" ? students : teachers).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.full_name}{a.class_name ? ` (${a.class_name})` : ""}</option>
                  ))}
                </select>
              ) : (
                <p className="rounded bg-slate-50 p-3 text-sm font-medium">{currentUserType === "student" ? "Student" : "Teacher"} (ID: {currentUserId})</p>
              )}
              <select className="w-full rounded border p-3 text-sm" value={form.leave_type_id} onChange={set("leave_type_id")}>
                <option value="">Select Leave Type *</option>
                {leaveTypes.map((lt: any) => (
                  <option key={lt.id} value={lt.id}>{lt.name} {lt.max_days ? `(Max ${lt.max_days} days)` : ""}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">From Date *</label>
                  <input className="w-full rounded border p-3 text-sm" type="date" value={form.from_date} onChange={set("from_date")} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">To Date *</label>
                  <input className="w-full rounded border p-3 text-sm" type="date" value={form.to_date} onChange={set("to_date")} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Number of Days</label>
                <input className="w-full rounded border p-3 text-sm" type="number" value={form.days} onChange={set("days")} />
              </div>
              <textarea className="w-full rounded border p-3 text-sm" placeholder="Reason for leave" value={form.reason} onChange={set("reason")} rows={3} />
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>Submit</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
