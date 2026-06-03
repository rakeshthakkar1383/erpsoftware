import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const schoolId = user?.user_metadata?.school_id

  let q = supabase.from("students").select("*, school_info!students_school_id_fkey(school_name)")
  if (schoolId) q = q.eq("school_id", schoolId)
  const { data: student, error } = await q.eq("id", id).single()
  if (error || !student) notFound()

  const { data: fees } = await supabase
    .from("fees")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age >= 0 ? `${age} years` : ""
  }

  const schoolName = student.school_info?.school_name || ""

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase">Student Profile</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{schoolName}</p>
        </div>
        <Link href="/students" className="rounded bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">
          &larr; Back to Students
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.full_name} className="mx-auto h-40 w-40 rounded-full border-4 border-blue-100 object-cover" />
            ) : (
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 border-slate-200 bg-slate-100 text-4xl font-bold text-slate-400">
                {student.full_name?.charAt(0) || "?"}
              </div>
            )}
            <h3 className="mt-4 text-xl font-bold text-slate-800">{student.full_name}</h3>
            <p className="text-sm text-slate-500">
              Class {student.class_name}{student.division ? ` - ${student.division}` : ""}
              {student.stream ? ` | ${student.stream}` : ""}
            </p>
            <p className="text-xs text-slate-400">Roll No: {student.roll_no || "-"}</p>
            <p className="text-xs text-slate-400">GR No: {student.gr_no || "-"}</p>
            <p className="text-xs text-slate-400">Admission No: {student.admission_no || "-"}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-700 border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-slate-500">Gender:</span> <span className="text-slate-800">{student.gender || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Date of Birth:</span> <span className="text-slate-800">{student.dob || "-"} ({calculateAge(student.dob)})</span></div>
              <div><span className="font-medium text-slate-500">Father's Name:</span> <span className="text-slate-800">{student.father_name || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Mother's Name:</span> <span className="text-slate-800">{student.mother_name || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Birth Place:</span> <span className="text-slate-800">{student.birthplace || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Mobile:</span> <span className="text-slate-800">{student.mobile || "-"}</span></div>
              <div className="col-span-2"><span className="font-medium text-slate-500">Address:</span> <span className="text-slate-800">{student.address || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Village/City:</span> <span className="text-slate-800">{student.village || "-"}</span></div>
              <div><span className="font-medium text-slate-500">Pincode:</span> <span className="text-slate-800">{student.pincode || "-"}</span></div>
              <div><span className="font-medium text-slate-500">District:</span> <span className="text-slate-800">{student.district || "-"}</span></div>
              <div className="col-span-2"><span className="font-medium text-slate-500">Last School:</span> <span className="text-slate-800">{student.last_school || "-"}</span></div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-700 border-b pb-2">Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              {student.photo_url && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Photo</p>
                  <img src={student.photo_url} alt="" className="h-32 w-32 rounded border object-cover" />
                </div>
              )}
              {student.birth_cert_url && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Birth Certificate</p>
                  <a href={student.birth_cert_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                    View Document
                  </a>
                </div>
              )}
              {student.aadhar_url && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Aadhar Card</p>
                  <a href={student.aadhar_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                    View Document
                  </a>
                </div>
              )}
              {student.father_aadhar_url && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Father's Aadhar</p>
                  <a href={student.father_aadhar_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                    View Document
                  </a>
                </div>
              )}
              {!student.photo_url && !student.birth_cert_url && !student.aadhar_url && !student.father_aadhar_url && (
                <p className="col-span-2 text-sm text-slate-400">No documents uploaded.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <h3 className="border-b px-6 py-4 text-lg font-semibold text-slate-700">Fee History</h3>
            {!fees || fees.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No fee records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Mode</th>
                      <th className="px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {fees.map((f: any, i: number) => (
                      <tr key={f.id}>
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2">{Number(f.amount).toFixed(2)}</td>
                        <td className="px-4 py-2">{f.status}</td>
                        <td className="px-4 py-2">{f.payment_mode || "-"}</td>
                        <td className="px-4 py-2">{f.payment_date || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
