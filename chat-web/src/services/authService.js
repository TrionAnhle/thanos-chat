import apiClient from './apiClient.js'

const login = async ({ username, password }) => {
  const response = await apiClient.post('/auth/signin', { username, password })
  return {
    token: response?.access_token,
  }
}

const register = async ({ email, name, username, password }) => {
  const response = await apiClient.post('/auth/signup', { email, name, username, password})
  return {
    token: response?.access_token,
  }
}

const authService = {
  login,
  register,
}

export default authService
