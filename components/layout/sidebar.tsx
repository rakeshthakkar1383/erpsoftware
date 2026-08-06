"use client"

import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, CalendarCheck,
  BookOpen, ListOrdered, GitBranch,
  UserCheck, FileText, LogOut, ChevronDown, Plus, Building2, Calendar, Award, Clock, FileInput, DoorOpen, BadgeCheck
} from "lucide-react"
import { addSchool } from "@/app/manage-schools/actions"
import { roleDefaults } from "@/lib/permissions"

const allTabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "admission", label: "Admission Entry", icon: DoorOpen },
  { key: "trust-info", label: "Trust Info", icon: Building2 },
  { key: "manage-schools", label: "All Schools", icon: FileText },
  { key: "teachers", label: "Teacher Entry", icon: GraduationCap },
  { key: "teacher-subjects", label: "Teacher Subjects", icon: UserCheck },
  { key: "students", label: "Students Entry", icon: Users },
  { key: "divisions", label: "Divisions", icon: GitBranch },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "streams", label: "Streams", icon: GitBranch },
  { key: "fee-types", label: "Fee Types & Heads", icon: ListOrdered },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "marksheet", label: "Marksheet", icon: Award },
  { key: "leave-types", label: "Leave Type", icon: Clock },
  { key: "leaves", label: "Leave Management", icon: FileInput },
  { key: "leaves/student", label: "Student Leave", icon: FileInput },
  { key: "leaves/teacher", label: "Teacher Leave", icon: FileInput },
  { key: "academic-years", label: "Academic Years", icon: Calendar },
  { key: "manage-users", label: "User Management", icon: UserCheck },
  { key: "student-gatepass", label: "Student Gatepass", icon: BadgeCheck },
  { key: "staff-gatepass", label: "Staff Gatepass", icon: BadgeCheck },
]

type School = {
  id: number
  school_name: string | null
  logo_url: string | null
}

type SidebarProps = {
  user: any
  schoolName: string
  schoolLogo?: string
  schools?: School[]
  teacherClass: string
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  onSchoolSwitch?: (schoolId: number) => void
  onSchoolAdded?: () => void
}

export default function Sidebar({ user, schoolName, schoolLogo, schools = [], teacherClass, activeTab, onTabChange, onLogout, onSchoolSwitch, onSchoolAdded }: SidebarProps) {
  const role = user?.user_metadata?.role || user?.role
  const allowedKeys: string[] = user?.user_metadata?.permissions || roleDefaults[role] || roleDefaults.teacher
  const tabs = allTabs.filter(t => allowedKeys.includes(t.key))
  const [showSchools, setShowSchools] = useState(false)
  const [showSchoolManager, setShowSchoolManager] = useState(false)
  const [newSchoolForm, setNewSchoolForm] = useState({ school_name: "", trust_name: "", phone: "", address: "" })
  const [schoolMsg, setSchoolMsg] = useState("")
  const [addingSchool, setAddingSchool] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSchools(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSchoolSelect = (schoolId: number) => {
    setShowSchools(false)
    if (onSchoolSwitch && schoolId !== user?.user_metadata?.school_id) {
      onSchoolSwitch(schoolId)
    }
  }

  const handleAddSchool = async () => {
    if (!newSchoolForm.school_name) return
    setAddingSchool(true)
    setSchoolMsg("")
    const fd = new FormData()
    fd.append("school_name", newSchoolForm.school_name)
    fd.append("trust_name", newSchoolForm.trust_name)
    fd.append("phone", newSchoolForm.phone)
    fd.append("address", newSchoolForm.address)
    const result = await addSchool(fd)
    setSchoolMsg(result.message)
    if (result.success) {
      setNewSchoolForm({ school_name: "", trust_name: "", phone: "", address: "" })
      onSchoolAdded?.()
    }
    setAddingSchool(false)
  }

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      <div className="relative shrink-0 border-b border-slate-700/80 px-5 py-5" ref={dropdownRef}>
        <div
          className={`mb-4 flex items-center gap-3 ${schools.length > 0 ? "cursor-pointer" : ""}`}
          onClick={() => schools.length > 0 && setShowSchools(!showSchools)}
        >
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-12 w-12 rounded-xl border border-slate-600 bg-white object-contain p-1 shadow-sm" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 text-sm font-black text-blue-200">
              ERP
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black tracking-tight text-white">
              {schoolName ? schoolName : "SCHOOL ERP"}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Smart management</p>
          </div>
          {schools.length > 0 && (
            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${showSchools ? "rotate-180" : ""}`} />
          )}
        </div>

        {showSchools && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-600 bg-slate-800/95 p-1 shadow-2xl backdrop-blur">
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSchoolSelect(s.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  s.id === user?.user_metadata?.school_id
                    ? "bg-blue-600/90 text-white"
                    : "text-slate-200 hover:bg-slate-700/80"
                }`}
              >
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" className="h-7 w-7 rounded-md bg-white object-contain p-0.5" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 text-[8px] font-bold text-slate-400">
                    E
                  </div>
                )}
                <span className="truncate">{s.school_name || "Unnamed School"}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-0.5">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
            {user?.user_metadata?.full_name || "User"}
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
            {role}
            {teacherClass || user?.user_metadata?.class_name ? ` | CLASS ${teacherClass || user?.user_metadata?.class_name}` : ""}
          </p>
        </div>
      </div>
      {['admin', 'authority', 'principal', 'clerk'].includes(role) && (
        <div className="border-b border-slate-700/80">
          <button
            onClick={() => setShowSchoolManager(!showSchoolManager)}
            className="flex w-full items-center justify-between px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
          >
            <span>Add School</span>
            <Plus className={`h-3.5 w-3.5 transition ${showSchoolManager ? "rotate-45" : ""}`} />
          </button>
          {showSchoolManager && (
            <div className="space-y-2 px-4 pb-4">
              <input
                placeholder="SCHOOL NAME"
                value={newSchoolForm.school_name}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, school_name: e.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 p-2.5 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="TRUST NAME"
                value={newSchoolForm.trust_name}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, trust_name: e.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 p-2.5 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="PHONE"
                value={newSchoolForm.phone}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 p-2.5 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="ADDRESS"
                value={newSchoolForm.address}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, address: e.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 p-2.5 text-xs text-white placeholder:text-slate-400"
              />
              <button
                onClick={handleAddSchool}
                disabled={addingSchool || !newSchoolForm.school_name}
                className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {addingSchool ? "ADDING..." : "ADD SCHOOL"}
              </button>
              {schoolMsg && <p className="text-[10px] text-blue-300">{schoolMsg}</p>}
            </div>
          )}
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-slate-700/80 px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-700/60 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
