'use client'

import { useEffect, useRef, useCallback, type CSSProperties } from 'react'
import createGlobe from 'cobe'

/** Keystone brand teal — matches `globals.css` --color-brand */
const BRAND = '#0f766e'
const BRAND_RGB: [number, number, number] = [15 / 255, 118 / 255, 110 / 255]

export interface PulseMarker {
  id: string
  location: [number, number]
  delay: number
}

interface GlobePulseProps {
  markers?: PulseMarker[]
  className?: string
  /** Auto-rotation speed (radians per frame when not dragging). */
  speed?: number
}

/** Global cities — staggered pulse delays so rings don’t sync. */
export const defaultPulseMarkers: PulseMarker[] = [
  { id: 'nyc', location: [40.7128, -74.006], delay: 0 },
  { id: 'la', location: [34.0522, -118.2437], delay: 0.12 },
  { id: 'chi', location: [41.8781, -87.6298], delay: 0.24 },
  { id: 'hou', location: [29.7604, -95.3698], delay: 0.36 },
  { id: 'mia', location: [25.7617, -80.1918], delay: 0.48 },
  { id: 'sea', location: [47.6062, -122.3321], delay: 0.6 },
  { id: 'atl', location: [33.749, -84.388], delay: 0.72 },
  { id: 'den', location: [39.7392, -104.9903], delay: 0.84 },
  { id: 'phx', location: [33.4484, -112.074], delay: 0.96 },
  { id: 'dal', location: [32.7767, -96.797], delay: 1.08 },
  { id: 'bos', location: [42.3601, -71.0589], delay: 1.2 },
  { id: 'dc', location: [38.9072, -77.0369], delay: 1.32 },
  { id: 'tor', location: [43.6532, -79.3832], delay: 1.44 },
  { id: 'yvr', location: [49.2827, -123.1207], delay: 1.56 },
  { id: 'mex', location: [19.4326, -99.1332], delay: 1.68 },
  { id: 'gru', location: [-23.5505, -46.6333], delay: 1.8 },
  { id: 'lim', location: [-12.0464, -77.0428], delay: 1.92 },
  { id: 'lon', location: [51.5074, -0.1278], delay: 2.04 },
  { id: 'par', location: [48.8566, 2.3522], delay: 2.16 },
  { id: 'ber', location: [52.52, 13.405], delay: 2.28 },
  { id: 'mad', location: [40.4168, -3.7038], delay: 2.4 },
  { id: 'ams', location: [52.3676, 4.9041], delay: 2.52 },
  { id: 'rom', location: [41.9028, 12.4964], delay: 2.64 },
  { id: 'dxb', location: [25.2048, 55.2708], delay: 2.76 },
  { id: 'tlv', location: [32.0853, 34.7818], delay: 2.88 },
  { id: 'bom', location: [19.076, 72.8777], delay: 3 },
  { id: 'sin', location: [1.3521, 103.8198], delay: 3.12 },
  { id: 'bkk', location: [13.7563, 100.5018], delay: 3.24 },
  { id: 'hkg', location: [22.3193, 114.1694], delay: 3.36 },
  { id: 'tok', location: [35.6762, 139.6503], delay: 3.48 },
  { id: 'icn', location: [37.5665, 126.978], delay: 3.6 },
  { id: 'sha', location: [31.2304, 121.4737], delay: 3.72 },
  { id: 'syd', location: [-33.8688, 151.2093], delay: 3.84 },
  { id: 'akl', location: [-36.8485, 174.7633], delay: 3.96 },
  { id: 'cpt', location: [-33.9249, 18.4241], delay: 4.08 },
  { id: 'cai', location: [30.0444, 31.2357], delay: 4.2 },
  { id: 'lag', location: [6.5244, 3.3792], delay: 4.32 },
  { id: 'phl', location: [39.9526, -75.1652], delay: 4.44 },
  { id: 'det', location: [42.3314, -83.0458], delay: 4.56 },
  { id: 'pdx', location: [45.5152, -122.6784], delay: 4.68 },
  { id: 'las', location: [36.1699, -115.1398], delay: 4.8 },
  { id: 'nsh', location: [36.1627, -86.7816], delay: 4.92 },
  { id: 'mco', location: [28.5383, -81.3792], delay: 5.04 },
  { id: 'sfo', location: [37.7749, -122.4194], delay: 5.16 },
  { id: 'mtl', location: [45.5017, -73.5673], delay: 5.28 },
  { id: 'bog', location: [4.711, -74.0721], delay: 5.4 },
  { id: 'scl', location: [-33.4489, -70.6693], delay: 5.52 },
  { id: 'bue', location: [-34.6037, -58.3816], delay: 5.64 },
  { id: 'rio', location: [-22.9068, -43.1729], delay: 5.76 },
  { id: 'dub', location: [53.3498, -6.2603], delay: 5.88 },
  { id: 'lis', location: [38.7223, -9.1393], delay: 6 },
  { id: 'vie', location: [48.2082, 16.3738], delay: 6.12 },
  { id: 'ist', location: [41.0082, 28.9784], delay: 6.24 },
  { id: 'war', location: [52.2297, 21.0122], delay: 6.36 },
  { id: 'del', location: [28.6139, 77.209], delay: 6.48 },
  { id: 'tpe', location: [25.033, 121.5654], delay: 6.6 },
  { id: 'kul', location: [3.139, 101.6869], delay: 6.72 },
  { id: 'han', location: [21.0285, 105.8542], delay: 6.84 },
  { id: 'mnl', location: [14.5995, 120.9842], delay: 6.96 },
  { id: 'jak', location: [-6.2088, 106.8456], delay: 7.08 },
  { id: 'mel', location: [-37.8136, 144.9631], delay: 7.2 },
  { id: 'per', location: [-31.9505, 115.8605], delay: 7.32 },
  { id: 'nbo', location: [-1.2921, 36.8219], delay: 7.44 },
  { id: 'jnb', location: [-26.2041, 28.0473], delay: 7.56 },
  { id: 'add', location: [9.032, 38.7469], delay: 7.68 },
]

