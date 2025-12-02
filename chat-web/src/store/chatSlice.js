import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chatUser: null,
  },
  reducers: {
    setChatUser: (state, action) => {
      state.chatUser = action.payload
    },
    clearChatUser: (state) => {
      state.chatUser = null
    },
  },
})

export const { setChatUser, clearChatUser } = chatSlice.actions
export default chatSlice.reducer
