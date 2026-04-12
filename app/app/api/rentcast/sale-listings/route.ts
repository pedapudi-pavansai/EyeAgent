import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RENTCAST_SALE_URL = 'https://api.rentcast.io/v1/listings/sale'

const PASSTHROUGH = new Set([
  'address',
  'city',
  'state',
  'zipCode',
  'latitude',
  'longitude',
  'radius',
  'propertyType',
  'bedrooms',
  'bathrooms',
  'squareFootage',
  'lotSize',
  'yearBuilt',
  'status',
  'price',
  'daysOld',
  'limit',
  'offset',
])

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'landlord') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const key = process.env.RENTCAST_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Set RENTCAST_API_KEY in your environment (e.g. .env.local).' },
      { status: 503 }
    )
  }

  const src = req.nextUrl.searchParams
  const out = new URLSearchParams()

  for (const name of PASSTHROUGH) {
    const v = src.get(name)
    if (v != null && v !== '') out.set(name, v)
  }

  if (src.get('includeTotalCount') === '1' || src.get('includeTotalCount') === 'true') {
    out.set('includeTotalCount', 'true')
  }

  const url = out.toString() ? `${RENTCAST_SALE_URL}?${out}` : RENTCAST_SALE_URL
  const res = await fetch(url, {
    headers: { 'X-Api-Key': key },
    cache: 'no-store',
  })

  const totalHeader = res.headers.get('X-Total-Count')

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: text || res.statusText || 'RentCast request failed' },
      { status: res.status }
    )
  }

  const data: unknown = await res.json()
  const listings = Array.isArray(data) ? data : []
  const totalCount =
    totalHeader != null && totalHeader !== '' ? parseInt(totalHeader, 10) : null

  return NextResponse.json({
    listings,
    totalCount: Number.isFinite(totalCount) ? totalCount : null,
  })
}
