import apiClient from './apiClient.js'
import { loadAuthSession } from './authStorage.js'

const getAuthToken = (token) => {
  const resolvedToken = token ?? loadAuthSession()?.token
  if (!resolvedToken) {
    throw new Error('Authentication token is required')
  }
  return resolvedToken
}

const requestUploadUrl = async ({ filename, token }) => {
  const authToken = getAuthToken(token)
  const headers = { Authorization: `Bearer ${authToken}` }
  return apiClient.post('/images/upload', { filename }, { headers })
}

const putFileToPresignedUrl = async (presigned, file) => {
  const response = await fetch(presigned.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })

  console.log(response);

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  return presigned.preview ?? presigned.url?.split('?')[0] ?? presigned.url
}

const uploadAttachment = async (file, token) => {
  if (!file) {
    return null
  }
  const presigned = await requestUploadUrl({ filename: file.name, token })
  if (!presigned?.url) {
    throw new Error('Missing upload URL')
  }
  return putFileToPresignedUrl(presigned, file)
}

const imageService = {
  uploadAttachment,
}

export default imageService
