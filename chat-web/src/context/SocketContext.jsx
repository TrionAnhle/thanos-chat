import { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { loadAuthSession, saveAuthSession } from '../services/authStorage.js'
import ChatEvents from '../config/chatEvents.js'

const SocketContext = createContext(null)

const buildSocketAuth = () => {
  const session = loadAuthSession()
  if (!session?.token) {
    return {}
  }

  return { token: session.token }
}

const SocketProvider = ({ children }) => {
  const [socket] = useState(() =>
    io(import.meta.env.VITE_SOCKET_URL ?? 'http://163.223.8.148:3000/chat', {
      autoConnect: false,
      auth: buildSocketAuth(),
      transports: ['websocket'],
    }),
  )

  const handleSocketError = (payload) => {
    console.error('Socket error event', payload)
    if (payload?.success === false) {
      saveAuthSession(null)
      if (typeof window !== 'undefined') {
        window.location.assign('/')
      }
    }
  }

  useEffect(() => {
    const socketInstance = socket
    socketInstance.connect()
    socketInstance.on(ChatEvents.ERROR, handleSocketError)

    return () => {
      socketInstance.off(ChatEvents.ERROR, handleSocketError)
      socketInstance.disconnect()
    }
  }, [socket])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export { SocketContext, SocketProvider }
