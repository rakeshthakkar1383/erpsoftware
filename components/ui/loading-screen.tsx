"use client"

import { Loader2 } from "lucide-react"

type LoadingScreenProps = {
  message?: string
  fullPage?: boolean
}

export default function LoadingScreen({ message = "Loading...", fullPage = false }: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullPage ? "min-h-screen" : "min-h-[50vh]"
      }`}
    >
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
        {message}
      </p>
    </div>
  )
}
