import apiClient from './apiClient.js'

const login = async ({ username, password }) => {
  return await apiClient.post('/auth/signin', { username, password })
}

const register = async ({ email, name, username, password }) => {
  return await apiClient.post('/auth/signup', { email, name, username, password})
}

const authService = {
  login,
  register,
}

export default authService
