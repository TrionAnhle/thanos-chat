import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Message from '../components/Message.jsx'
import UserInput from '../components/UserInput.jsx'
import useSocket from '../hooks/useSocket.js'
import ChatEvents from '../config/chatEvents.js'
import { loadAuthSession } from '../services/authStorage.js'
import roomService from '../services/roomService.js'

const PAGE_LIMIT = 20
const getTimestampValue = (rawTimestamp) => {
  if (!rawTimestamp) {
    return 0
  }
  const value = new Date(rawTimestamp).getTime()
  return Number.isFinite(value) ? value : 0
}
const getMessageTimestampValue = (message) => getTimestampValue(message?.timestamp ?? message?.createdAt ?? message?.created_at)
const sortMessagesAscending = (messages = []) => [...messages].sort((a, b) => getMessageTimestampValue(a) - getMessageTimestampValue(b))
const extractMessages = (payload) => (Array.isArray(payload) ? payload : payload?.messages ?? [])

const ChatRoom = ({room, onLeave }) => {
  const socket = useSocket()
  const session = loadAuthSession()
  const [messages, setMessages] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const messagesContainerRef = useRef(null)
  const roomType = typeof room === 'string' ? 'GROUP' : room?.type ?? 'GROUP'
  const roomTitle = typeof room === 'string' ? room : room?.name ?? room?.username ?? 'Untitled room'
  const roomId =
    typeof room === 'string'
      ? room
      : room?.id ?? room?.roomId ?? room?.room_id ?? room?.name ?? room?.username ?? session?.id

  const oldestTimestamp = useMemo(() => {
    if (messages.length === 0) {
      return null
    }
    return messages.reduce((oldest, message) => {
      const currentTimestamp = message?.timestamp ?? message?.createdAt ?? message?.created_at
      if (!oldest) {
        return currentTimestamp
      }
      return getTimestampValue(currentTimestamp) < getTimestampValue(oldest) ? currentTimestamp : oldest
    }, null)
  }, [messages])

  useEffect(() => {
    if (!roomId) {
      setMessages([])
      setHasMoreHistory(true)
      return undefined
    }

    const abortController = new AbortController()
    const container = messagesContainerRef.current

    const fetchInitialMessages = async () => {
      setIsLoadingHistory(true)
      try {
        const response = await roomService.getMessages({
          roomId,
          timestamp: Date.now(),
          limit: PAGE_LIMIT,
          signal: abortController.signal,
        })
        const fetchedMessages = extractMessages(response)
        const sortedMessages = sortMessagesAscending(fetchedMessages)
        setMessages(sortedMessages)
        setHasMoreHistory(fetchedMessages.length >= PAGE_LIMIT)
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        })
      } catch (error) {
        console.error('Failed to load messages', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    setMessages([])
    setHasMoreHistory(true)
    fetchInitialMessages()

    return () => abortController.abort()
  }, [roomId])

  const loadOlderMessages = useCallback(async () => {
    if (!roomId || isLoadingHistory || !hasMoreHistory || !oldestTimestamp) {
      return
    }

    const container = messagesContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0
    const prevScrollTop = container?.scrollTop ?? 0

    setIsLoadingHistory(true)
    try {
      const response = await roomService.getMessages({
        roomId,
        timestamp: oldestTimestamp,
        limit: PAGE_LIMIT,
      })
      const fetchedMessages = extractMessages(response)
      if (fetchedMessages.length === 0) {
        setHasMoreHistory(false)
        return
      }
      const sortedMessages = sortMessagesAscending(fetchedMessages)
      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((message) => message.id))
        const mergedMessages = [...prevMessages]
        sortedMessages.forEach((message) => {
          const hasId = Boolean(message?.id)
          if (!hasId || !existingIds.has(message.id)) {
            mergedMessages.push(message)
            if (hasId) {
              existingIds.add(message.id)
            }
          }
        })
        return sortMessagesAscending(mergedMessages)
      })
      setHasMoreHistory(fetchedMessages.length >= PAGE_LIMIT)
    } catch (error) {
      console.error('Failed to load older messages', error)
    } finally {
      setIsLoadingHistory(false)
      if (container) {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight)
        })
      }
    }
  }, [roomId, isLoadingHistory, hasMoreHistory, oldestTimestamp])

  const handleScroll = useCallback(() => {
    if (isLoadingHistory || !hasMoreHistory) {
      return
    }
    const container = messagesContainerRef.current
    if (!container) {
      return
    }

    if (container.scrollTop <= 0) {
      loadOlderMessages()
    }
  }, [hasMoreHistory, isLoadingHistory, loadOlderMessages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) {
      return undefined
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (!socket || !roomId) {
      return undefined
    }

    const joinPayload = { roomId }

    const handleMessage = (message) => {
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some((prevMessage) => prevMessage.id === message.id)
        if (alreadyExists) {
          return prevMessages
        }
        return sortMessagesAscending([...prevMessages, message])
      })
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
      if (roomType === 'USER') {
        const newMsg = {
          id: `optimistic-${Date.now()}`,
          authorId: session?.id,
          type: roomType,
          content: text,
          timestamp: new Date().toISOString(),
        }
        setMessages((prevMessages) => sortMessagesAscending([...prevMessages, newMsg]))
      }
    },
    [roomId, roomType, session?.id, socket],
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
        <div className="chat-room__messages" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <p className="chat-room__empty">Tin nhắn sẽ xuất hiện tại đây.</p>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id ?? `${message.timestamp}-${message.content}`}
                {...message}
                currentUserId={session?.id}
              />
            ))
          )}
        </div>
      </div>
      <UserInput onSend={handleSendMessage} />
    </section>
  )
}

export default ChatRoom
