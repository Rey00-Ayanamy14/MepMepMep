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

function generateRequestId() {
  return Math.random().toString(36).substring(REQUEST_ID_LENGTH)
}

function prepareBaseHeaders(customHeaders = {}) {
  return {
    [HEADER_ACCEPT]: MIME_TYPE_JSON,
    ...customHeaders
  }
}

function addAuthorizationHeader(headers, token) {
  if (token) {
    headers[HEADER_AUTHORIZATION] = `Bearer ${token}`
  }
  return headers
}

function prepareBody(body, headers) {
  if (body instanceof FormData) {
    return { body, headers }
  }
  
  if (body !== undefined && body !== null) {
    return {
      body: JSON.stringify(body),
      headers: {
        ...headers,
        [HEADER_CONTENT_TYPE]: MIME_TYPE_JSON
      }
    }
  }
  
  return { body: undefined, headers }
}

function prepareFetchOptions(method, customHeaders, token, body) {
  let headers = prepareBaseHeaders(customHeaders)
  headers = addAuthorizationHeader(headers, token)
  
  const { body: preparedBody, headers: updatedHeaders } = prepareBody(body, headers)
  
  return {
    method,
    headers: updatedHeaders,
    credentials: 'same-origin',
    body: preparedBody
  }
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

  const requestId = generateRequestId()
  const startTime = Date.now()

  const url = buildUrl(path, params)
  const fetchOptions = prepareFetchOptions(method, headers, token, body)

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
