'use client'

import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { RentCastSaleListing } from '@/lib/types'

const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431]
const DEFAULT_ZOOM = 11

function fixLeafletIcons() {
  const proto = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string }
  delete proto._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

function MapBoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      return
    }
    if (positions.length === 1) {
      map.setView(positions[0], 14)
      return
    }
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, positions])
  return null
}

function formatPrice(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

interface Props {
  listings: RentCastSaleListing[]
}

export default function MarketplaceMap({ listings }: Props) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const { points, positions } = useMemo(() => {
    const pts = listings.filter(
      l =>
        typeof l.latitude === 'number' &&
        typeof l.longitude === 'number' &&
        !Number.isNaN(l.latitude) &&
        !Number.isNaN(l.longitude)
    )
    const pos = pts.map(l => [l.latitude!, l.longitude!] as [number, number])
    return { points: pts, positions: pos }
  }, [listings])

  return (
    <div className="h-full min-h-[320px] w-full rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:z-0">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsFitter positions={positions} />
        {points.map(l => {
          const priceLabel = formatPrice(l.price)
          const bedsBaths = [l.bedrooms != null ? `${l.bedrooms} bd` : null, l.bathrooms != null ? `${l.bathrooms} ba` : null]
            .filter(Boolean)
            .join(' · ')
          return (
            <Marker key={l.id} position={[l.latitude!, l.longitude!]}>
              <Popup>
                <div className="text-sm max-w-[220px]">
                  <p className="font-semibold leading-snug">
                    {l.formattedAddress || l.addressLine1 || 'Listing'}
                  </p>
                  {priceLabel && <p className="text-gray-800 mt-1 font-medium">{priceLabel}</p>}
                  {bedsBaths ? <p className="text-xs text-gray-600 mt-1">{bedsBaths}</p> : null}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
