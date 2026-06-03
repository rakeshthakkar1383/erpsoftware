"use client"

import { useState, useCallback } from "react"
import { getFilteredCount, migrateStudents } from "./actions"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))

type Props = {
  divisions: any[]
  streams: any[]
  years: any[]
  allSchools: { id: number; school_name: string | null }[]
  userSchoolId: number | null
}

export default function StudentMigrationClient({ divisions, streams, years, allSchools, userSchoolId }: Props) {
  const [source, setSource] = useState({ school_id: userSchoolId ? String(userSchoolId) : "", academic_year_id: "", class_name: "", division: "", stream: "" })
  const [target, setTarget] = useState({ academic_year_id: "", class_name: "", division: "", stream: "" })
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [message, setMessage] = useState("")
  const [confirm, setConfirm] = useState(false)

  const setSourceField = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const next = { ...source, [field]: val }
    if (field === "class_name") { next.division = ""; next.stream = "" }
    setSource(next)
    setCount(null)
    setMessage("")
  }

  const setTargetField = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const next = { ...target, [field]: val }
    if (field === "class_name") { next.division = ""; next.stream = "" }
    setTarget(next)
    setMessage("")
  }

  const previewCount = useCallback(async () => {
    setLoading(true)
    setMessage("")
    try {
      const filters: any = {}
      if (source.school_id) filters.school_id = Number(source.school_id)
      if (source.academic_year_id) filters.academic_year_id = Number(source.academic_year_id)
      if (source.class_name) filters.class_name = source.class_name
      if (source.division) filters.division = source.division
      if (source.stream) filters.stream = source.stream
      const c = await getFilteredCount(filters)
      setCount(c)
    } catch { setMessage("Failed to fetch count") }
    finally { setLoading(false) }
  }, [source])

  const handleMigrate = async () => {
    setMigrating(true)
    setMessage("")
    try {
      const src: any = {}
      if (source.school_id) src.school_id = Number(source.school_id)
      if (source.academic_year_id) src.academic_year_id = Number(source.academic_year_id)
      if (source.class_name) src.class_name = source.class_name
      if (source.division) src.division = source.division
      if (source.stream) src.stream = source.stream

      const tgt: any = {}
      if (target.academic_year_id) tgt.academic_year_id = Number(target.academic_year_id)
      if (target.class_name) tgt.class_name = target.class_name
      if (target.division) tgt.division = target.division
      if (target.stream) tgt.stream = target.stream

      const res = await migrateStudents(src, tgt)
      setMessage(res.message)
      if (res.success) {
        setCount(null)
        setConfirm(false)
      }
    } catch (err: any) { setMessage(err.message || "Migration failed") }
    finally { setMigrating(false) }
  }

  const hasSourceFilters = source.academic_year_id || source.class_name || source.division || source.stream
  const canMigrate = count !== null && count > 0 && (target.academic_year_id || target.class_name || target.division || target.stream)

  const isLoading = loading || migrating

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-orange-600" />
            <p className="text-sm font-bold text-slate-600">{loading ? "Counting students..." : "Migrating students..."}</p>
          </div>
        </div>
      )}

      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Batch Student Migration</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Move students between academic years / classes / divisions</p>
      </div>

      {message && (
        <p className={`mb-4 rounded border px-4 py-2 text-sm font-medium ${message.includes("successfully") ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"}`}>
          {message}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-600">Source (Filter Students)</h3>
          <div className="space-y-3">
            {!userSchoolId && (
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">School</label>
                <select className="w-full rounded border p-2.5 text-sm" value={source.school_id} onChange={setSourceField("school_id")}>
                  <option value="">All Schools</option>
                  {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Academic Year</label>
              <select className="w-full rounded border p-2.5 text-sm" value={source.academic_year_id} onChange={setSourceField("academic_year_id")}>
                <option value="">All Years</option>
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Class</label>
              <select className="w-full rounded border p-2.5 text-sm" value={source.class_name} onChange={setSourceField("class_name")}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Division</label>
              <select className="w-full rounded border p-2.5 text-sm" value={source.division} onChange={setSourceField("division")}>
                <option value="">All Divisions</option>
                {divisions.filter((d: any) => d.class_name === source.class_name || !source.class_name).map((d: any) => (
                  <option key={d.id} value={d.division_name}>{d.division_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Stream</label>
              <select className="w-full rounded border p-2.5 text-sm" value={source.stream} onChange={setSourceField("stream")}>
                <option value="">All Streams</option>
                {streams.filter((s: any) => s.class_name === source.class_name || !source.class_name).map((s: any) => (
                  <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
                ))}
              </select>
            </div>

            <button
              className="w-full rounded bg-slate-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={previewCount}
              disabled={loading || !hasSourceFilters}
            >
              {loading ? "Counting..." : "Count Matching Students"}
            </button>

            {count !== null && (
              <div className={`rounded border p-3 text-center text-lg font-bold ${count > 0 ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                {count} student{count !== 1 ? "s" : ""} matched
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-600">Target (Move To)</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Academic Year</label>
              <select className="w-full rounded border p-2.5 text-sm" value={target.academic_year_id} onChange={setTargetField("academic_year_id")}>
                <option value="">Select Year</option>
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Class</label>
              <select className="w-full rounded border p-2.5 text-sm" value={target.class_name} onChange={setTargetField("class_name")}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Division</label>
              <select className="w-full rounded border p-2.5 text-sm" value={target.division} onChange={setTargetField("division")}>
                <option value="">Select Division</option>
                {divisions.filter((d: any) => d.class_name === target.class_name || !target.class_name).map((d: any) => (
                  <option key={d.id} value={d.division_name}>{d.division_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Stream</label>
              <select className="w-full rounded border p-2.5 text-sm" value={target.stream} onChange={setTargetField("stream")}>
                <option value="">Select Stream</option>
                {streams.filter((s: any) => s.class_name === target.class_name || !target.class_name).map((s: any) => (
                  <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
                ))}
              </select>
            </div>

            <button
              className="w-full rounded bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
              onClick={() => setConfirm(true)}
              disabled={!canMigrate}
            >
              {canMigrate ? `Migrate ${count} Student${count !== 1 ? "s" : ""}` : "Set source & target first"}
            </button>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !migrating && setConfirm(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-slate-800">Confirm Migration</h3>
            <div className="mb-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold">{count}</span> student{count !== 1 ? "s" : ""} will be moved:</p>
              <div className="rounded border bg-slate-50 p-3 space-y-1">
                {source.academic_year_id && <p>From Year: <span className="font-medium text-slate-800">{years.find((y: any) => String(y.id) === source.academic_year_id)?.year_name}</span></p>}
                {source.class_name && <p>From Class: <span className="font-medium text-slate-800">{source.class_name}</span></p>}
                {source.division && <p>From Division: <span className="font-medium text-slate-800">{source.division}</span></p>}
                {source.stream && <p>From Stream: <span className="font-medium text-slate-800">{source.stream}</span></p>}
              </div>
              <p className="text-center font-semibold text-slate-400">↓</p>
              <div className="rounded border bg-orange-50 p-3 space-y-1">
                {target.academic_year_id && <p>To Year: <span className="font-medium text-slate-800">{years.find((y: any) => String(y.id) === target.academic_year_id)?.year_name}</span></p>}
                {target.class_name && <p>To Class: <span className="font-medium text-slate-800">{target.class_name}</span></p>}
                {target.division && <p>To Division: <span className="font-medium text-slate-800">{target.division}</span></p>}
                {target.stream && <p>To Stream: <span className="font-medium text-slate-800">{target.stream}</span></p>}
              </div>
            </div>
            {message && <p className={`mb-3 text-sm font-medium ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
            <div className="flex gap-3">
              <button className="rounded bg-orange-600 px-5 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50" onClick={handleMigrate} disabled={migrating}>
                {migrating ? "Migrating..." : `Yes, Migrate ${count} Student${count !== 1 ? "s" : ""}`}
              </button>
              <button className="rounded bg-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-400 disabled:opacity-50" onClick={() => setConfirm(false)} disabled={migrating}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
