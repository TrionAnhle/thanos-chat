import apiClient from './apiClient.js'
import { loadAuthSession } from './authStorage.js'

const getAuthToken = () => {
  const session = loadAuthSession()
  const token = session?.token
  if (!token) {
    throw new Error('Authentication token is required')
  }
  return token
}

const buildAuthHeaders = () => {
  const token = getAuthToken()
  return { Authorization: `Bearer ${token}` }
}

const toIsoTimestamp = (value) => {
  if (value === undefined || value === null) {
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const searchRooms = async ({ name, signal } = {}) => {
  const headers = buildAuthHeaders()
  const params = new URLSearchParams()
  if (name) {
    params.set('name', name)
  }
  const query = params.toString()
  const path = query ? `/rooms?${query}` : '/rooms'
  return await apiClient.get(path, { headers, signal })
}

const getMessages = async ({ roomId, timestamp, limit, signal } = {}) => {
  const headers = buildAuthHeaders()
  const params = new URLSearchParams()
  const isoTimestamp = toIsoTimestamp(timestamp)
  if (isoTimestamp) {
    params.set('timestamp', isoTimestamp)
  }

  if (limit) {
    params.set('limit', limit)
  }

  const query = params.toString()
  const path = query ? `/rooms/${roomId}/messages?${query}` : `/rooms/${roomId}/messages`

  return await apiClient.get(path, { headers, signal })
}

const roomService = {
  searchRooms,
  getMessages,
}

export default roomService
