'use client'

import { useState } from 'react'
import type { ServiceRequest, ServiceRequestStatus } from '@/lib/types'

interface Props {
  serviceRequest: ServiceRequest
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
}

export default function ServiceRequestCard({ serviceRequest }: Props) {
  const [status, setStatus] = useState<ServiceRequestStatus>(serviceRequest.status)
  const [notes, setNotes] = useState(serviceRequest.landlord_notes || '')
  const [saving, setSaving] = useState(false)

  async function updateRequest() {
    setSaving(true)
    await fetch('/api/service-requests/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: serviceRequest.id, status, landlord_notes: notes })
    })
    setSaving(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{serviceRequest.category}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
              {status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{serviceRequest.description}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(serviceRequest.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as ServiceRequestStatus)}
          className="rounded border border-slate-200 bg-gray-50 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add landlord notes..."
          className="w-full rounded border border-slate-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          rows={2}
        />
        <button
          onClick={updateRequest}
          disabled={saving}
          className="rounded bg-brand px-3 py-1 text-xs text-white transition hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
