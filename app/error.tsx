"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 gap-4">
      <p className="text-red-600">Something went wrong</p>
      <button
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  )
}
