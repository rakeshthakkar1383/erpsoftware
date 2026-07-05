"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { addGatepass, updateGatepass, deleteGatepass, uploadPhoto } from "./actions"

type Student = {
  id: number
  full_name: string | null
  gr_no: string | null
  class_name: string | null
  photo_url: string | null
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
  student_id: number | null
  visitor_name: string
  visitor_mobile: string | null
  visitor_relation: string | null
  visitor_vehicle_no: string | null
  visitor_town_village: string | null
  gatepass_date: string
  reason: string | null
  visitor_photo_url: string | null
  visitor_signature: string | null
  permission_given_by: string | null
  permission_signature: string | null
  status: string | null
  created_at: string | null
  students?: Student | null
}

type Props = {
  initialData: GatepassRecord[]
  allSchools: School[]
  students: Student[]
  schoolId: number | undefined
  currentSchool: School | null
}

export default function StudentGatepassClient({ initialData, allSchools, students, schoolId, currentSchool }: Props) {
  const supabase = createClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolId || allSchools[0]?.id || 0)
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("")
  const [visitorName, setVisitorName] = useState("")
  const [visitorMobile, setVisitorMobile] = useState("")
  const [visitorRelation, setVisitorRelation] = useState("")
  const [visitorVehicleNo, setVisitorVehicleNo] = useState("")
  const [visitorTownVillage, setVisitorTownVillage] = useState("")
  const [gatepassDate, setGatepassDate] = useState(new Date().toISOString().split("T")[0])
  const [reason, setReason] = useState("")
  const [visitorPhotoUrl, setVisitorPhotoUrl] = useState("")
  const [visitorSignature, setVisitorSignature] = useState("")
  const [permissionGivenBy, setPermissionGivenBy] = useState("")
  const [permissionSignature, setPermissionSignature] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")
  const [gatepasses, setGatepasses] = useState(initialData)
  const [pdfPreview, setPdfPreview] = useState<GatepassRecord | null>(null)
  const [capturing, setCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captureTarget, setCaptureTarget] = useState<"photo" | "visitorSig" | "permissionSig" | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  const selectedSchool = allSchools.find(s => s.id === selectedSchoolId)
  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const persistSelectedSchool = (schoolId: number) => {
    setSelectedSchoolId(schoolId)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("gatepass-selected-school-id", String(schoolId))
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedSchoolId = window.localStorage.getItem("gatepass-selected-school-id")
    if (storedSchoolId) {
      const parsedSchoolId = Number(storedSchoolId)
      if (!Number.isNaN(parsedSchoolId) && allSchools.some(s => s.id === parsedSchoolId)) {
        setSelectedSchoolId(parsedSchoolId)
        return
      }
    }

    if (schoolId) {
      setSelectedSchoolId(schoolId)
    } else if (allSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(allSchools[0].id)
    }
  }, [schoolId, allSchools])

  useEffect(() => {
    if (typeof window !== "undefined" && selectedSchoolId) {
      window.localStorage.setItem("gatepass-selected-school-id", String(selectedSchoolId))
    }
  }, [selectedSchoolId])

  const startCamera = async (target: "photo" | "visitorSig" | "permissionSig") => {
    setCaptureTarget(target)
    setCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
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
    if (captureTarget === "photo") setVisitorPhotoUrl(dataUrl)
    else if (captureTarget === "visitorSig") setVisitorSignature(dataUrl)
    else setPermissionSignature(dataUrl)
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
    if (!visitorName || !gatepassDate || !selectedStudentId) {
      setMsg("Please fill visitor name, date, and select a student")
      return
    }
    setSubmitting(true)
    setMsg("")

    const fd = new FormData()
    fd.append("school_id", String(selectedSchoolId))
    fd.append("student_id", String(selectedStudentId))
    fd.append("visitor_name", visitorName)
    fd.append("visitor_mobile", visitorMobile)
    fd.append("visitor_relation", visitorRelation)
    fd.append("visitor_vehicle_no", visitorVehicleNo)
    fd.append("visitor_town_village", visitorTownVillage)
    fd.append("gatepass_date", gatepassDate)
    fd.append("reason", reason)
    fd.append("visitor_photo_url", visitorPhotoUrl)
    fd.append("visitor_signature", visitorSignature)
    fd.append("permission_given_by", permissionGivenBy)
    fd.append("permission_signature", permissionSignature)

    let result
    if (editingId) {
      result = await updateGatepass(editingId, fd)
    } else {
      result = await addGatepass(fd)
    }

    setMsg(result.message)
    if (result.success) {
      resetForm()
      setEditingId(null)
      const { data: fresh } = await supabase
        .from("student_gatepass")
        .select("*, students(full_name, gr_no, class_name, photo_url)")
        .order("created_at", { ascending: false })
      if (fresh) setGatepasses(fresh)
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setSelectedStudentId("")
    setVisitorName("")
    setVisitorMobile("")
    setVisitorRelation("")
    setVisitorVehicleNo("")
    setVisitorTownVillage("")
    setGatepassDate(new Date().toISOString().split("T")[0])
    setReason("")
    setVisitorPhotoUrl("")
    setVisitorSignature("")
    setPermissionGivenBy("")
    setPermissionSignature("")
    setEditingId(null)
  }

  const handleEdit = (gp: GatepassRecord) => {
    setEditingId(gp.id)
    if (gp.school_id) {
      persistSelectedSchool(gp.school_id)
    } else {
      setSelectedSchoolId(selectedSchoolId)
    }
    setSelectedStudentId(gp.student_id || "")
    setVisitorName(gp.visitor_name)
    setVisitorMobile(gp.visitor_mobile || "")
    setVisitorRelation(gp.visitor_relation || "")
    setVisitorVehicleNo(gp.visitor_vehicle_no || "")
    setVisitorTownVillage(gp.visitor_town_village || "")
    setGatepassDate(gp.gatepass_date)
    setReason(gp.reason || "")
    setVisitorPhotoUrl(gp.visitor_photo_url || "")
    setVisitorSignature(gp.visitor_signature || "")
    setPermissionGivenBy(gp.permission_given_by || "")
    setPermissionSignature(gp.permission_signature || "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gatepass?")) return
    const result = await deleteGatepass(id)
    setMsg(result.message)
    if (result.success) {
      setGatepasses(prev => prev.filter(g => g.id !== id))
    }
  }

  const handlePdfPreview = (gp: GatepassRecord) => {
    setPdfPreview(gp)
  }

  const handlePrintPdf = () => {
    setTimeout(() => {
      window.print()
    }, 200)
  }

  const selectedSchoolForDisplay = selectedSchool || currentSchool || null

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
        <h1 className="text-2xl font-bold">Student Gatepass</h1>
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
              <button onClick={capturePhoto} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Capture
              </button>
              <button onClick={stopCamera} className="rounded-lg bg-slate-600 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700">
                Cancel
              </button>
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
            <select
              value={selectedSchoolId}
              onChange={e => persistSelectedSchool(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              {allSchools.map(s => (
                <option key={s.id} value={s.id}>{s.school_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.gr_no ? `(${s.gr_no})` : ""} {s.class_name ? `- ${s.class_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-slate-50 p-3">
              {selectedStudent.photo_url ? (
                <img src={selectedStudent.photo_url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-500">
                  NO PHOTO
                </div>
              )}
              <div>
                <p className="font-bold text-slate-800">{selectedStudent.full_name}</p>
                <p className="text-xs text-slate-500">GR No: {selectedStudent.gr_no || "—"}</p>
                <p className="text-xs text-slate-500">Class: {selectedStudent.class_name || "—"}</p>
              </div>
            </div>
          )}

          <div className="mb-4 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Visitor Details</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Name *</label>
                <input value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Mobile Number</label>
                <input value={visitorMobile} onChange={e => setVisitorMobile(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Relation</label>
                <input value={visitorRelation} onChange={e => setVisitorRelation(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Vehicle No</label>
                <input value={visitorVehicleNo} onChange={e => setVisitorVehicleNo(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Town / Village</label>
                <input value={visitorTownVillage} onChange={e => setVisitorTownVillage(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Date *</label>
                <input type="date" value={gatepassDate} onChange={e => setGatepassDate(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </div>
          </div>

          <div className="mb-4 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Visitor Live Photo</h3>
            {visitorPhotoUrl ? (
              <div className="relative inline-block">
                <img src={visitorPhotoUrl} alt="Visitor" className="h-32 rounded-lg border border-slate-200 object-cover" />
                <button onClick={() => setVisitorPhotoUrl("")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
              </div>
            ) : (
              <button onClick={() => startCamera("photo")} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600">
                Capture Photo
              </button>
            )}
          </div>

          <div className="mb-4 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-600">Signatures</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Visitor Signature</label>
                {visitorSignature ? (
                  <div className="relative inline-block">
                    <img src={visitorSignature} alt="Visitor Signature" className="h-20 rounded-lg border border-slate-200 bg-white object-contain" />
                    <button onClick={() => setVisitorSignature("")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => startCamera("visitorSig")} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600">
                    Capture Signature
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Permission Given By</label>
                <input value={permissionGivenBy} onChange={e => setPermissionGivenBy(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-sm" placeholder="Name" />
                {permissionSignature ? (
                  <div className="relative inline-block">
                    <img src={permissionSignature} alt="Permission Signature" className="h-20 rounded-lg border border-slate-200 bg-white object-contain" />
                    <button onClick={() => setPermissionSignature("")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => startCamera("permissionSig")} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600">
                    Capture Signature
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "SAVING..." : editingId ? "UPDATE GATEPASS" : "SAVE GATEPASS"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                CANCEL
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">Gatepass Records</h2>
          {gatepasses.length === 0 ? (
            <p className="text-sm text-slate-400">No gatepass records yet.</p>
          ) : (
            <div className="space-y-3">
              {gatepasses.map(gp => (
                <div key={gp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{gp.students?.full_name || `Student #${gp.student_id}`}</p>
                      <p className="text-xs text-slate-500">{gp.gatepass_date}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      gp.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {gp.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Visitor: {gp.visitor_name}</p>
                  {gp.reason && <p className="text-xs text-slate-400">Reason: {gp.reason}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => handlePdfPreview(gp)} className="rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">
                      View PDF
                    </button>
                    <button onClick={() => handleEdit(gp)} className="rounded bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(gp.id)} className="rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
                      Delete
                    </button>
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
              <h2 className="text-lg font-bold text-slate-800">Gatepass PDF Preview</h2>
              <div className="flex gap-2">
                <button onClick={handlePrintPdf} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  Download PDF
                </button>
                <button onClick={() => setPdfPreview(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
            <div className="p-8" ref={pdfRef}>
              <div className="rounded-xl border-2 border-slate-300 bg-white p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold uppercase text-slate-800">
                      {selectedSchoolForDisplay?.school_name || "SHANTINIKETAN VIDHYALAY"}
                    </p>
                    <p className="text-sm text-slate-500">{selectedSchoolForDisplay?.address || "Address"}</p>
                  </div>
                  {selectedSchoolForDisplay?.logo_url ? (
                    <img src={selectedSchoolForDisplay.logo_url} alt="School logo" className="h-16 w-16 rounded border border-slate-200 object-contain" />
                  ) : null}
                </div>

                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold uppercase text-slate-800">Student Exit Pass</h1>
                </div>

                <div className="mb-6">
                  <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Student Details</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview.students?.full_name || "—"}</p>
                      <p><span className="font-medium text-slate-600">GR No:</span> {pdfPreview.students?.gr_no || "—"}</p>
                      <p><span className="font-medium text-slate-600">Class:</span> {pdfPreview.students?.class_name || "—"}</p>
                    </div>
                    {pdfPreview.students?.photo_url ? (
                      <img src={pdfPreview.students.photo_url} alt="Student" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">No photo</div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Visitor Details</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview.visitor_name}</p>
                      <p><span className="font-medium text-slate-600">Mobile:</span> {pdfPreview.visitor_mobile || "—"}</p>
                      <p><span className="font-medium text-slate-600">Relation:</span> {pdfPreview.visitor_relation || "—"}</p>
                      <p><span className="font-medium text-slate-600">Vehicle No:</span> {pdfPreview.visitor_vehicle_no || "—"}</p>
                      <p><span className="font-medium text-slate-600">Town/Village:</span> {pdfPreview.visitor_town_village || "—"}</p>
                      <p><span className="font-medium text-slate-600">Date:</span> {pdfPreview.gatepass_date}</p>
                      {pdfPreview.reason && (
                        <p><span className="font-medium text-slate-600">Reason:</span> {pdfPreview.reason}</p>
                      )}
                    </div>
                    {pdfPreview.visitor_photo_url ? (
                      <img src={pdfPreview.visitor_photo_url} alt="Visitor" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">No photo</div>
                    )}
                  </div>
                </div>

                <div className="mb-6 border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">Permission Given By & Sign</p>
                      <p className="mb-4 border-b border-slate-800 h-16 flex items-end text-sm font-medium text-slate-800">
                        {pdfPreview.permission_given_by || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">Visitor Signature</p>
                      <p className="mb-4 border-b border-slate-800 h-16 flex items-end text-sm font-medium text-slate-800">
                        {pdfPreview.visitor_signature ? (
                          <img src={pdfPreview.visitor_signature} alt="" className="h-full w-auto object-contain" />
                        ) : "—"}
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
              <h1 className="text-xl font-bold uppercase text-slate-800">
                {pdfPreview?.students ? `${pdfPreview.students.full_name} Gatepass` : "Student Gatepass"}
              </h1>
              <p className="text-sm text-slate-500">{pdfPreview?.gatepass_date}</p>
            </div>
            {selectedSchoolForDisplay?.logo_url ? (
              <img src={selectedSchoolForDisplay.logo_url} alt="" className="h-16 w-16 rounded border border-slate-200 object-contain" />
            ) : selectedSchoolForDisplay?.school_name ? (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-700 text-xs font-bold text-white">
                {selectedSchoolForDisplay.school_name.charAt(0)}
              </div>
            ) : null}
          </div>

          <div className="mb-4 border-b-2 border-slate-800 pb-4">
            <p className="text-center text-lg font-bold uppercase tracking-wide text-slate-800">
              {selectedSchoolForDisplay?.school_name || "School"}
            </p>
            {selectedSchoolForDisplay?.address ? (
              <p className="mt-1 text-center text-sm text-slate-500">{selectedSchoolForDisplay.address}</p>
            ) : null}
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Student Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview?.students?.full_name || "—"}</p>
                <p><span className="font-medium text-slate-600">GR No:</span> {pdfPreview?.students?.gr_no || "—"}</p>
                <p><span className="font-medium text-slate-600">Class:</span> {pdfPreview?.students?.class_name || "—"}</p>
              </div>
              {pdfPreview?.students?.photo_url ? (
                <img src={pdfPreview.students.photo_url} alt="" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No Photo</div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">Visitor Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="font-medium text-slate-600">Name:</span> {pdfPreview?.visitor_name}</p>
                <p><span className="font-medium text-slate-600">Mobile:</span> {pdfPreview?.visitor_mobile || "—"}</p>
                <p><span className="font-medium text-slate-600">Relation:</span> {pdfPreview?.visitor_relation || "—"}</p>
                <p><span className="font-medium text-slate-600">Vehicle No:</span> {pdfPreview?.visitor_vehicle_no || "—"}</p>
                <p><span className="font-medium text-slate-600">Town/Village:</span> {pdfPreview?.visitor_town_village || "—"}</p>
                <p><span className="font-medium text-slate-600">Date:</span> {pdfPreview?.gatepass_date}</p>
              </div>
              {pdfPreview?.visitor_photo_url ? (
                <img src={pdfPreview.visitor_photo_url} alt="" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No Photo</div>
              )}
            </div>
            {pdfPreview?.reason && (
              <p className="mt-2 text-sm"><span className="font-medium text-slate-600">Reason:</span> {pdfPreview.reason}</p>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-slate-500">Visitor Signature</p>
              {pdfPreview?.visitor_signature ? (
                <img src={pdfPreview.visitor_signature} alt="" className="h-20 w-full rounded-lg border border-slate-200 bg-white object-contain" />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">No signature</div>
              )}
            </div>
          </div>

          <div className="mb-6 border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-slate-500">Permission Given By</p>
                <p className="text-sm font-medium text-slate-800">{pdfPreview?.permission_given_by || "—"}</p>
                {pdfPreview?.permission_signature && (
                  <img src={pdfPreview.permission_signature} alt="" className="mt-1 h-16 rounded-lg border border-slate-200 bg-white object-contain" />
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-slate-500">Permission Signature</p>
                {pdfPreview?.permission_signature ? (
                  <img src={pdfPreview.permission_signature} alt="" className="h-16 rounded-lg border border-slate-200 bg-white object-contain" />
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-slate-800 pt-6 text-center">
            <p className="text-lg font-bold text-slate-700">Thank You</p>
            <p className="mt-1 text-xs text-slate-400">Please sign out at the gate</p>
          </div>
        </div>
      </div>
    </div>
  )
}
