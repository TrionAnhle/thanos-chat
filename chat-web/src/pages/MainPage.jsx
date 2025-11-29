import { useEffect, useMemo, useState } from 'react'
import ChatRoom from './ChatRoom.jsx'
import userService from '../services/userService.js'
import roomService from '../services/roomService.js'
import { loadAuthSession } from '../services/authStorage.js'

const normalizeSearchResults = (payload) => {
  if (!payload) {
    return { rooms: [], users: [] }
  }
  if (Array.isArray(payload)) {
    return { rooms: payload, users: [] }
  }
  const rooms = Array.isArray(payload.rooms) ? payload.rooms : []
  const users = Array.isArray(payload.users) ? payload.users : []
  return { rooms, users }
}

const MainPage = ({ onJoin, onLogout, chatUser, onLeave }) => {
  const [authState, setAuthState] = useState({})
  const [room, setRoom] = useState('general')
  const [recentRooms, setRecentRooms] = useState([])
  const [isChat, setIsChat] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(normalizeSearchResults())
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

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

    setAuthState(loadAuthSession());
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
    onJoin({ room: roomName })
  }

  const handleSearch = async (event) => {
    event?.preventDefault?.()
    setIsChat(false)
    const trimmedSearch = search.trim()
    if (!trimmedSearch) {
      setSearchResults(normalizeSearchResults())
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    try {
      const results = await roomService.searchRooms({ name: trimmedSearch })
      setSearchResults(normalizeSearchResults(results))
    } catch (error) {
      console.error('Failed to search', error)
      setSearchResults(normalizeSearchResults())
      setSearchError('Not found. Please retry')
    } finally {
      setIsSearching(false)
    }

  }

  const hasSearchResults = searchResults.rooms.length > 0 || searchResults.users.length > 0

  return (
    <section className="chat-layout">
      <aside className="chat-layout__sidebar">
        <div className="join-page__header">
          <input
            type="text"
            name="message"
            placeholder="Search..."
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
            {`${authState?.name}(${authState?.username})`}
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
          <div className={`chat-placeholder ${isSearching || hasSearchResults ? 'chat-placeholder--top' : ''}`}>
            {isSearching ? (
              <p>Đang tìm kiếm...</p>
            ) : hasSearchResults ? (
              <>
                <h2>Search Result</h2>
                {searchResults.rooms.length > 0 && (
                  <>
                    <h3 className="search-results__heading">Room</h3>
                    <ul className="search-results">
                      {searchResults.rooms.map((roomResult) => (
                        <li key={roomResult.id} className="search-results__item">
                          <button type="button" onClick={() => handleSelectConversation(roomResult)}>
                            <strong>{roomResult.type === 'GROUP' ? `#${roomResult.name}` : roomResult.name}</strong>
                            <span>{roomResult.description ?? 'No description'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {searchResults.users.length > 0 && (
                  <>
                    <h3 className="search-results__heading">User</h3>
                    <ul className="search-results">
                      {searchResults.users.map((userResult) => (
                        <li key={userResult.id} className="search-results__item">
                          <button type="button" onClick={() => handleSelectConversation(userResult)}>
                            <strong>{userResult.name}</strong>
                            <span>{userResult.description ?? 'No description'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <>
                <h2>Select a conversation</h2>
                <p>Choose a room on the left or enter a new room name to start.</p>
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
