const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const buildUrl = (path, params) => {
  const base = path.startsWith('http') ? path : `${API_URL}${path}`
  const url = new URL(base)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.append(key, value)
    })
  }
  return url
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    params,
    headers = {}
  } = options

  const url = buildUrl(path, params)
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers
    },
    credentials: 'same-origin'
  }

  if (token) {
    init.headers.Authorization = `Bearer ${token}`
  }

  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined && body !== null) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const response = await fetch(url, init)
  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
        payload?.error ||
        `Ошибка ${response.status}: ${response.statusText}`
    )
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export { API_URL }
