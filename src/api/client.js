const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const DEFAULT_TIMEOUT = 30000
const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000
const REQUEST_ID_LENGTH = 7

const HEADER_ACCEPT = 'Accept'
const HEADER_CONTENT_TYPE = 'Content-Type'
const HEADER_AUTHORIZATION = 'Authorization'
const MIME_TYPE_JSON = 'application/json'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateDelay(attempt) {
  return RETRY_DELAY * (attempt + 1)
}

async function withRetry(fn, retries = MAX_RETRY_COUNT) {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      await sleep(calculateDelay(i))
    }
  }
  throw lastError
}

const buildUrl = (endpoint, queryParams) => {
  const base = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`
  const url = new URL(base)
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.append(key, value)
    })
  }
  return url
}

const buildUrlString = (endpoint, queryParams) => {
  const fullPath = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`
  const urlObj = new URL(fullPath)
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== '') {
        urlObj.searchParams.set(k, v)
      }
    }
  }
  return urlObj.toString()
}

function logRequest(method, url, body) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${url}`, body || '')
  }
}

function logResponse(url, status, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Response] ${url} - ${status}`, data)
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function parseResponsePayload(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function createApiError(response, payload, requestId) {
  const error = new Error(
    payload?.message ||
      payload?.error ||
      `Ошибка ${response.status}: ${response.statusText}`
  )
  error.status = response.status
  error.payload = payload
  error.requestId = requestId
  return error
}

async function handleResponse(response, requestId) {
  const text = await response.text()
  const payload = parseResponsePayload(text)
  
  if (!response.ok) {
    throw createApiError(response, payload, requestId)
  }
  
  return payload
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    params,
    headers = {},
    timeout = DEFAULT_TIMEOUT
  } = options

  const requestId = Math.random().toString(36).substring(REQUEST_ID_LENGTH)
  const startTime = Date.now()

  const url = buildUrl(path, params)
  const fetchOptions = {
    method,
    headers: {
      [HEADER_ACCEPT]: MIME_TYPE_JSON,
      ...headers
    },
    credentials: 'same-origin'
  }

  if (token) {
    fetchOptions.headers[HEADER_AUTHORIZATION] = `Bearer ${token}`
  }

  if (body instanceof FormData) {
    fetchOptions.body = body
  } else if (body !== undefined && body !== null) {
    fetchOptions.headers[HEADER_CONTENT_TYPE] = MIME_TYPE_JSON
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetchWithTimeout(url, fetchOptions, timeout)
  
  const duration = Date.now() - startTime
  
  return handleResponse(response, requestId)
}

async function apiGet(path, token) {
  return apiRequest(path, { method: 'GET', token })
}

async function apiPost(path, body, token) {
  return apiRequest(path, { method: 'POST', body, token })
}

async function apiPut(path, body, token) {
  return apiRequest(path, { method: 'PUT', body, token })
}

async function apiDelete(path, token) {
  return apiRequest(path, { method: 'DELETE', token })
}

export { API_URL }
