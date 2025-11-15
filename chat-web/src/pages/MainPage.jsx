import { useEffect, useMemo, useState } from 'react'
import ChatRoom from './ChatRoom.jsx'

const DEFAULT_RECENT_ROOMS = [
  {
    room: 'general',
    title: '#general',
    lastMessage: 'Thảo luận chung của cả đội',
  },
  {
    room: 'avengers',
    title: 'Avengers HQ',
    lastMessage: 'Tổng kết nhiệm vụ mới nhất',
  },
  {
    room: 'guardians',
    title: 'Guardians',
    lastMessage: 'Tình hình ngoài vũ trụ',
  },
]

const MainPage = ({ onJoin, defaultUsername = '', onLogout, email, chatUser, onLeave }) => {
  const [username, setUsername] = useState(defaultUsername)
  const [room, setRoom] = useState('general')
  const [recentRooms, setRecentRooms] = useState(DEFAULT_RECENT_ROOMS)

  useEffect(() => {
    setUsername(defaultUsername)
  }, [defaultUsername])

  useEffect(() => {
    if (!chatUser?.room) {
      return
    }

    setRecentRooms((previous) => {
      const filtered = previous.filter((item) => item.room !== chatUser.room)
      const existing = previous.find((item) => item.room === chatUser.room)
      const nextRoom = existing ?? {
        room: chatUser.room,
        title: chatUser.room,
        lastMessage: 'Đang trò chuyện',
      }

      return [nextRoom, ...filtered].slice(0, 10)
    })
  }, [chatUser])

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
            <h1>Cuộc trò chuyện</h1>
            {email && <p className="join-page__subtitle">Đang đăng nhập với {email}</p>}
          </div>
          {onLogout && (
            <button type="button" className="link-button" onClick={onLogout}>
              Đăng xuất
            </button>
          )}
        </div>

        <div className="recent-chat">
          <h2>Gần đây</h2>
          <ul>
            {recentRooms.map((recent) => (
              <li key={recent.room}>
                <button
                  type="button"
                  className={`recent-chat__item ${activeRoom === recent.room ? 'recent-chat__item--active' : ''}`}
                  onClick={() => handleSelectConversation(recent.room)}
                >
                  <strong>{recent.title}</strong>
                  <span>{recent.lastMessage}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form className="join-form join-form--compact" onSubmit={handleSubmit}>
          <label>
            Tên hiển thị
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ví dụ: Iron Man"
            />
          </label>
          <label>
            Tên phòng
            <input type="text" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="general" />
          </label>
          <button type="submit">Vào phòng</button>
        </form>
      </aside>

      <div className="chat-layout__content">
        {chatUser ? (
          <ChatRoom key={chatUser.room} user={chatUser} onLeave={onLeave} />
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
