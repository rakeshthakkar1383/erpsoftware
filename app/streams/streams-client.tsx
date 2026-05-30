"use client"

import { useState } from "react"
import { getAllStreams, addStream, updateStream, deleteStream } from "./actions"

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1))
const emptyForm = { class_name: "", stream_name: "" }

export default function StreamsClient({ initialStreams }: { initialStreams: any[] }) {
  const [streams, setStreams] = useState(initialStreams)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState("")

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value.toUpperCase() })

  const toFD = (obj: any) => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? ""))); return fd }

  const handleSave = async () => {
    if (!form.class_name || !form.stream_name) { setMessage("Class and Stream are required"); return }
    if (editing) { await updateStream(editing.id, toFD(form)) } else { await addStream(toFD(form)) }
    setModal(false); setStreams(await getAllStreams())
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this stream?")) return
    await deleteStream(id); setStreams(await getAllStreams())
  }

  const q = search.toLowerCase()
  const filtered = streams.filter((s: any) => !q || [s.class_name, s.stream_name].some((v: any) => v?.toLowerCase().includes(q)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Streams</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={() => { setEditing(null); setForm({ ...emptyForm }); setMessage(""); setModal(true) }}>Add New</button>
      </div>
      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} streams</span>
      </div>
      {filtered.length === 0 ? <p>No streams found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Stream</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((s: any, i: number) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{s.class_name}</td>
                  <td className="px-3 py-2">{s.stream_name}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(s); setForm({ class_name: s.class_name || "", stream_name: s.stream_name || "" }); setMessage(""); setModal(true) }}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? "Edit Stream" : "Add Stream"}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set("class_name")}>
                <option value="">Class *</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Stream Name (e.g. SCIENCE, COMMERCE) *" value={form.stream_name} onChange={set("stream_name")} />
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? "Update" : "Save"}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
