import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-"
  // Handle ISO string or YYYY-MM-DD
  const dateOnly = dateStr.split("T")[0]
  const parts = dateOnly.split("-")
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  return `${day}-${month}-${year}`
}

export async function safeJsonResponse<T = any>(res: Response): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  let text = ""
  try {
    text = await res.text()
  } catch (err: any) {
    return { ok: false, status: res.status, data: null, error: err?.message || "Failed to read response body" }
  }

  if (!text || !text.trim()) {
    return { ok: res.ok, status: res.status, data: null, error: res.ok ? undefined : `Empty response (HTTP ${res.status})` }
  }

  try {
    const data = JSON.parse(text)
    return { ok: res.ok, status: res.status, data, error: res.ok ? data?.error : (data?.error || `HTTP ${res.status}`) }
  } catch {
    return { ok: res.ok, status: res.status, data: null, error: res.ok ? "Invalid JSON response" : `HTTP ${res.status}` }
  }
}

