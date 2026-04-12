import LandlordSidebar from '@/components/landlord/LandlordSidebar'
import DashboardTopBar from '@/components/landlord/DashboardTopBar'

interface Props {
  children: React.ReactNode
  fullName?: string | null
  businessName?: string | null
}

export default function DashboardShell({
  children,
  fullName,
  businessName,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <LandlordSidebar fullName={fullName} businessName={businessName} />
      <div className="flex min-h-screen flex-col pl-64">
        <DashboardTopBar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
