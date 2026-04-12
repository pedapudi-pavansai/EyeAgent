'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  propertyId: string
  className?: string
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Async work before copy often breaks the user-gesture chain; fallback works more reliably.
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.setAttribute('readonly', '')
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

export default function CopyApplicationLinkButton({ propertyId, className }: Props) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateApplicationLink() {
    setError(null)
    const res = await fetch('/api/applications/generate-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId }),
      credentials: 'same-origin',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || typeof data.url !== 'string') {
      const msg =
        typeof data.error === 'string'
          ? data.error
          : res.status === 401
            ? 'Sign in again, then retry.'
            : 'Could not generate link.'
      setError(msg)
      return
    }
    await copyTextToClipboard(data.url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 3000)
  }

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-1', className)}>
      <button
        type="button"
        onClick={generateApplicationLink}
        className={cn(
          'w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2 text-center font-manrope text-[12px] font-semibold leading-tight text-[#475569] transition hover:bg-[#f1f5f9]',
          error && 'border-red-200 bg-red-50/80'
        )}
      >
        {linkCopied ? 'Copied!' : 'Copy app link'}
      </button>
      {error ? <p className="text-[11px] leading-snug text-red-600">{error}</p> : null}
    </div>
  )
}
