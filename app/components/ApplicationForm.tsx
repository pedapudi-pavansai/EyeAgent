'use client'

import { useState } from 'react'

interface RentalEntry {
  address: string
  landlord_name: string
  landlord_phone: string
  duration: string
}

interface Props {
  propertyId: string
  token: string
  property: { address: string; property_type: string; monthly_rent: number } | null
}

export default function ApplicationForm({ propertyId, token, property }: Props) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [personal, setPersonal] = useState({ full_name: '', email: '', phone: '' })
  const [employment, setEmployment] = useState({ employer: '', job_title: '', annual_income: '' })
  const [rentalHistory, setRentalHistory] = useState<RentalEntry[]>([{ address: '', landlord_name: '', landlord_phone: '', duration: '' }])
  const [financial, setFinancial] = useState({ fico_score: '', monthly_debts: '' })

  function addRentalEntry() {
    setRentalHistory([...rentalHistory, { address: '', landlord_name: '', landlord_phone: '', duration: '' }])
  }

  function updateRental(idx: number, field: string, value: string) {
    const updated = [...rentalHistory]
    updated[idx] = { ...updated[idx], [field]: value }
    setRentalHistory(updated)
  }

  async function handleSubmit() {
    setLoading(true)
    setSubmitError('')
    const res = await fetch('/api/applications/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: propertyId,
        token,
        ...personal,
        employer: employment.employer,
        job_title: employment.job_title,
        annual_income: parseFloat(employment.annual_income),
        fico_score: parseInt(financial.fico_score, 10),
        monthly_debts: parseFloat(financial.monthly_debts),
        rental_history: rentalHistory,
      }),
    })
    let payload: { error?: string } = {}
    try {
      payload = await res.json()
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }
    if (!res.ok) {
      setSubmitError(typeof payload.error === 'string' ? payload.error : 'Submission failed')
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
          <p className="text-gray-500 mt-2">Your application has been received. The landlord will review it and get back to you soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-xl mx-auto">
        {property && (
          <div className="mb-6 rounded-xl bg-brand-subtle p-4">
            <p className="text-sm font-medium text-brand-foreground">Applying for:</p>
            <p className="font-bold text-brand">{property.address}</p>
            <p className="text-sm text-brand-foreground">
              {property.property_type} · ${property.monthly_rent?.toLocaleString()}/mo
            </p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">Step {step} of 5</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-3">
                <input placeholder="Full Name *" value={personal.full_name} onChange={e => setPersonal({...personal, full_name: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                <input type="email" placeholder="Email *" value={personal.email} onChange={e => setPersonal({...personal, email: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                <input placeholder="Phone *" value={personal.phone} onChange={e => setPersonal({...personal, phone: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Employment &amp; Income</h2>
              <div className="space-y-3">
                <input placeholder="Employer *" value={employment.employer} onChange={e => setEmployment({...employment, employer: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                <input placeholder="Job Title *" value={employment.job_title} onChange={e => setEmployment({...employment, job_title: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                <input type="number" placeholder="Annual Income ($) *" value={employment.annual_income} onChange={e => setEmployment({...employment, annual_income: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Rental History</h2>
              <div className="space-y-4">
                {rentalHistory.map((entry, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Previous Address {idx + 1}</p>
                    <input placeholder="Address" value={entry.address} onChange={e => updateRental(idx, 'address', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <input placeholder="Landlord Name" value={entry.landlord_name} onChange={e => updateRental(idx, 'landlord_name', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <input placeholder="Landlord Phone" value={entry.landlord_phone} onChange={e => updateRental(idx, 'landlord_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <input placeholder="Duration (e.g. 2 years)" value={entry.duration} onChange={e => updateRental(idx, 'duration', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                ))}
                <button onClick={addRentalEntry} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand hover:text-brand transition">
                  + Add Another Address
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Financial Health</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FICO Credit Score *</label>
                  <input type="number" placeholder="e.g. 720" value={financial.fico_score} onChange={e => setFinancial({...financial, fico_score: e.target.value})} min={300} max={850} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Debts ($) *</label>
                  <input type="number" placeholder="e.g. 500" value={financial.monthly_debts} onChange={e => setFinancial({...financial, monthly_debts: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review &amp; Submit</h2>
              {submitError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800" role="alert">
                  {submitError}
                </div>
              )}
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-1">Personal</p>
                  <p>{personal.full_name} · {personal.email} · {personal.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-1">Employment</p>
                  <p>{employment.employer} — {employment.job_title}</p>
                  <p>Income: ${parseInt(employment.annual_income || '0').toLocaleString()}/yr</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-1">Financials</p>
                  <p>FICO: {financial.fico_score} · Monthly Debts: ${financial.monthly_debts}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">Back</button>
            ) : <div />}
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
