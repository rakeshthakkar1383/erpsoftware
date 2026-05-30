"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setMessage("Enter your email"); return }
    setLoading(true)
    setMessage("")
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) { setMessage(error.message) }
    else { setSent(true); setMessage("Check your email for the reset link") }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Enter your email to receive a reset link</p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full rounded-lg border p-3 text-sm" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            {message && <p className="text-sm text-green-600">{message}</p>}
            <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-green-600">{message}</p>
        )}
        <p className="mt-4 text-center text-sm text-slate-500">
          <a className="text-blue-600 hover:underline" href="/login">Back to login</a>
        </p>
      </div>
    </div>
  )
}