export function GlobePulse({
  markers = defaultPulseMarkers,
  className = '',
  speed = 0.0025,
}: GlobePulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    let phi = 0
    let rafId = 0
    let globe: ReturnType<typeof createGlobe> | null = null

    const buildMarkers = () =>
      markers.map((m) => ({
        location: m.location,
        size: 0.026,
        id: m.id,
      }))

    const tick = () => {
      if (!globe) return
      if (!isPausedRef.current) phi -= speed
      globe.update({
        phi: phi + phiOffsetRef.current + dragOffset.current.phi,
        theta: 0.22 + thetaOffsetRef.current + dragOffset.current.theta,
      })
      rafId = requestAnimationFrame(tick)
    }

    const mountGlobe = (side: number) => {
      globe?.destroy()
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
        width: side,
        height: side,
        phi: 0,
        theta: 0.22,
        dark: 1,
        diffuse: 1.35,
        mapSamples: 16000,
        mapBrightness: 9,
        baseColor: [0.14, 0.16, 0.17],
        markerColor: BRAND_RGB,
        glowColor: [0.06, 0.1, 0.09],
        markerElevation: 0.02,
        scale: 1.25,
        offset: [0, 0.04],
        markers: buildMarkers(),
        opacity: 0.92,
      })
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(tick)
      canvas.style.opacity = '1'
    }

    const onResize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const side = Math.max(280, Math.min(w, h))
      if (side < 2) return
      if (!globe) {
        mountGlobe(side)
      } else {
        globe.update({ width: side, height: side, markers: buildMarkers() })
      }
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(wrap)
    onResize()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      globe?.destroy()
      globe = null
      canvas.style.opacity = '0'
    }
  }, [markers, speed])

  const anchorStyle = (id: string): CSSProperties =>
    ({
      position: 'absolute',
      positionAnchor: `--cobe-${id}`,
      bottom: 'anchor(center)',
      left: 'anchor(center)',
      translate: '-50% 50%',
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      opacity: `var(--cobe-visible-${id}, 0)`,
      filter: `blur(calc((1 - var(--cobe-visible-${id}, 0)) * 8px))`,
      transition: 'opacity 0.4s, filter 0.4s',
    }) as CSSProperties

  return (
    <div ref={wrapRef} className={`relative aspect-square h-full w-full max-h-full max-w-full select-none ${className}`}>
      <style>{`
        @keyframes pulse-expand-brand {
          0% { transform: scale(0.35); opacity: 0.85; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="rounded-full"
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 1.2s ease',
          touchAction: 'none',
        }}
      />
      {markers.map((m) => (
        <div key={m.id} style={anchorStyle(m.id)}>
          <span
            className="absolute inset-0 rounded-full opacity-0"
            style={{
              border: `2px solid ${BRAND}`,
              animation: `pulse-expand-brand 2.2s ease-out infinite ${m.delay}s`,
            }}
          />
          <span
            className="absolute inset-0 rounded-full opacity-0"
            style={{
              border: `2px solid ${BRAND}`,
              animation: `pulse-expand-brand 2.2s ease-out infinite ${m.delay + 0.55}s`,
            }}
          />
          <span
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              background: BRAND,
              boxShadow: `0 0 0 3px #0a0a0a, 0 0 0 5px ${BRAND}`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
