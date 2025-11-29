import { useContext } from 'react'
import { SocketContext } from '../context/SocketContext.jsx'

const useSocket = () => {
  const socket = useContext(SocketContext)

  if (!socket) {
    throw new Error('useSocket must be call in SocketProvider')
  }

  return socket
}

export default useSocket
