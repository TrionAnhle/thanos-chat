import API_CONFIG from '../config/apiConfig.js'
import { AUTH_STORAGE_KEY } from './authStorage.js'

const ensureBaseUrl = () => {
  if (!API_CONFIG.baseUrl) {
    throw new Error('No_API_URL config')
  }

  return API_CONFIG.baseUrl
}

const buildUrl = (path) => {
  if (!path) {
    throw new Error('URL must not be empty')
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseUrl = ensureBaseUrl()
  const sanitizedPath = path.startsWith('/') ? path.slice(1) : path
  return new URL(sanitizedPath, baseUrl).toString()
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  return isJson ? await response.json() : await response.text()
}

const redirectToLogin = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (storageError) {
    console.warn('Unable to clear auth session', storageError)
  }

  if (window.location.pathname === '/') {
    window.location.reload()
  } else {
    window.location.assign('/')
  }
}

const request = async (path, { method = 'GET', data, headers, signal, ...rest } = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  const normalizedHeaders = {
    ...API_CONFIG.defaultHeaders,
    ...headers,
  }
  const hasAuthHeader = Boolean(normalizedHeaders.Authorization ?? normalizedHeaders.authorization)

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: normalizedHeaders,
      body: data ? JSON.stringify(data) : undefined,
      signal: signal ?? controller.signal,
      ...rest,
    })

    const body = await parseResponse(response)

    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && hasAuthHeader) {
        redirectToLogin()
      }

      const error = new Error(body?.message ?? `Request failed with status ${response.status}`)
      error.status = response.status
      error.body = body
      throw error
    }

    return body
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Time out when call API')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const apiClient = {
  request,
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, data, options) => request(path, { ...options, method: 'POST', data }),
  put: (path, data, options) => request(path, { ...options, method: 'PUT', data }),
  patch: (path, data, options) => request(path, { ...options, method: 'PATCH', data }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export default apiClient
