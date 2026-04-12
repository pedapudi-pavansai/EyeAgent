import { createAdminClient } from '@/lib/supabase/admin'
import ApplicationForm from '@/components/ApplicationForm'

/**
 * Applicants open this page without logging in (often incognito). RLS on
 * application_tokens / properties only allows landlords, so we validate the
 * token server-side with the service role — same trust model as POST /api/applications/submit.
 */
export default async function ApplyPage({
  params,
  searchParams
}: {
  params: Promise<{ property_id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { property_id } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-500 mt-2">This application link is missing required information.</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()

  const { data: tokenData } = await admin
    .from('application_tokens')
    .select('expires_at')
    .eq('token', token)
    .eq('property_id', property_id)
    .maybeSingle()

  if (!tokenData || new Date(tokenData.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Link Expired</h1>
          <p className="text-gray-500 mt-2">This application link has expired or is invalid. Please contact the landlord for a new link.</p>
        </div>
      </div>
    )
  }

  const { data: property } = await admin
    .from('properties')
    .select('address, property_type, monthly_rent')
    .eq('id', property_id)
    .maybeSingle()

  return <ApplicationForm propertyId={property_id} token={token} property={property} />
}
