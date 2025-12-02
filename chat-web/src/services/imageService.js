import apiClient from './apiClient.js'
import { loadAuthSession } from './authStorage.js'

const getAuthToken = () => {
  const session = loadAuthSession();
  const token = session?.token;
  if (!token) {
    throw new Error("Authentication token is required");
  }
  return token;
};

const requestUploadUrl = async ({ filename }) => {
  const authToken = getAuthToken()
  const headers = { Authorization: `Bearer ${authToken}` }
  return apiClient.post('/images/upload', { filename }, { headers })
}

const putFileToPresignedUrl = async (presigned, file) => {
  const response = await fetch(presigned.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  return presigned.preview ?? presigned.url?.split('?')[0] ?? presigned.url
}

const uploadAttachment = async (file) => {
  if (!file) {
    return null
  }
  const presigned = await requestUploadUrl({ filename: file.name })
  if (!presigned?.url) {
    throw new Error('Missing upload URL')
  }
  return putFileToPresignedUrl(presigned, file)
}

const imageService = {
  uploadAttachment,
}

export default imageService
