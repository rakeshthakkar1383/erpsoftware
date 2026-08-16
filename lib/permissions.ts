export const userRoleOptions = [
  { id: "authority", label: "Authority" },
  { id: "principal", label: "Principal" },
  { id: "supervision", label: "Supervision" },
  { id: "clerk", label: "Clerk" },
  { id: "teacher", label: "Teacher" },
  { id: "student", label: "Student" },
]

export const allTabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "admission", label: "Admission Entry" },
  { key: "trust-info", label: "Trust Info" },
  { key: "manage-schools", label: "All Schools" },
  { key: "teachers", label: "Teacher Entry" },
  { key: "teacher-subjects", label: "Teacher Subjects" },
  { key: "timetable", label: "Time Table" },
  { key: "students", label: "Students Entry" },
  { key: "divisions", label: "Divisions" },
  { key: "subjects", label: "Subjects" },
  { key: "streams", label: "Streams" },
  { key: "fee-types", label: "Fee Types & Heads" },
  { key: "fees", label: "Fees" },
  { key: "attendance", label: "Attendance" },
  { key: "manage-users", label: "User Management" },
  { key: "marksheet", label: "Marksheet" },
  { key: "leave-types", label: "Leave Type" },
  { key: "leaves", label: "Leave Management" },
  { key: "leaves/student", label: "Student Leave" },
  { key: "leaves/teacher", label: "Teacher Leave" },
  { key: "academic-years", label: "Academic Years" },
  { key: "student-gatepass", label: "Student Gatepass" },
  { key: "staff-gatepass", label: "Staff Gatepass" },
]

export const roleDefaults: Record<string, string[]> = {
  authority: allTabs.map(t => t.key),
  admin: allTabs.map(t => t.key),
  principal: allTabs.map(t => t.key),
  supervision: ["dashboard", "students", "teachers", "subjects", "divisions", "fee-types", "fees", "attendance", "timetable"],
  clerk: allTabs.map(t => t.key),
  teacher: ["dashboard", "students", "fees", "attendance", "leaves/teacher", "timetable"],
  student: ["dashboard", "leaves/student"],
}
