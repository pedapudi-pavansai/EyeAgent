import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  variant: 'landlord' | 'tenant'
  alt: string
  className?: string
}

const sizeClass = {
  sm: 'h-9 w-9 [&_svg]:h-[15px] [&_svg]:w-[15px]',
  md: 'h-10 w-10 [&_svg]:h-4 [&_svg]:w-4',
  lg: 'h-12 w-12 [&_svg]:h-[18px] [&_svg]:w-[18px]',
} as const

export type ProfileAvatarSize = keyof typeof sizeClass

const variantStyles = {
  landlord: 'bg-[#0f766e]/12 text-[#0f766e]',
  tenant: 'bg-slate-200/90 text-slate-600',
} as const

export default function ProfileAvatar({
  variant,
  alt,
  className,
  size = 'md',
}: Props & { size?: ProfileAvatarSize }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full object-cover',
        sizeClass[size],
        variantStyles[variant],
        className
      )}
      role="img"
      aria-label={alt || (variant === 'landlord' ? 'Landlord' : 'Tenant')}
    >
      <User className="shrink-0" strokeWidth={2} aria-hidden />
    </div>
  )
}
