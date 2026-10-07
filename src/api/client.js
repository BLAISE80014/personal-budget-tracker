const API_TOKEN_KEY = 'budget-tracker-api-token'
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const getApiToken = () => localStorage.getItem(API_TOKEN_KEY)
export const setApiToken = (token) => localStorage.setItem(API_TOKEN_KEY, token)
export const clearApiToken = () => localStorage.removeItem(API_TOKEN_KEY)

export async function apiRequest(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = authenticated ? getApiToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the budget API. Make sure the backend is running on http://localhost:5000.', 0)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    const contentType = response.headers.get('content-type') || 'unknown content type'
    throw new ApiError(
      `The budget API returned a non-JSON response (HTTP ${response.status}, ${contentType}). Make sure the backend is running on http://localhost:5000 and its environment and MongoDB are configured.`,
      response.status,
    )
  }
  if (!response.ok || payload.success !== true) {
    throw new ApiError(payload.error?.message || `Request failed with status ${response.status}.`, response.status)
  }
  return payload.data
}
