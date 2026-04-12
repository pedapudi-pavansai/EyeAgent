#!/usr/bin/env node
/**
 * Copies a random subset of JPGs from the combined dataset into public/property-images/
 * and writes lib/property-images-manifest.json for stable URL assignment.
 *
 * Usage:
 *   COMBINED_DIR="/path/to/combined" COUNT=150 node scripts/seed-property-images.mjs
 *
 * Defaults: COMBINED_DIR=$HOME/Downloads/combined, COUNT=150
 * Example (this repo’s home photo set): COMBINED_DIR="$HOME/Downloads/Our Home Imags"
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const destDir = path.join(root, 'public', 'property-images')
const manifestPath = path.join(root, 'lib', 'property-images-manifest.json')

const COMBINED_DIR = process.env.COMBINED_DIR || path.join(process.env.HOME || '', 'Downloads', 'combined')
const COUNT = Math.max(24, parseInt(process.env.COUNT || '150', 10) || 150)

if (!fs.existsSync(COMBINED_DIR)) {
  console.error('Source directory not found:', COMBINED_DIR)
  console.error('Set COMBINED_DIR to your combined folder path.')
  process.exit(1)
}

const all = fs.readdirSync(COMBINED_DIR).filter(f => /\.jpe?g$/i.test(f))
if (all.length === 0) {
  console.error('No jpg files in', COMBINED_DIR)
  process.exit(1)
}

// Fisher–Yates shuffle with crypto RNG
for (let i = all.length - 1; i > 0; i--) {
  const j = crypto.randomInt(0, i + 1)
  ;[all[i], all[j]] = [all[j], all[i]]
}

const pick = all.slice(0, Math.min(COUNT, all.length))
fs.mkdirSync(destDir, { recursive: true })

// Clear previous numbered jpgs
for (const f of fs.readdirSync(destDir)) {
  if (/^\d+\.jpe?g$/i.test(f)) fs.unlinkSync(path.join(destDir, f))
}

const manifest = []
for (let i = 0; i < pick.length; i++) {
  const outName = `${i}.jpg`
  fs.copyFileSync(path.join(COMBINED_DIR, pick[i]), path.join(destDir, outName))
  manifest.push(outName)
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0) + '\n', 'utf8')
console.log(`Wrote ${manifest.length} images to public/property-images/`)
console.log(`Manifest: lib/property-images-manifest.json`)
