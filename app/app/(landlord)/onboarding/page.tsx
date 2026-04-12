'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PropertyEntry {
  address: string
  unit_count: number
  property_type: string
  purchase_price: number
  monthly_rent: number
}

const PROPERTY_TYPES = ['Single Family', 'Multi-Family', 'Condo', 'Duplex', 'Townhouse', 'Commercial']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [personal, setPersonal] = useState({
    full_name: '', email: '', phone: '', business_name: ''
  })

  const [properties, setProperties] = useState<PropertyEntry[]>([{
    address: '', unit_count: 1, property_type: 'Single Family', purchase_price: 0, monthly_rent: 0
  }])

  const [financials, setFinancials] = useState({
    annual_income: '', total_debt: '', target_irr: '', preferred_markets: [] as string[]
  })

  const MARKETS = ['Austin, TX', 'Denver, CO', 'Nashville, TN', 'Dallas, TX', 'Phoenix, AZ', 'Atlanta, GA']

  function addProperty() {
    setProperties([...properties, { address: '', unit_count: 1, property_type: 'Single Family', purchase_price: 0, monthly_rent: 0 }])
  }

  function updateProperty(idx: number, field: string, value: string | number) {
    const updated = [...properties]
    updated[idx] = { ...updated[idx], [field]: value }
    setProperties(updated)
  }

  function toggleMarket(market: string) {
    setFinancials(prev => ({
      ...prev,
      preferred_markets: prev.preferred_markets.includes(market)
        ? prev.preferred_markets.filter(m => m !== market)
        : [...prev.preferred_markets, market]
    }))
  }

  function parseOptionalFloat(raw: string): number | null {
    const t = raw.trim()
    if (t === '') return null
    const n = parseFloat(t)
    return Number.isFinite(n) ? n : null
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const toSave = properties.filter(p => p.address.trim())
    if (toSave.length === 0) {
      setError('Add at least one property with a real street address on step 2 (spaces alone are not enough).')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: user.id,
        ...personal,
        role: 'landlord',
      })
      if (profileErr) {
        setError(profileErr.message)
        return
      }

      const { error: finErr } = await supabase.from('landlord_financials').upsert({
        landlord_id: user.id,
        annual_income: parseOptionalFloat(financials.annual_income),
        total_debt: parseOptionalFloat(financials.total_debt),
        target_irr: parseOptionalFloat(financials.target_irr),
        preferred_markets: financials.preferred_markets,
      })
      if (finErr) {
        setError(finErr.message)
        return
      }

      for (const prop of toSave) {
        const unit_count = Number.isFinite(prop.unit_count) && prop.unit_count >= 1 ? prop.unit_count : 1
        const purchase_price = Number.isFinite(prop.purchase_price) ? prop.purchase_price : null
        const monthly_rent = Number.isFinite(prop.monthly_rent) ? prop.monthly_rent : null
        const { error: propErr } = await supabase.from('properties').insert({
          address: prop.address.trim(),
          unit_count,
          property_type: prop.property_type,
          purchase_price,
          monthly_rent,
          landlord_id: user.id,
        })
        if (propErr) {
          setError(propErr.message)
          return
        }
      }

      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while saving.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Keystone</h1>
          <p className="text-gray-600 mt-1">Let&apos;s set up your account in a few steps</p>
          <div className="flex gap-2 mt-4">
            {[1,2,3,4].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-brand' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                {(['full_name', 'email', 'phone', 'business_name'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field.replace('_', ' ')}{field !== 'business_name' ? ' *' : ' (optional)'}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={personal[field]}
                      onChange={e => setPersonal({ ...personal, [field]: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Your Properties</h2>
              <div className="space-y-6">
                {properties.map((prop, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Property {idx + 1}</h3>
                    <div className="space-y-3">
                      <input
                        placeholder="Address"
                        value={prop.address}
                        onChange={e => updateProperty(idx, 'address', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Units</label>
                          <input
                            type="number"
                            min={1}
                            value={Number.isFinite(prop.unit_count) ? prop.unit_count : ''}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '') {
                                updateProperty(idx, 'unit_count', 1)
                                return
                              }
                              const n = parseInt(v, 10)
                              updateProperty(idx, 'unit_count', Number.isFinite(n) && n >= 1 ? n : 1)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select
                            value={prop.property_type}
                            onChange={e => updateProperty(idx, 'property_type', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Purchase Price</label>
                          <input
                            type="number"
                            min={0}
                            value={Number.isFinite(prop.purchase_price) ? prop.purchase_price : ''}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '') {
                                updateProperty(idx, 'purchase_price', 0)
                                return
                              }
                              const n = parseFloat(v)
                              updateProperty(idx, 'purchase_price', Number.isFinite(n) ? n : 0)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Monthly Rent</label>
                          <input
                            type="number"
                            min={0}
                            value={Number.isFinite(prop.monthly_rent) ? prop.monthly_rent : ''}
                            onChange={e => {
                              const v = e.target.value
                              if (v === '') {
                                updateProperty(idx, 'monthly_rent', 0)
                                return
                              }
                              const n = parseFloat(v)
                              updateProperty(idx, 'monthly_rent', Number.isFinite(n) ? n : 0)
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addProperty}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition"
                >
                  + Add Another Property
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Financial Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income ($)</label>
                  <input
                    type="number"
                    value={financials.annual_income}
                    onChange={e => setFinancials({ ...financials, annual_income: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Debt ($)</label>
                  <input
                    type="number"
                    value={financials.total_debt}
                    onChange={e => setFinancials({ ...financials, total_debt: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target IRR (%)</label>
                  <input
                    type="number"
                    value={financials.target_irr}
                    onChange={e => setFinancials({ ...financials, target_irr: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Markets</label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETS.map(market => (
                      <button
                        key={market}
                        type="button"
                        onClick={() => toggleMarket(market)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          financials.preferred_markets.includes(market)
                            ? 'bg-brand text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review &amp; Submit</h2>
              <div className="space-y-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Personal Info</h3>
                  <p>Name: {personal.full_name}</p>
                  <p>Email: {personal.email}</p>
                  <p>Phone: {personal.phone}</p>
                  {personal.business_name && <p>Business: {personal.business_name}</p>}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Properties ({properties.filter(p => p.address.trim()).length})</h3>
                  {properties.filter(p => p.address.trim()).map((p, i) => (
                    <p key={i}>{p.address} — {p.property_type}, {p.unit_count} unit(s)</p>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Financial Profile</h3>
                  <p>Annual Income: ${parseInt(financials.annual_income || '0').toLocaleString()}</p>
                  <p>Total Debt: ${parseInt(financials.total_debt || '0').toLocaleString()}</p>
                  <p>Target IRR: {financials.target_irr}%</p>
                  <p>Markets: {financials.preferred_markets.join(', ') || 'None selected'}</p>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-hover transition"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-hover transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
