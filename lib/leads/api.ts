import { type Lead } from '../types/lead'

const API_BASE = '/api/leads'

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update lead')
  }

  return response.json()
}