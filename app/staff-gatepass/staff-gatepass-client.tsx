"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { addStaffGatepass, updateStaffGatepass, deleteStaffGatepass, uploadPhoto } from "./actions"

type Teacher = {
  id: number
  full_name: string | null
  subject: string | null
  mobile: string | null
  photo_url: string | null
  designation: string | null
  staff_code: string | null
}

type School = {
  id: number
  school_name: string | null
  logo_url: string | null
  address?: string | null
}

type GatepassRecord = {
  id: number
  school_id: number | null
  teacher_id: number | null
  out_time: string
  in_time: string | null
  reason: string | null
  permission_given_by: string | null
  permission_signature: string | null
  staff_signature: string | null
  status: string | null
  created_at: string | null
  teachers?: Teacher | null
}

type Props = {
  initialData: GatepassRecord[]
  allSchools: School[]
  teachers: Teacher[]
  schoolId: number | undefined
  currentSchool: School | null
}

export default function StaffGatepassClient({ initialData, allSchools, teachers, schoolId, currentSchool }: Props) {
  const supabase = createClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolId || allSchools[0]?.id || 0)
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("")
  const [outTime, setOutTime] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [inTime, setInTime] = useState("")
  const [reason, setReason] = useState("")
  const [permissionGivenBy, setPermissionGivenBy] = useState("")
  const [permissionSignature, setPermissionSignature] = useState("")
  const [staffSignature, setStaffSignature] = useState("")
  const [gatepassStatus, setGatepassStatus] = useState("Active")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")
  const [gatepasses, setGatepasses] = useState(initialData)
  const [pdfPreview, setPdfPreview] = useState<GatepassRecord | null>(null)
  const [capturing, setCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captureTarget, setCaptureTarget] = useState<"permissionSig" | "staffSig" | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [filterStatus, setFilterStatus] = useState("")

  const selectedSchool = allSchools.find(s => s.id === selectedSchoolId)
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)

  const persistSelectedSchool = (sid: number) => {
    setSelectedSchoolId(sid)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("staff-gatepass-selected-school-id", String(sid))
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("staff-gatepass-selected-school-id")
    if (stored) {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed) && allSchools.some(s => s.id === parsed)) {
        setSelectedSchoolId(parsed)
        return
      }
    }
    if (schoolId) setSelectedSchoolId(schoolId)
    else if (allSchools.length > 0 && !selectedSchoolId) setSelectedSchoolId(allSchools[0].id)
  }, [schoolId, allSchools])

  useEffect(() => {
    if (typeof window !== "undefined" && selectedSchoolId) {
      window.localStorage.setItem("staff-gatepass-selected-school-id", String(selectedSchoolId))
    }
  }, [selectedSchoolId])

  const startCamera = async (target: "permissionSig" | "staffSig") => {
    setCaptureTarget(target)
    setCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setMsg("Camera access denied")
      setCapturing(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !captureTarget) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/png")
    if (captureTarget === "permissionSig") setPermissionSignature(dataUrl)
    else setStaffSignature(dataUrl)
    stopCamera()
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCapturing(false)
    setCaptureTarget(null)
  }

  const handleSubmit = async () => {
    if (!selectedTeacherId || !outTime) {
      setMsg("Please select a staff member and set out time")
      return
    }
    setSubmitting(true)
    setMsg("")

    const fd = new FormData()
    fd.append("school_id", String(selectedSchoolId))
    fd.append("teacher_id", String(selectedTeacherId))
    fd.append("out_time", outTime)
    fd.append("in_time", inTime)
    fd.append("reason", reason)
    fd.append("permission_given_by", permissionGivenBy)
    fd.append("permission_signature", permissionSignature)
    fd.append("staff_signature", staffSignature)
    fd.append("status", gatepassStatus)

    let result
    if (editingId) {
      result = await updateStaffGatepass(editingId, fd)
    } else {
      result = await addStaffGatepass(fd)
    }

    setMsg(result.message)
    if (result.success) {
      resetForm()
      setEditingId(null)
      const { data: fresh } = await supabase
        .from("staff_gatepass")
        .select("*, teachers(full_name, subject, mobile, photo_url, designation, staff_code)")
        .order("created_at", { ascending: false })
      if (fresh) setGatepasses(fresh)
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setSelectedTeacherId("")
    const now = new Date()
    setOutTime(now.toISOString().slice(0, 16))
    setInTime("")
    setReason("")
    setPermissionGivenBy("")
    setPermissionSignature("")
    setStaffSignature("")
    setGatepassStatus("Active")
    setEditingId(null)
  }

  const handleEdit = (gp: GatepassRecord) => {
    setEditingId(gp.id)
    if (gp.school_id) persistSelectedSchool(gp.school_id)
    setSelectedTeacherId(gp.teacher_id || "")
    setOutTime(gp.out_time)
    setInTime(gp.in_time || "")
    setReason(gp.reason || "")
    setPermissionGivenBy(gp.permission_given_by || "")
    setPermissionSignature(gp.permission_signature || "")
    setStaffSignature(gp.staff_signature || "")
    setGatepassStatus(gp.status || "Active")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleMarkReturned = async (gp: GatepassRecord) => {
    const fd = new FormData()
    fd.append("in_time", new Date().toISOString().slice(0, 16))
    fd.append("status", "Returned")
    const result = await updateStaffGatepass(gp.id, fd)
    setMsg(result.message)
    if (result.success) {
      const { data: fresh } = await supabase
        .from("staff_gatepass")
        .select("*, teachers(full_name, subject, mobile, photo_url, designation, staff_code)")
        .order("created_at", { ascending: false })
      if (fresh) setGatepasses(fresh)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gatepass?")) return
    const result = await deleteStaffGatepass(id)
    setMsg(result.message)
    if (result.success) {
      setGatepasses(prev => prev.filter(g => g.id !== id))
    }
  }

  const handlePdfPreview = (gp: GatepassRecord) => {
    setPdfPreview(gp)
  }

  const handlePrintPdf = () => {
    setTimeout(() => { window.print() }, 200)
  }

  const filteredGatepasses = gatepasses.filter(gp => {
    if (filterDate && !gp.out_time.startsWith(filterDate)) return false
    if (filterStatus && gp.status !== filterStatus) return false
    return true
  })

  const selectedSchoolForDisplay = selectedSchool || currentSchool || null

  const formatDateTime = (dt: string | null | undefined) => {
    if (!dt) return "—"
    try {
      const d = new Date(dt)
      return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch {
      return dt
    }
  }

  return (
    <div className="p-6">
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .pdf-page { display: block !important; }
        }
        .pdf-page { display: none; }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Gatepass</h1>
      </div>

      {msg && (
        <div className="no-print mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
          {msg}
        </div>
      )}

      {capturing && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-xl bg-white p-4 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="mb-3 h-64 w-full rounded-lg bg-black object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700">Capture</button>
              <button onClick={stopCamera} className="rounded-lg bg-slate-600 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            {editingId ? "Edit Gatepass" : "New Gatepass"}
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">School</label>
            <select value={selectedSchoolId} onChange={e => persistSelectedSchool(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm">
              {allSchools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Select Staff Member *</label>
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm">
              <option value="">-- Select Staff --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name} {t.designation ? `(${t.designation})` : ""} {t.staff_code ? `- ${t.staff_code}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedTeacher && (
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-slate-50 p-3">
              {selectedTeacher.photo_url ? (
                <img src={selectedTeacher.photo_url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-500">NO PHOTO</div>
              )}
              <div>
                <p className="font-bold text-slate-800">{selectedTeacher.full_name}</p>
                <p className="text-xs text-slate-500">Designation: {selectedTeacher.designation || "—"}</p>
                <p className="text-xs text-slate-500">Subject: {selectedTeacher.subject || "—"}</p>
                <p className="text-xs text-slate-500">Mobile: {selectedTeacher.mobile || "—"}</p>
              </div>
            </div>
          )}

          <div className="mb-4 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Pass Details</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Out Time *</label>
                <input type="datetime-local" value={outTime} onChange={e => setOutTime(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">In Time</label>
                <input type="datetime-local" value={inTime} onChange={e => setInTime(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <select value={gatepassStatus} onChange={e => setGatepassStatus(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                  <option value="Active">Active (Out)</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Permission Given By</label>
                <input value={permissionGivenBy} onChange={e => setPermissionGivenBy(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" placeholder="Name" />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </div>
          </div>

          <div className="mb-4 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Signatures</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Staff Signature</label>
                {staffSignature ? (
                  <div className="relative inline-block">
                    <img src={staffSignature} alt="Staff Signature" className="h-20 rounded-lg border border-slate-200 bg-white object-contain" />
                    <button onClick={() => setStaffSignature("")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => startCamera("staffSig")} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600">Capture Signature</button>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Permission Signature</label>
                {permissionSignature ? (
                  <div className="relative inline-block">
                    <img src={permissionSignature} alt="Permission Signature" className="h-20 rounded-lg border border-slate-200 bg-white object-contain" />
                    <button onClick={() => setPermissionSignature("")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => startCamera("permissionSig")} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600">Capture Signature</button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "SAVING..." : editingId ? "UPDATE GATEPASS" : "SAVE GATEPASS"}
            </button>
            {editingId && (
              <button onClick={resetForm} className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">CANCEL</button>
            )}
          </div>
        </div>

        <div>
          <div className="no-print mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Gatepass Records</h2>
            <div className="flex gap-2">
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {filteredGatepasses.length === 0 ? (
            <p className="text-sm text-slate-400">No gatepass records found.</p>
          ) : (
            <div className="space-y-3">
              {filteredGatepasses.map(gp => (
                <div key={gp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{gp.teachers?.full_name || `Staff #${gp.teacher_id}`}</p>
                      <p className="text-xs text-slate-500">{gp.teachers?.designation || ""} {gp.teachers?.staff_code ? `| Code: ${gp.teachers.staff_code}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      gp.status === "Active" ? "bg-green-100 text-green-700" : gp.status === "Returned" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>{gp.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <p>Out: {formatDateTime(gp.out_time)}</p>
                    <p>In: {formatDateTime(gp.in_time)}</p>
                  </div>
                  {gp.reason && <p className="mt-1 text-xs text-slate-400">Reason: {gp.reason}</p>}
                  {gp.permission_given_by && <p className="text-xs text-slate-400">Approved by: {gp.permission_given_by}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => handlePdfPreview(gp)} className="rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">View PDF</button>
                    {gp.status === "Active" && (
                      <button onClick={() => handleMarkReturned(gp)} className="rounded bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100">Mark Returned</button>
                    )}
                    <button onClick={() => handleEdit(gp)} className="rounded bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100">Edit</button>
                    <button onClick={() => handleDelete(gp.id)} className="rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">Staff Gatepass</h2>
              <div className="flex gap-2">
                <button onClick={handlePrintPdf} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Print</button>
                <button onClick={() => setPdfPreview(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Close</button>
              </div>
            </div>
            <div className="p-8" ref={pdfRef}>
              <div className="rounded-xl border-2 border-slate-300 bg-white p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold uppercase text-slate-800">{selectedSchoolForDisplay?.school_name || "SCHOOL"}</p>
                    <p className="text-sm text-slate-500">{selectedSchoolForDisplay?.address || "Address"}</p>
                  </div>
                  {selectedSchoolForDisplay?.logo_url ? (
                    <img src={selectedSchoolForDisplay.logo_url} alt="School logo" className="h-16 w-16 rounded border border-slate-200 object-contain" />
                  ) : null}
                </div>

                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold uppercase text-slate-800">Staff Gatepass</h1>
                </div>

                <div className="mb-6">
                  <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Staff Details</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview.teachers?.full_name || "—"}</p>
                      <p><span className="font-medium text-slate-600">Designation:</span> {pdfPreview.teachers?.designation || "—"}</p>
                      <p><span className="font-medium text-slate-600">Staff Code:</span> {pdfPreview.teachers?.staff_code || "—"}</p>
                      <p><span className="font-medium text-slate-600">Subject:</span> {pdfPreview.teachers?.subject || "—"}</p>
                      <p><span className="font-medium text-slate-600">Mobile:</span> {pdfPreview.teachers?.mobile || "—"}</p>
                    </div>
                    {pdfPreview.teachers?.photo_url ? (
                      <img src={pdfPreview.teachers.photo_url} alt="Staff" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">No photo</div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Pass Details</h2>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-slate-600">Out Time:</span> {formatDateTime(pdfPreview.out_time)}</p>
                    <p><span className="font-medium text-slate-600">In Time:</span> {formatDateTime(pdfPreview.in_time)}</p>
                    <p><span className="font-medium text-slate-600">Status:</span> {pdfPreview.status}</p>
                    {pdfPreview.reason && <p><span className="font-medium text-slate-600">Reason:</span> {pdfPreview.reason}</p>}
                    {pdfPreview.permission_given_by && <p><span className="font-medium text-slate-600">Approved By:</span> {pdfPreview.permission_given_by}</p>}
                  </div>
                </div>

                <div className="mb-6 border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">Staff Signature</p>
                      <p className="border-b border-slate-800 h-16 flex items-end text-sm font-medium text-slate-800">
                        {pdfPreview.staff_signature ? <img src={pdfPreview.staff_signature} alt="" className="h-full w-auto object-contain" /> : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">Permission Signature</p>
                      <p className="border-b border-slate-800 h-16 flex items-end text-sm font-medium text-slate-800">
                        {pdfPreview.permission_signature ? <img src={pdfPreview.permission_signature} alt="" className="h-full w-auto object-contain" /> : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-slate-800 pt-6 text-center">
                  <p className="text-lg font-bold text-slate-700">Thank You</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pdf-page mx-auto max-w-2xl p-8">
        <div className="rounded-xl border-2 border-slate-300 bg-white p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase text-slate-800">Staff Gatepass</h1>
              <p className="text-sm text-slate-500">{pdfPreview?.out_time}</p>
            </div>
            {selectedSchoolForDisplay?.logo_url ? (
              <img src={selectedSchoolForDisplay.logo_url} alt="" className="h-16 w-16 rounded border border-slate-200 object-contain" />
            ) : selectedSchoolForDisplay?.school_name ? (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-700 text-xs font-bold text-white">{selectedSchoolForDisplay.school_name.charAt(0)}</div>
            ) : null}
          </div>

          <div className="mb-4 border-b-2 border-slate-800 pb-4">
            <p className="text-center text-lg font-bold uppercase tracking-wide text-slate-800">{selectedSchoolForDisplay?.school_name || "School"}</p>
            {selectedSchoolForDisplay?.address ? <p className="mt-1 text-center text-sm text-slate-500">{selectedSchoolForDisplay.address}</p> : null}
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Staff Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview?.teachers?.full_name || "—"}</p>
                <p><span className="font-medium text-slate-600">Designation:</span> {pdfPreview?.teachers?.designation || "—"}</p>
                <p><span className="font-medium text-slate-600">Staff Code:</span> {pdfPreview?.teachers?.staff_code || "—"}</p>
              </div>
              {pdfPreview?.teachers?.photo_url ? (
                <img src={pdfPreview.teachers.photo_url} alt="" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No Photo</div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Pass Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="font-medium text-slate-600">Out Time:</span> {formatDateTime(pdfPreview?.out_time)}</p>
              <p><span className="font-medium text-slate-600">In Time:</span> {formatDateTime(pdfPreview?.in_time)}</p>
              <p><span className="font-medium text-slate-600">Status:</span> {pdfPreview?.status}</p>
              {pdfPreview?.reason && <p className="col-span-2"><span className="font-medium text-slate-600">Reason:</span> {pdfPreview.reason}</p>}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-500">Staff Signature</p>
              {pdfPreview?.staff_signature ? (
                <img src={pdfPreview.staff_signature} alt="" className="h-20 w-full rounded-lg border border-slate-200 bg-white object-contain" />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">No signature</div>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-500">Permission Signature</p>
              {pdfPreview?.permission_signature ? (
                <img src={pdfPreview.permission_signature} alt="" className="h-20 w-full rounded-lg border border-slate-200 bg-white object-contain" />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">No signature</div>
              )}
            </div>
          </div>

          <div className="border-t-2 border-slate-800 pt-6 text-center">
            <p className="text-lg font-bold text-slate-700">Thank You</p>
            <p className="mt-1 text-xs text-slate-400">Please sign in at the gate upon return</p>
          </div>
        </div>
      </div>
    </div>
  )
}
