import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import authReducer, { loginSuccess, logout } from './authSlice.js'
import chatReducer from './chatSlice.js'
import { saveAuthSession } from '../services/authStorage.js'

const authListener = createListenerMiddleware()

authListener.startListening({
  matcher: isAnyOf(loginSuccess, logout),
  effect: async (action) => {
    const session = action.type === loginSuccess.type ? action.payload : null
    saveAuthSession(session)
  },
})

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(authListener.middleware),
})

export default store
