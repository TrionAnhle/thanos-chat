const AUTH_STORAGE_KEY = 'thanos-chat-auth'

const saveAuthSession = (authState) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (!authState) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  } catch (error) {
    console.warn('Can not save login information', error)
  }
}

const loadAuthSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Can not read login information', error)
    return null
  }
}

export { AUTH_STORAGE_KEY, saveAuthSession, loadAuthSession }
