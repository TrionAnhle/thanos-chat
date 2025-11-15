import { useCallback, useEffect, useMemo, useState } from 'react'
import Message from '../components/Message.jsx'
import UserInput from '../components/UserInput.jsx'
import UserList from '../components/UserList.jsx'
import useSocket from '../hooks/useSocket.js'
import ChatEvents from '../config/chatEvents.js'

const createMessageId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

const ChatRoom = ({ user, onLeave }) => {
  const socket = useSocket()
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])

  const joinPayload = useMemo(() => ({ username: user.username, room: user.room }), [user])

  useEffect(() => {
    if (!socket) {
      return undefined
    }

    socket.emit(ChatEvents.JOIN, joinPayload)

    const handleMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    }

    const handleUsers = (payload) => {
      setUsers(payload?.users ?? [])
    }

    socket.on(ChatEvents.NEW_MESSAGE, handleMessage)
    socket.on('room_users', handleUsers)

    const handleError = (payload) => {
      console.error('Socket error', payload)
    }

    socket.on(ChatEvents.ERROR, handleError)

    return () => {
      socket.off(ChatEvents.NEW_MESSAGE, handleMessage)
      socket.off('room_users', handleUsers)
      socket.off(ChatEvents.ERROR, handleError)
      socket.emit(ChatEvents.LEAVE, joinPayload)
    }
  }, [joinPayload, socket])

  const handleSendMessage = useCallback(
    (text) => {
      if (!socket) {
        return
      }

      const optimisticMessage = {
        id: createMessageId(),
        author: user.username,
        text,
        timestamp: Date.now(),
      }

      setMessages((prevMessages) => [...prevMessages, optimisticMessage])
      socket.emit(ChatEvents.SEND_MESSAGE, { text, room: user.room })
    },
    [socket, user],
  )

  return (
    <section className="chat-room">
      <header className="chat-room__header">
        <div>
          <h1>Phòng: {user.room}</h1>
          <p>Xin chào, {user.username}</p>
        </div>
        <button type="button" onClick={onLeave}>
          Rời phòng
        </button>
      </header>

      <div className="chat-room__content">
        <UserList users={users} />
        <div className="chat-room__messages">
          {messages.length === 0 ? (
            <p className="chat-room__empty">Tin nhắn sẽ xuất hiện tại đây.</p>
          ) : (
            messages.map((message) => (
              <Message key={message.id ?? `${message.timestamp}-${message.author}`} {...message} />
            ))
          )}
        </div>
      </div>

      <UserInput onSend={handleSendMessage} />
    </section>
  )
}

export default ChatRoom
