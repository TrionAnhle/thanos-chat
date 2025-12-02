import { createSlice } from '@reduxjs/toolkit'
import { loadAuthSession } from '../services/authStorage.js'

const VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  JOIN: 'join',
}

const initialSession = loadAuthSession()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    session: initialSession,
    view: initialSession ? VIEWS.JOIN : VIEWS.LOGIN,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.session = action.payload
      state.view = VIEWS.JOIN
    },
    logout: (state) => {
      state.session = null
      state.view = VIEWS.LOGIN
    },
    setView: (state, action) => {
      state.view = action.payload
    },
  },
})

export const { loginSuccess, logout, setView } = authSlice.actions
export { VIEWS }
export default authSlice.reducer
