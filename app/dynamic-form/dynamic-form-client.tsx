"use client"

import { useState } from "react"
import { updateSchoolInfo } from "@/app/school-info/actions"
import { createClient } from "@/lib/supabase/client"

type Field = {
  id: string
  name: string
  label: string
  type: "text" | "number" | "date" | "email" | "textarea" | "select"
  placeholder: string
  required: boolean
  options: string
}

let idCounter = 0
const genId = () => `field_${++idCounter}`

const fieldTypes = ["text", "number", "date", "email", "textarea", "select"] as const

const emptyField = (): Field => ({
  id: genId(),
  name: "",
  label: "",
  type: "text",
  placeholder: "",
  required: false,
  options: "",
})

const emptyForm = {
  school_name: "", address: "", phone: "", email: "", website: "",
  principal_name: "", affiliation: "", logo_url: "",
}

const subTabs = [
  { key: "builder", label: "Form Builder" },
  { key: "school-info", label: "School Info" },
]

export default function DynamicFormClient({ initialInfo, schoolId }: { initialInfo: any, schoolId: number | null }) {
  const [activeSubTab, setActiveSubTab] = useState("builder")

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Dynamic Form</h2>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeSubTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "builder" && <FormBuilder />}
      {activeSubTab === "school-info" && <SchoolInfoSection initialInfo={initialInfo} schoolId={schoolId} />}
    </div>
  )
}

function FormBuilder() {
  const [fields, setFields] = useState<Field[]>([])
  const [jsonOutput, setJsonOutput] = useState("")

  const updateField = (id: string, key: keyof Field, value: any) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)))
  }

  const addField = () => setFields([...fields, emptyField()])

  const moveUp = (index: number) => {
    if (index === 0) return
    const copy = [...fields]
    ;[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]
    setFields(copy)
  }

  const moveDown = (index: number) => {
    if (index === fields.length - 1) return
    const copy = [...fields]
    ;[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]]
    setFields(copy)
  }

  const removeField = (id: string) => setFields(fields.filter((f) => f.id !== id))

  const generateJson = () => {
    const schema = fields.map(({ id, ...rest }) => ({
      ...rest,
      options: rest.type === "select" ? rest.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
    }))
    setJsonOutput(JSON.stringify(schema, null, 2))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">Fields</h3>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={addField}>Add Field</button>
        </div>
        {fields.length === 0 && <p className="text-sm text-slate-500">No fields yet. Click &ldquo;Add Field&rdquo; to start building your form.</p>}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Field #{index + 1}</span>
                <div className="flex gap-1">
                  <button className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200" onClick={() => moveUp(index)} disabled={index === 0}>Up</button>
                  <button className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200" onClick={() => moveDown(index)} disabled={index === fields.length - 1}>Down</button>
                  <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200" onClick={() => removeField(field.id)}>Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded border p-2 text-sm" placeholder="Field Name" value={field.name} onChange={(e) => updateField(field.id, "name", e.target.value.toLowerCase().replace(/\s+/g, "_"))} />
                <input className="rounded border p-2 text-sm" placeholder="Label" value={field.label} onChange={(e) => updateField(field.id, "label", e.target.value)} />
                <select className="rounded border p-2 text-sm" value={field.type} onChange={(e) => updateField(field.id, "type", e.target.value)}>
                  {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="rounded border p-2 text-sm" placeholder="Placeholder" value={field.placeholder} onChange={(e) => updateField(field.id, "placeholder", e.target.value)} />
                {field.type === "select" && (
                  <input className="rounded border p-2 text-sm md:col-span-2" placeholder="Options (comma separated)" value={field.options} onChange={(e) => updateField(field.id, "options", e.target.value)} />
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, "required", e.target.checked)} />
                  Required
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-700">Preview</h3>
        {fields.length === 0 ? (
          <p className="text-sm text-slate-500">Add fields to see a preview.</p>
        ) : (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="grid gap-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {field.label || field.name}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea className="w-full rounded border p-3 text-sm" placeholder={field.placeholder} rows={3} />
                  ) : field.type === "select" ? (
                    <select className="w-full rounded border p-3 text-sm">
                      <option value="">{field.placeholder || "Select..."}</option>
                      {field.options.split(",").map((o, i) => o.trim() && <option key={i} value={o.trim()}>{o.trim()}</option>)}
                    </select>
                  ) : (
                    <input className="w-full rounded border p-3 text-sm" type={field.type} placeholder={field.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700" onClick={generateJson}>Generate JSON</button>
        </div>
        {jsonOutput && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Output</h4>
            <pre className="overflow-x-auto rounded border bg-slate-50 p-4 text-xs">{jsonOutput}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

function SchoolInfoSection({ initialInfo, schoolId }: { initialInfo: any, schoolId: number | null }) {
  const [form, setForm] = useState<any>(initialInfo || { ...emptyForm })
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const shouldUppercase = ["school_name", "address", "principal_name", "affiliation"].includes(field)
    setForm((prev: any) => ({ ...prev, [field]: shouldUppercase ? value.toUpperCase() : value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !schoolId) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${schoolId}/logo_${Date.now()}.${ext}`
    try {
      const { error } = await supabase.storage.from("school-files").upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("school-files").getPublicUrl(path)
      setForm((prev: any) => ({ ...prev, logo_url: publicUrl }))
    } catch (err: any) { alert(err.message) }
    finally { setUploading(false) }
  }

  const toFD = (obj: any) => {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => fd.append(k, String(v ?? "")))
    return fd
  }

  const handleSave = async () => {
    const result = await updateSchoolInfo(toFD(form))
    setMessage(result.message)
  }

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">{form.school_name || "SCHOOL INFO"}</h2>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Institutional Details & Branding</p>
      </div>
      {message && <p className="mb-3 text-sm font-medium text-blue-700">{message}</p>}
      <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex justify-center mb-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="School Logo" className="h-32 w-32 rounded-lg border object-contain bg-slate-50" />
            ) : (
              <div className="h-32 w-32 rounded-lg border border-dashed flex items-center justify-center bg-slate-50 text-slate-400 text-xs text-center p-2">
                No Logo Uploaded
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">School Name</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="SCHOOL NAME" value={form.school_name || ""} onChange={set("school_name")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Phone" value={form.phone || ""} onChange={set("phone")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Email" value={form.email || ""} onChange={set("email")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Website</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="Website" value={form.website || ""} onChange={set("website")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Principal Name</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="PRINCIPAL NAME" value={form.principal_name || ""} onChange={set("principal_name")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Affiliation</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="AFFILIATION (E.G. CBSE)" value={form.affiliation || ""} onChange={set("affiliation")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
            <input className="w-full rounded border p-3 text-sm" placeholder="FULL ADDRESS" value={form.address || ""} onChange={set("address")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Logo</label>
            <input type="file" className="w-full text-sm" accept="image/*" onChange={handleLogoUpload} />
            {uploading && <p className="text-xs text-blue-600 mt-1">Uploading logo...</p>}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
