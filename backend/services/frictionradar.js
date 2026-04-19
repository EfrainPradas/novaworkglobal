/**
 * Internal client for the external intelligence service.
 *
 * Server-to-server only. All requests carry a fixed internal token.
 * Never exposed to the browser. Responses are raw and must be passed
 * through smartMatchTranslator before reaching the UI.
 */

import axios from 'axios'

const BASE_URL = process.env.FRICTIONRADAR_URL
const TOKEN = process.env.FRICTIONRADAR_INTERNAL_TOKEN
const TIMEOUT_MS = 30_000

function client() {
  if (!BASE_URL) {
    const err = new Error('FRICTIONRADAR_URL not configured')
    err.status = 503
    throw err
  }
  if (!TOKEN) {
    const err = new Error('FRICTIONRADAR_INTERNAL_TOKEN not configured')
    err.status = 503
    throw err
  }
  return axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': TOKEN,
    },
  })
}

async function withRetry(fn) {
  try {
    return await fn()
  } catch (err) {
    const status = err?.response?.status
    if (status && status >= 500 && status < 600) {
      return await fn()
    }
    throw err
  }
}

export async function matchCandidate(payload) {
  const http = client()
  const { data } = await withRetry(() => http.post('/internal/v1/match', payload))
  return data
}

export async function resolveCompany(domain) {
  const http = client()
  const { data } = await withRetry(() =>
    http.get('/internal/v1/companies/resolve', { params: { domain } }),
  )
  return data
}

export async function getSnapshot(companyId, { refresh = false } = {}) {
  const http = client()
  const { data } = await withRetry(() =>
    http.get(`/internal/v1/companies/${companyId}/snapshot`, {
      params: { refresh },
    }),
  )
  return data
}
