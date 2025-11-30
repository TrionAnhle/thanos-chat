const normalizeBaseUrl = (rawUrl) => {
  if (!rawUrl) {
    return null
  }

  return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`
}

const API_CONFIG = Object.freeze({
  baseUrl: normalizeBaseUrl(import.meta.env.VITE_API_URL ?? 'http://163.223.8.148:3000'),
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 10000),
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
})

export default API_CONFIG
