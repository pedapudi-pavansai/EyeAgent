import type { ReactNode } from 'react'
import type { Application, Profile } from '@/lib/types'
import ProfileAvatar from '@/components/ProfileAvatar'

interface Props {
  application: Application
  profile: Profile | null
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-gray-900">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="shrink-0 text-gray-500 sm:w-36">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  )
}

function RentalHistoryBlock({ data }: { data: unknown }) {
  if (data == null || (Array.isArray(data) && data.length === 0)) {
    return <p className="text-sm text-gray-500">None provided</p>
  }
  if (!Array.isArray(data)) {
    return (
      <pre className="max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-800 ring-1 ring-gray-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }
  return (
    <ul className="space-y-3">
      {data.map((entry: Record<string, unknown>, i: number) => (
        <li key={i} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          {typeof entry.address === 'string' && entry.address && (
            <p>
              <span className="text-gray-500">Address: </span>
              {entry.address}
            </p>
          )}
          {typeof entry.landlord_name === 'string' && entry.landlord_name && (
            <p>
              <span className="text-gray-500">Previous landlord: </span>
              {entry.landlord_name}
            </p>
          )}
          {typeof entry.landlord_phone === 'string' && entry.landlord_phone && (
            <p>
              <span className="text-gray-500">Landlord phone: </span>
              {entry.landlord_phone}
            </p>
          )}
          {typeof entry.duration === 'string' && entry.duration && (
            <p>
              <span className="text-gray-500">Duration: </span>
              {entry.duration}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function TenantDetailPanel({ application, profile }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">Active tenant</span>
        <span className="text-emerald-800"> — leased from application accepted on </span>
        {new Date(application.submitted_at).toLocaleDateString(undefined, {
          dateStyle: 'long',
        })}
        .
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <ProfileAvatar
          variant="tenant"
          size="md"
          alt=""
          className="ring-2 ring-emerald-100"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{application.full_name}</p>
          <p className="truncate text-sm text-gray-500">{application.email}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Contact">
          <Row label="Phone" value={application.phone} />
          {profile && (
            <>
              <Row label="Profile ID" value={<span className="font-mono text-xs">{profile.id}</span>} />
              {profile.created_at && (
                <Row
                  label="Account created"
                  value={new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                />
              )}
              <Row label="Role" value={profile.role} />
              {profile.business_name ? <Row label="Business" value={profile.business_name} /> : null}
            </>
          )}
        </Section>

        <Section title="Employment">
          <Row label="Employer" value={application.employer} />
          <Row label="Job title" value={application.job_title} />
          <Row
            label="Annual income"
            value={
              application.annual_income != null
                ? `$${Number(application.annual_income).toLocaleString()}/yr`
                : '—'
            }
          />
        </Section>

        <Section title="Financial">
          <Row label="FICO score" value={application.fico_score} />
          <Row
            label="Monthly debts"
            value={
              application.monthly_debts != null ? `$${Number(application.monthly_debts).toLocaleString()}` : '—'
            }
          />
        </Section>

        <Section title="Screening">
          <Row label="AI score" value={application.ai_score ?? '—'} />
          {application.ai_insights ? (
            <div className="mt-2 rounded-lg border border-teal-100 bg-brand-subtle/90 p-3">
              <p className="text-xs font-semibold text-brand-foreground">AI insights</p>
              <p className="mt-1 text-sm text-brand">{application.ai_insights}</p>
            </div>
          ) : (
            <Row label="AI insights" value="—" />
          )}
        </Section>
      </div>

      <Section title="Rental history">
        <RentalHistoryBlock data={application.rental_history} />
      </Section>
    </div>
  )
}
