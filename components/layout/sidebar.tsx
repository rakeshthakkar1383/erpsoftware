"use client"

import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, CalendarCheck,
  FileCheck, BookOpen, School, ListOrdered, Layers, GitBranch,
  UserCheck, Settings, FileText, LogOut, ClipboardList, ChevronDown
} from "lucide-react"

const adminTabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "Students", icon: Users },
  { key: "teachers", label: "Teachers", icon: GraduationCap },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "fee-particulars", label: "Fee Particulars", icon: ListOrdered },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "exams", label: "Exams", icon: FileCheck },
  { key: "marks", label: "Marks", icon: BookOpen },
  { key: "dynamic-form", label: "Dynamic Form", icon: ClipboardList },
  { key: "academic-years", label: "Academic Years", icon: Layers },
  { key: "divisions", label: "Divisions", icon: GitBranch },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "streams", label: "Streams", icon: GitBranch },
  { key: "teacher-subjects", label: "Teacher Subjects", icon: UserCheck },
  { key: "school-info", label: "School Info", icon: School },
  { key: "manage-schools", label: "All Schools", icon: Settings },
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
}

export default function Sidebar({ user, schoolName, schoolLogo, schools = [], teacherClass, activeTab, onTabChange, onLogout, onSchoolSwitch }: SidebarProps) {
  const role = user?.user_metadata?.role || user?.role
  const tabs = role === "admin" ? adminTabs : teacherTabs
  const [showSchools, setShowSchools] = useState(false)
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
