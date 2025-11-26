import { useEffect, useMemo, useState } from 'react'
import ChatRoom from './ChatRoom.jsx'
import userService from '../services/userService.js'
import roomService from '../services/roomService.js'


const MainPage = ({ onJoin, defaultUsername = '', onLogout, email, chatUser, onLeave }) => {
  const [username, setUsername] = useState(defaultUsername)
  const [room, setRoom] = useState('general')
  const [recentRooms, setRecentRooms] = useState([])
  const [isChat, setIsChat] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

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

  const handleSelectConversation = (roomName) => {
    setRoom(roomName)
    setIsChat(true)
    const trimmedName = username.trim()
    if (!trimmedName) {
      return
    }

    onJoin({ username: trimmedName, room: roomName })
  }

  const handleSearch = async (event) => {
    event?.preventDefault?.()
    setIsChat(false)
    const trimmedSearch = search.trim()
    if (!trimmedSearch) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    try {
      const rooms = await roomService.searchRooms({ name: trimmedSearch })
      const formattedRooms = Array.isArray(rooms) ? rooms : rooms?.rooms ?? []
      setSearchResults(formattedRooms)
    } catch (error) {
      console.error('Failed to search rooms', error)
      setSearchResults([])
      setSearchError('Không thể tìm kiếm phòng. Vui lòng thử lại.')
    } finally {
      setIsSearching(false)
    }

  }

  return (
    <section className="chat-layout">
      <aside className="chat-layout__sidebar">
        <div className="join-page__header">
          <input
            type="text"
            name="message"
            placeholder="Find new room ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
          />
          <button type="button" onClick={handleSearch}>Search</button>
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
        <div className="join-page__footer">
          <div>
            {username}
          </div>
          <button type="button" className="link-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="chat-layout__content">
        {isChat && chatUser ? (
          <ChatRoom key={room.id ?? room} room={room} onLeave={onLeave} />
        ) : (
          <div className="chat-placeholder">
            {isSearching ? (
              <p>Đang tìm phòng...</p>
            ) : searchResults.length > 0 ? (
              <>
                <h2>Kết quả tìm kiếm</h2>
                <ul className="search-results">
                  {searchResults.map((roomResult) => (
                    <li key={roomResult.id} className="search-results__item">
                      <button type="button" onClick={() => handleSelectConversation(roomResult)}>
                        <strong>{roomResult.name}</strong>
                        <span>{roomResult.description ?? 'Không có mô tả'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2>Chọn một cuộc trò chuyện</h2>
                <p>Hãy chọn một phòng ở bên trái hoặc nhập tên phòng mới để bắt đầu.</p>
              </>
            )}
            {searchError && <p className="chat-room__empty">{searchError}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

export default MainPage
