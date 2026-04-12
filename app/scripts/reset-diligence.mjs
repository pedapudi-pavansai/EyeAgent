#!/usr/bin/env node
/**
 * Reset diligence columns on all applications (uses SUPABASE_SERVICE_ROLE_KEY from .env.local).
 * Usage: node scripts/reset-diligence.mjs
 * Also restart `npm run dev` to stop any in-flight worker on your machine.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const raw = readFileSync(envPath, 'utf8')
const env = {}
for (const line of raw.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const reset = {
  diligence_status: 'none',
  diligence_queued_at: null,
  diligence_started_at: null,
  diligence_completed_at: null,
  diligence_provider: null,
  diligence_external_order_id: null,
  diligence_report: null,
  diligence_error: null,
}

const { data, error } = await supabase
  .from('applications')
  .update(reset)
  .gte('submitted_at', '1970-01-01T00:00:00Z')
  .select('id')

if (error) {
  console.error(error)
  process.exit(1)
}

console.log(`Reset diligence on ${data?.length ?? 0} application(s). Restart npm run dev if a job was mid-flight.`)
