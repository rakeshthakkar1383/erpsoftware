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
