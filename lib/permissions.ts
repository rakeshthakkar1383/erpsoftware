export const allTabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "trust-info", label: "Trust Info" },
  { key: "manage-schools", label: "All Schools" },
  { key: "teachers", label: "Teacher Entry" },
  { key: "teacher-subjects", label: "Teacher Subjects" },
  { key: "students", label: "Students Entry" },
  { key: "divisions", label: "Divisions" },
  { key: "subjects", label: "Subjects" },
  { key: "streams", label: "Streams" },
  { key: "fee-types", label: "Fee Types" },
  { key: "fee-particulars", label: "Fees Particular" },
  { key: "fees", label: "Fees" },
  { key: "attendance", label: "Attendance" },
  { key: "manage-users", label: "User Management" },
]

export const roleDefaults: Record<string, string[]> = {
  authority: allTabs.map(t => t.key),
  admin: allTabs.map(t => t.key),
  principal: allTabs.map(t => t.key),
  supervision: ["dashboard", "students", "teachers", "subjects", "divisions", "fee-types", "fee-particulars", "fees", "attendance"],
  clerk: ["dashboard", "students", "fees", "attendance"],
  teacher: ["dashboard", "students", "fees", "attendance"],
  student: ["dashboard"],
}
