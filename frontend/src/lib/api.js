// Centralized API config so the base URL only needs to change in one place.
export const API_BASE_URL = 'http://localhost:8000/api'

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // some responses (e.g. 204) have no body
  }

  if (!res.ok) {
    const error = new Error(data?.error || data?.message || 'Request failed')
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}