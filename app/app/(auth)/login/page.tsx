'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const bullets = [
  'AI-scored tenant screening in minutes',
  'Full portfolio view across all your properties',
  'Personalized investment marketplace picks',
]

const panelHeadline =
  'Professional tools for landlords who run their portfolio like a business.'

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
      >
        {label}
      </label>
      {/* Double-bezel: outer shell → inner input */}
      <div className="rounded-xl p-[3px] ring-1 ring-black/[0.08] bg-neutral-100/60">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="w-full rounded-[9px] bg-white px-4 py-3 text-[15px] text-neutral-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[box-shadow] duration-200 placeholder:text-neutral-300 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_3px_rgba(15,118,110,0.15)]"
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-[100dvh]">

      {/* ── Left brand panel — Z-Axis cascade depth ── */}
      <aside className="hidden lg:flex lg:w-[440px] xl:w-[500px] shrink-0 flex-col justify-between bg-brand px-12 py-12">

        <Link
          href="/"
          className="font-manrope text-[14px] font-bold tracking-[0.32em] text-white/80 transition-[color] duration-200 hover:text-white"
        >
          KEYSTONE
        </Link>

        <div className="rounded-[20px] bg-white/[0.06] px-8 py-8 ring-1 ring-white/[0.10]">
          <h2 className="font-manrope text-[1.5rem] font-bold leading-[1.25] tracking-[-0.02em] text-white xl:text-[1.625rem]">
            {panelHeadline}
          </h2>
          <ul className="mt-6 space-y-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[14px] leading-snug text-white/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px] text-white/20">© 2025 Keystone. All rights reserved.</p>
      </aside>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f9fa] px-6 py-16 sm:px-10">

        {/* Mobile logo */}
        <Link
          href="/"
          className="font-manrope mb-12 text-[14px] font-bold tracking-[0.32em] text-neutral-900 transition-[color] hover:text-[#0f766e] lg:hidden"
        >
          KEYSTONE
        </Link>

        <div className="w-full max-w-[360px]">
          <h1 className="font-manrope mb-1.5 text-[1.875rem] font-bold tracking-[-0.025em] text-neutral-900">
            Welcome back
          </h1>
          <p className="mb-9 text-[15px] leading-relaxed text-neutral-400">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                {error}
              </div>
            )}

            {/* Button-in-button submit */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-between rounded-full bg-brand pl-6 pr-2 py-2 text-[15px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.28)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105 group-enabled:group-hover:bg-white/15">
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
            </button>
          </form>

          <p className="mt-7 text-center text-[14px] text-neutral-400">
            No account yet?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#0f766e] transition-[color] duration-200 hover:text-[#115e59]"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
