import { useCallback, useEffect, useState } from 'react'
import Message from '../components/Message.jsx'
import UserInput from '../components/UserInput.jsx'
import useSocket from '../hooks/useSocket.js'
import ChatEvents from '../config/chatEvents.js'

const ChatRoom = ({ room, onLeave }) => {
  const socket = useSocket()
  const [messages, setMessages] = useState([])
  const roomId = typeof room === 'string' ? room : room?.id ?? null
  const roomType = typeof room === 'string' ? 'GROUP' : room?.type ?? 'GROUP'
  const roomTitle = typeof room === 'string' ? room : room?.name ?? room?.username ?? 'Untitled room'

  useEffect(() => {
    if (!socket || !roomId) {
      return undefined
    }

    const joinPayload = { roomId }

    const handleMessage = (message) => {
      console.log(message)
      setMessages((prevMessages) => [...prevMessages, message])
    }
    const handleError = (payload) => {
      console.error('Socket error', payload)
    }

    socket.emit(ChatEvents.JOIN, joinPayload)
    socket.on(ChatEvents.NEW_MESSAGE, handleMessage)
    socket.on(ChatEvents.ERROR, handleError)

    return () => {
      socket.off(ChatEvents.NEW_MESSAGE, handleMessage)
      socket.off(ChatEvents.ERROR, handleError)
      socket.emit(ChatEvents.LEAVE, joinPayload)
    }
  }, [roomId, socket])

  const handleSendMessage = useCallback(
    (text) => {
      if (!socket || !roomId) {
        return
      }
      socket.emit(ChatEvents.SEND_MESSAGE, {
        roomId,
        type: roomType,
        content: text,
      })
    },
    [roomId, roomType, socket],
  )

  return (
    <section className="chat-room">
      <header className="chat-room__header">
        <div>
          <h1>{roomType === 'GROUP' ? `#${roomTitle}` : roomTitle}</h1>
        </div>
        <button type="button" onClick={onLeave}>
          Leave
        </button>
      </header>

      <div className="chat-room__content">
        <div className="chat-room__messages">
          {messages.length === 0 ? (
            <p className="chat-room__empty">Tin nhắn sẽ xuất hiện tại đây.</p>
          ) : (
            messages.map((message) => (
              <Message key={message.id} {...message} />
            ))
          )}
        </div>
      </div>
      <UserInput onSend={handleSendMessage} />
    </section>
  )
}

export default ChatRoom
