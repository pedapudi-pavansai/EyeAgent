import manifest from '@/lib/property-images-manifest.json'

const filenames = manifest as string[]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Stable image URL for a single property (same id → same image). */
export function getPropertyImageUrl(entityId: string): string {
  if (filenames.length === 0) return ''
  const idx = hashString(entityId) % filenames.length
  return `/property-images/${filenames[idx]}`
}

/**
 * Assigns a unique image from the pool to each id when possible (no repeats until pool exhausted).
 * Use for grids so concurrent properties never share a photo.
 */
export function assignDistinctPropertyImageUrls(ids: string[]): Record<string, string> {
  const n = filenames.length
  const out: Record<string, string> = {}
  if (n === 0 || ids.length === 0) return out

  const used = new Set<number>()

  for (const id of ids) {
    let idx = hashString(id) % n
    let scanned = 0
    while (used.has(idx) && scanned < n) {
      idx = (idx + 1) % n
      scanned++
    }
    used.add(idx)
    out[id] = `/property-images/${filenames[idx]}`
  }

  return out
}

export function propertyImagePoolSize(): number {
  return filenames.length
}
