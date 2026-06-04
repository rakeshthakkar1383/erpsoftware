"use client"

import { useState, useCallback } from "react"
import { createUser, deleteUser } from "./actions"

const roles = [
  { id: "authority", label: "Authority", desc: "Full Access across all schools" },
  { id: "principal", label: "Principal", desc: "School-wide Management" },
  { id: "supervision", label: "Supervision", desc: "Department/Level Monitoring" },
  { id: "clerk", label: "Clerk", desc: "School-wide Data Entry & Fees" },
  { id: "teacher", label: "Teacher", desc: "Class-wise Access" },
  { id: "student", label: "Student", desc: "Personal Data Only" },
]

const emptyForm = { email: "", password: "", full_name: "", role: "authority", school_id: "", teacher_id: "", student_id: "", class_name: "", can_see_all_data: "false" }

export default function ManageUsersClient({ initialUsers, allSchools, teachers, students }: { initialUsers: any[], allSchools: any[], teachers: any[], students: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [activeRole, setActiveRole] = useState("authority")
  const [form, setForm] = useState({ ...emptyForm, role: "authority" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const refresh = async () => {
    // In a real app we'd call getAllUsers again, but for now we'll rely on the server action revalidate
    window.location.reload()
  }

  const handleRoleChange = (roleId: string) => {
    setActiveRole(roleId)
    setForm({ ...emptyForm, role: roleId, can_see_all_data: roleId === "authority" ? "true" : "false" })
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) { setMessage("Email, Password and Name are required"); return }
    setLoading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    const res = await createUser(fd)
    setMessage(res.message)
    setLoading(false)
    if (res.success) {
      setForm({ ...emptyForm, role: activeRole })
      refresh()
    }
  }

  const handleDelete = async (id: number, email: string) => {
    if (!window.confirm(`Delete user ${email}?`)) return
    const res = await deleteUser(id, email)
    alert(res.message)
    refresh()
  }

  const filteredUsers = users.filter(u => u.role === activeRole)

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden rounded-xl border bg-white shadow-lg">
      {/* Left Panel: Role Selection */}
      <div className="w-72 border-r bg-slate-50 p-6">
        <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400">User Roles</h3>
        <div className="space-y-2">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.id)}
              className={`w-full rounded-lg px-4 py-3 text-left transition-all ${activeRole === r.id ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200" : "bg-white text-slate-600 hover:bg-slate-100 border"}`}
            >
              <p className="text-sm font-bold">{r.label}</p>
              <p className={`text-[10px] ${activeRole === r.id ? "text-blue-100" : "text-slate-400"}`}>{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Creation Form & List */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Manage {activeRole}s</h2>
            <p className="text-sm text-slate-500">Create and monitor login access for {activeRole} accounts.</p>
          </div>
          {message && <p className={`rounded px-4 py-2 text-xs font-bold uppercase ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{message}</p>}
        </div>

        {/* User Creation Form */}
        <div className="mb-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6">
          <h4 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400">Create New {activeRole} Account</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
              <input className="w-full rounded border bg-white p-3 text-sm" placeholder="NAME" value={form.full_name} onChange={set("full_name")} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
              <input className="w-full rounded border bg-white p-3 text-sm" placeholder="EMAIL" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
              <input className="w-full rounded border bg-white p-3 text-sm" placeholder="PASSWORD" type="password" value={form.password} onChange={set("password")} />
            </div>

            {/* Dynamic Fields based on Role */}
            {(activeRole === "principal" || activeRole === "supervision" || activeRole === "clerk" || activeRole === "teacher") && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assign School</label>
                <select className="w-full rounded border bg-white p-3 text-sm" value={form.school_id} onChange={set("school_id")}>
                  <option value="">SELECT SCHOOL</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              </div>
            )}

            {activeRole === "teacher" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Link Teacher Profile</label>
                  <select className="w-full rounded border bg-white p-3 text-sm" value={form.teacher_id} onChange={set("teacher_id")}>
                    <option value="">SELECT TEACHER</option>
                    {teachers.filter((t: any) => !form.school_id || String(t.school_id) === form.school_id).map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Class Restriction</label>
                  <input className="w-full rounded border bg-white p-3 text-sm uppercase" placeholder="e.g. 5,6,10" value={form.class_name} onChange={set("class_name")} />
                </div>
              </>
            )}

            {activeRole === "student" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Link Student Profile</label>
                <select className="w-full rounded border bg-white p-3 text-sm" value={form.student_id} onChange={set("student_id")}>
                  <option value="">SELECT STUDENT</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} (GR: {s.gr_no})</option>)}
                </select>
              </div>
            )}

            {/* Visibility Choice */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Data Visibility</label>
              <select className="w-full rounded border bg-white p-3 text-sm" value={form.can_see_all_data} onChange={set("can_see_all_data")}>
                <option value="false">Restricted to Scope</option>
                <option value="true">See All Data (Global)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-blue-700 disabled:bg-slate-400"
              >
                {loading ? "Creating..." : `Create ${activeRole}`}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Users Table */}
        <div className="flex-1">
           <h4 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400">Current {activeRole}s</h4>
           <div className="rounded-xl border overflow-hidden">
             <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
               <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Linked Entity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 bg-white">
                 {filteredUsers.length === 0 ? (
                   <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No {activeRole} users found.</td></tr>
                 ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                         <td className="px-6 py-4 font-bold text-slate-800">{u.full_name}</td>
                         <td className="px-6 py-4 text-slate-600">{u.email}</td>
                         <td className="px-6 py-4">
                            {u.teachers?.full_name ? <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 uppercase">TEACHER: {u.teachers.full_name}</span> : 
                             u.students?.full_name ? <span className="rounded bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 uppercase">STUDENT: {u.students.full_name}</span> : 
                             u.school_info?.school_name ? <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">{u.school_info.school_name}</span> : "-"}
                         </td>
                         <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleDelete(u.id, u.email)} className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800">Delete Access</button>
                         </td>
                      </tr>
                    ))
                 )}
               </tbody>
             </table>
           </div>
         </div>
       </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">User Details</h3>
              <button className="text-slate-400 hover:text-slate-600 text-xl" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Full Name</span>
                <span className="text-slate-800 font-semibold">{selectedUser.full_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Email</span>
                <span className="text-slate-800">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Role</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">School</span>
                <span className="text-slate-800">{selectedUser.school_info?.school_name || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Linked Teacher</span>
                <span className="text-slate-800">{selectedUser.teachers?.full_name || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Linked Student</span>
                <span className="text-slate-800">{selectedUser.students?.full_name || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Class Restriction</span>
                <span className="text-slate-800">{selectedUser.class_name || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Data Visibility</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${selectedUser.can_see_all_data ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                  {selectedUser.can_see_all_data ? "Global Access" : "Restricted"}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { handleDelete(selectedUser.id, selectedUser.email); setSelectedUser(null) }}
                className="rounded bg-red-600 px-5 py-2 text-xs font-black text-white uppercase tracking-wider hover:bg-red-700"
              >
                Delete User
              </button>
              <button onClick={() => setSelectedUser(null)} className="rounded bg-slate-200 px-5 py-2 text-xs font-black text-slate-600 uppercase tracking-wider hover:bg-slate-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
     </div>
   )
 }
