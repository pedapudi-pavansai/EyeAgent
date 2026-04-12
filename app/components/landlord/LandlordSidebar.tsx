'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardCheck, LayoutGrid, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileAvatar from '@/components/ProfileAvatar'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/diligence', label: 'Due diligence', icon: ClipboardCheck },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
] as const

interface Props {
  fullName?: string | null
  businessName?: string | null
}

export default function LandlordSidebar({ fullName, businessName }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen w-64 flex-col justify-between border-r border-[#f1f5f9]',
        'bg-[rgba(248,250,252,0.92)] pb-8 pl-4 pr-[17px] pt-7 backdrop-blur-md'
      )}
    >
      {/* Wordmark */}
      <div>
        <Link
          href="/dashboard"
          className="mb-8 block px-4 font-manrope text-[15px] font-bold tracking-[0.3em] text-[#191c1d] transition hover:text-[#0f766e]"
        >
          KEYSTONE
        </Link>

        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === '/dashboard' : pathname === href

            return (
              <Link
                key={href + label}
                href={href}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl py-2.5 pl-4 pr-5 transition-colors',
                  active
                    ? 'bg-[rgba(240,253,250,0.85)] text-[#0f766e]'
                    : 'text-[#64748b] hover:bg-slate-50/80 hover:text-[#475569]'
                )}
              >
                {/* Active left-bar indicator */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#0f766e]"
                    aria-hidden
                  />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
                <span
                  className={cn(
                    'text-[13.5px] leading-5',
                    active ? 'font-semibold' : 'font-normal'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-[#f1f5f9] pt-[17px]">
        <div className="flex items-center gap-3 px-4">
          <ProfileAvatar
            variant="landlord"
            size="lg"
            alt=""
            className="ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold leading-5 text-[#191c1d]">
              {fullName || 'Landlord'}
            </p>
            <p className="truncate text-[12px] leading-4 text-[#64748b]">
              {businessName || 'Keystone'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
