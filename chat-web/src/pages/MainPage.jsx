import { useEffect, useMemo, useState } from 'react'
import ChatRoom from './ChatRoom.jsx'
import userService from '../services/userService.js'

const MainPage = ({ onJoin, defaultUsername = '', onLogout, email, chatUser, onLeave }) => {
  const [username, setUsername] = useState(defaultUsername)
  const [room, setRoom] = useState('general')
  const [recentRooms, setRecentRooms] = useState([])

  useEffect(() => {
    setUsername(defaultUsername)
  }, [defaultUsername])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchRecentChats = async () => {
      try {
        const recent = await userService.getRecentChats({ signal: controller.signal })
        if (!isMounted || !Array.isArray(recent) || recent.length === 0) {
          return
        }
        setRecentRooms(recent)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Unable to load recent chats', error)
        }
      }
    }

    fetchRecentChats()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const activeRoom = useMemo(() => chatUser?.room ?? null, [chatUser])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = username.trim()
    const trimmedRoom = room.trim()

    if (!trimmedName || !trimmedRoom) {
      return
    }

    onJoin({ username: trimmedName, room: trimmedRoom })
  }

  const handleSelectConversation = (roomName) => {
    setRoom(roomName)
    const trimmedName = username.trim()
    if (!trimmedName) {
      return
    }

    onJoin({ username: trimmedName, room: roomName })
  }

  return (
    <section className="chat-layout">
      <aside className="chat-layout__sidebar">
        <div className="join-page__header">
          <div>
            <h2>Conversation</h2>
            {email && <p className="join-page__subtitle">Đang đăng nhập với {email}</p>}
          </div>
          {onLogout && (
            <button type="button" className="link-button" onClick={onLogout}>
              Log out
            </button>
          )}
        </div>

        <div className="recent-chat">
          <h2>Recent</h2>
          <ul>
            {recentRooms.map((recent) => (
              <li key={recent.room}>
                <button
                  type="button"
                  className={`recent-chat__item ${activeRoom === recent.chatRoom ? 'recent-chat__item--active' : ''}`}
                  onClick={() => handleSelectConversation(recent.chatRoom)}
                >
                  <strong>
                    {recent.chatRoom?.type === "GROUP" ? 
                    `#${recent.chatRoom?.name}` : `${recent.chatRoom?.name}(${recent.chatRoom?.username})`}
                  </strong>
                  <span>{recent.content}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* <form className="join-form join-form--compact" onSubmit={handleSubmit}>
          <label>
            Tên hiển thị {' '}
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ví dụ: Iron Man"
            />
          </label>
          <label>
            Tên phòng {' '}
            <input type="text" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="general" />
          </label>
          <button type="submit">Vào phòng</button>
        </form> */}
      </aside>

      <div className="chat-layout__content">
        {chatUser ? (
          <ChatRoom key={room.id} room={room} onLeave={onLeave} />
        ) : (
          <div className="chat-placeholder">
            <h2>Chọn một cuộc trò chuyện</h2>
            <p>Hãy chọn một phòng ở bên trái hoặc nhập tên phòng mới để bắt đầu.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default MainPage
