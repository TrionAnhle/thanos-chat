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

const getProfile = async ({ signal } = {}) => {
  const headers = buildAuthHeaders()
  return await apiClient.get('/users/profile', { headers, signal })
}

const getRecentChats = async ({ signal } = {}) => {
  const headers = buildAuthHeaders()
  return await apiClient.get('/users/recent/chat', { headers, signal })
}

const userService = {
  getProfile,
  getRecentChats,
}

export default userService
