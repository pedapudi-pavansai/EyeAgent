import Link from 'next/link'

interface Props {
  businessName?: string | null
}

export default function LandlordNav({ businessName }: Props) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          Keystone
        </Link>
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/diligence" className="text-gray-600 hover:text-gray-900">
            Tenant Diligence
          </Link>
          <Link href="/marketplace" className="text-gray-600 hover:text-gray-900">
            Marketplace
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {businessName && <p className="text-xs text-gray-500 hidden sm:block">{businessName}</p>}
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  )
}
