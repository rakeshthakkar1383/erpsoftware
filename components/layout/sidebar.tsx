"use client"

import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, CalendarCheck,
  FileCheck, BookOpen, ListOrdered, GitBranch,
  UserCheck, FileText, LogOut, ChevronDown, Plus, Building2, ArrowRightLeft
} from "lucide-react"
import { addSchool } from "@/app/manage-schools/actions"

const adminTabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "trust-info", label: "Trust Info", icon: Building2 },
  { key: "manage-schools", label: "All Schools", icon: FileText },
  { key: "teachers", label: "Teacher Entry", icon: GraduationCap },
  { key: "students", label: "Students Entry", icon: Users },
  { key: "student-migration", label: "Student Migration", icon: ArrowRightLeft },
  { key: "fee-types", label: "Fee Types", icon: ListOrdered },
  { key: "fee-particulars", label: "Fees Particular", icon: ListOrdered },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "exams", label: "Exams", icon: FileCheck },
  { key: "marks", label: "Marks", icon: BookOpen },
  { key: "divisions", label: "Divisions", icon: GitBranch },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "streams", label: "Streams", icon: GitBranch },
  { key: "manage-users", label: "User Management", icon: UserCheck },
  { key: "teacher-subjects", label: "Teacher Subjects", icon: UserCheck },
]

const teacherTabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "Students", icon: Users },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "exams", label: "Exams", icon: FileCheck },
  { key: "marks", label: "Marks", icon: BookOpen },
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
  const tabs = role === "admin" ? adminTabs : teacherTabs
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
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-slate-800 text-slate-100">
      <div className="relative shrink-0 border-b border-slate-700 px-5 py-5" ref={dropdownRef}>
        <div
          className={`flex items-center gap-3 mb-3 ${schools.length > 0 ? "cursor-pointer" : ""}`}
          onClick={() => schools.length > 0 && setShowSchools(!showSchools)}
        >
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-10 w-10 rounded-lg border border-slate-600 object-contain bg-white shadow-sm" />
          ) : (
            <div className="h-10 w-10 rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center font-bold text-slate-400">
              ERP
            </div>
          )}
          <h1 className="text-sm font-bold tracking-tight leading-tight flex-1">
            {schoolName ? schoolName : "SCHOOL ERP"}
          </h1>
          {schools.length > 0 && (
            <ChevronDown className={`h-3 w-3 text-slate-400 transition ${showSchools ? "rotate-180" : ""}`} />
          )}
        </div>

        {showSchools && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-slate-600 bg-slate-700 shadow-xl max-h-48 overflow-y-auto">
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSchoolSelect(s.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                  s.id === user?.user_metadata?.school_id
                    ? "bg-slate-600 text-white"
                    : "text-slate-200 hover:bg-slate-600/50"
                }`}
              >
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" className="h-6 w-6 rounded object-contain bg-white" />
                ) : (
                  <div className="h-6 w-6 rounded bg-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400">
                    E
                  </div>
                )}
                <span className="truncate">{s.school_name || "Unnamed School"}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-300 truncate uppercase">
            {user?.user_metadata?.full_name || "User"}
          </p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">
            {role} {teacherClass || user?.user_metadata?.class_name ? `| CLASS ${teacherClass || user?.user_metadata?.class_name}` : ""}
          </p>
        </div>
      </div>
      {role === "admin" && (
        <div className="border-b border-slate-700">
          <button
            onClick={() => setShowSchoolManager(!showSchoolManager)}
            className="flex w-full items-center justify-between px-5 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition hover:bg-slate-700/50 hover:text-white"
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
                className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="TRUST NAME"
                value={newSchoolForm.trust_name}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, trust_name: e.target.value.toUpperCase() }))}
                className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="PHONE"
                value={newSchoolForm.phone}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-xs text-white placeholder:text-slate-400"
              />
              <input
                placeholder="ADDRESS"
                value={newSchoolForm.address}
                onChange={e => setNewSchoolForm(prev => ({ ...prev, address: e.target.value.toUpperCase() }))}
                className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-xs text-white placeholder:text-slate-400"
              />
              <button
                onClick={handleAddSchool}
                disabled={addingSchool || !newSchoolForm.school_name}
                className="w-full rounded bg-blue-600 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {addingSchool ? "ADDING..." : "ADD SCHOOL"}
              </button>
              {schoolMsg && <p className="text-[10px] text-blue-300">{schoolMsg}</p>}
            </div>
          )}
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-3 rounded px-4 py-2.5 text-left text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-slate-700 px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
