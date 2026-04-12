'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2 } from 'lucide-react'

interface Props {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export default function FallbackImage({ src, alt, className, fallbackClassName }: Props) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Catch images that already failed before React hydrated and attached onError
  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    if (img.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) {
    return (
      <div
        className={
          fallbackClassName ??
          'flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100/80 to-slate-200/80'
        }
      >
        <Building2 className="h-10 w-10 text-[#94a3b8]/60" strokeWidth={1} />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
