"use client"

import { useState, useEffect } from "react"
import { getAllLeaves, addLeave, getAllStudents, getAllLeaveTypes, getAllSchools, getAllTrusts } from "../actions"

export default function StudentLeavePage() {
  const [students, setStudents] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [trusts, setTrusts] = useState<any[]>([])
  const [myLeaves, setMyLeaves] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ applicant_id: "", leave_type_id: "", from_date: "", to_date: "", days: "1", reason: "", school_id: "", trust_id: "" })
  const [message, setMessage] = useState("")

  useEffect(() => {
    getAllStudents().then(setStudents)
    getAllLeaveTypes().then(setLeaveTypes)
    getAllSchools().then(setSchools)
    getAllTrusts().then(setTrusts)
    refreshLeaves()
  }, [])

  const refreshLeaves = async () => {
    const all = await getAllLeaves()
    setMyLeaves(all.filter((l: any) => l.applicant_type === "student"))
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async () => {
    if (!form.applicant_id || !form.leave_type_id || !form.from_date || !form.to_date) { setMessage("All fields required"); return }
    const fd = new FormData()
    Object.entries({ ...form, applicant_type: "student" }).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    const res = await addLeave(fd)
    if (!res.success) { setMessage(res.message); return }
    setShowForm(false)
    setForm({ applicant_id: "", leave_type_id: "", from_date: "", to_date: "", days: "1", reason: "", school_id: "", trust_id: "" })
    refreshLeaves()
  }

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700", Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700", Cancelled: "bg-slate-100 text-slate-500",
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Student Leave Form</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={() => { setShowForm(true); setMessage("") }}>Apply Leave</button>
      </div>
      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}

      {showForm && (
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">New Leave Application</h3>
          <div className="grid gap-3 max-w-md">
            <select className="rounded border p-3 text-sm" value={form.school_id} onChange={set("school_id")}>
              <option value="">Select School *</option>
              {schools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
            </select>
            <select className="rounded border p-3 text-sm" value={form.trust_id} onChange={set("trust_id")}>
              <option value="">Select Trust</option>
              {trusts.map((t: any) => <option key={t.id} value={t.id}>{t.trust_name}</option>)}
            </select>
            <select className="rounded border p-3 text-sm" value={form.applicant_id} onChange={set("applicant_id")}>
              <option value="">Select Student *</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>)}
            </select>
            <select className="rounded border p-3 text-sm" value={form.leave_type_id} onChange={set("leave_type_id")}>
              <option value="">Select Leave Type *</option>
              {leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Days</label>
              <input className="w-full rounded border p-3 text-sm" type="number" value={form.days} onChange={set("days")} />
            </div>
            <textarea className="rounded border p-3 text-sm" placeholder="Reason" value={form.reason} onChange={set("reason")} rows={3} />
            <div className="flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700" onClick={handleSubmit}>Submit</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-400" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {myLeaves.length === 0 ? <p className="text-slate-500">No leave records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">School</th><th className="px-3 py-2">Trust</th><th className="px-3 py-2">Leave Type</th><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Days</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {myLeaves.map((l: any, i: number) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">#{l.applicant_id}</td>
                  <td className="px-3 py-2">{schools.find((s: any) => s.id === l.school_id)?.school_name || "-"}</td>
                  <td className="px-3 py-2">{trusts.find((t: any) => t.id === l.trust_id)?.trust_name || "-"}</td>
                  <td className="px-3 py-2">{leaveTypes.find((lt: any) => lt.id === l.leave_type_id)?.name || "-"}</td>
                  <td className="px-3 py-2">{l.from_date}</td>
                  <td className="px-3 py-2">{l.to_date}</td>
                  <td className="px-3 py-2">{l.days}</td>
                  <td className="px-3 py-2">{l.reason || "-"}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusColors[l.status] || ""}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
