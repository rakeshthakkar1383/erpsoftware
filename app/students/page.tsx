import { createClient } from "@/lib/supabase/server"
import StudentsClient from "./students-client"
import { getAllStudents, getStudentsGrouped } from "./actions"
import { getAllDivisions } from "../divisions/actions"
import { getAllStreams } from "../streams/actions"
import { getAllAcademicYears } from "../academic-years/actions"

export const dynamic = "force-dynamic"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  let supabase: any
  let user: any = null
  let schoolId: number | null = null

  try {
    supabase = await createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u
    schoolId = user?.user_metadata?.school_id || null
  } catch (e: any) {
    console.error("AUTH ERROR:", e?.message || e)
    return <div className="p-8 text-center text-red-600">Authentication error. Please log in again.</div>
  }

  const params = await searchParams
  const page = parseInt(String(params.page || "1"))
  const pageSize = parseInt(String(params.pageSize || "25"))
  const viewMode = String(params.viewMode || "list")
  const groupByStr = String(params.groupBy || "")
  const groupBy = (groupByStr === "school_id" || groupByStr === "class_name") ? groupByStr : undefined
  const filterClass = String(params.filterClass || "")
  const filterDiv = String(params.filterDiv || "")
  const filterStream = String(params.filterStream || "")
  const filterSchool = String(params.filterSchool || (schoolId ? String(schoolId) : ""))
  const search = String(params.search || "")
  const filterNotPaid = params.filterNotPaid === "1"

  const filters: Record<string, any> = {}
  if (filterSchool) filters.school_id = Number(filterSchool)
  if (filterClass) filters.class_name = filterClass
  if (filterDiv) filters.division = filterDiv
  if (filterStream) filters.stream = filterStream
  if (search) filters.search = search
  if (filterNotPaid) filters.not_paid = true

  let years: any[] = []
  try { years = await getAllAcademicYears() } catch (e: any) { console.error("ACADEMIC_YEARS ERROR:", e?.message || e) }

  let studentsResult = { data: [] as any[], total: 0, totalPages: 0 }
  let divisions: any[] = []
  let streams: any[] = []

  try {
    if (viewMode === "list") {
      studentsResult = await getAllStudents(page, pageSize, filters)
    }
  } catch (e: any) { console.error("STUDENTS QUERY ERROR:", e?.message || e) }

  try {
    divisions = await getAllDivisions()
  } catch (e: any) { console.error("DIVISIONS QUERY ERROR:", e?.message || e) }

  try {
    streams = await getAllStreams()
  } catch (e: any) { console.error("STREAMS QUERY ERROR:", e?.message || e) }

  let groupedStudents: Record<string, any[]> = {}
  if (viewMode === "school" || viewMode === "class") {
    try {
      groupedStudents = await getStudentsGrouped(groupBy || (viewMode === "school" ? "school_id" : "class_name"), filters)
    } catch (e: any) { console.error("GROUPED QUERY ERROR:", e?.message || e) }
  }

  const totalStudents = viewMode === "list" ? studentsResult.total : Object.values(groupedStudents).reduce((sum, arr) => sum + arr.length, 0)

  let allSchools: any[] = []
  try {
    const { data, error } = await supabase.from("school_info").select("id, school_name, logo_url")
    if (error) console.error("SCHOOL_INFO ERROR:", JSON.stringify(error))
    allSchools = data || []
  } catch (e: any) { console.error("SCHOOL_INFO QUERY ERROR:", e?.message || e) }

  let schoolName = ""
  let schoolLogo = ""
  if (schoolId) {
    const school = allSchools.find((s: any) => s.id === schoolId)
    schoolName = school?.school_name || ""
    schoolLogo = school?.logo_url || ""
  }

  const teacherClass = user?.user_metadata?.class_name || ""

  return (
    <StudentsClient
      students={studentsResult.data}
      groupedStudents={groupedStudents}
      totalStudents={totalStudents}
      totalPages={studentsResult.totalPages}
      currentPage={page}
      pageSize={pageSize}
      viewMode={viewMode as "list" | "school" | "class" | "duplicates"}
      groupBy={groupBy || undefined}
      filters={filters}
      divisions={divisions}
      streams={streams}
      allSchools={allSchools}
      teacherClass={teacherClass}
      schoolId={schoolId}
      schoolName={schoolName}
      schoolLogo={schoolLogo}
      years={years}
    />
  )
}
