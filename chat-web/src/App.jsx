import { useDispatch, useSelector } from 'react-redux'
import MainPage from './pages/MainPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { VIEWS, loginSuccess, logout, setView } from './store/authSlice.js'
import { clearChatUser, setChatUser } from './store/chatSlice.js'

const App = () => {
  const dispatch = useDispatch()
  const view = useSelector((state) => state.auth.view)
  const authUser = useSelector((state) => state.auth.session)
  const chatUser = useSelector((state) => state.chat.chatUser)

  const handleAuthSuccess = (authState) => {
    dispatch(loginSuccess(authState))
    dispatch(clearChatUser())
  }

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearChatUser())
  }

  const handleJoinRoom = (payload) => {
    dispatch(setChatUser(payload))
  }

  const handleLeaveRoom = () => {
    dispatch(clearChatUser())
  }

  let content = null

  if (!authUser && view === VIEWS.REGISTER) {
    content = <RegisterPage onSuccess={handleAuthSuccess} onSwitchToLogin={() => dispatch(setView(VIEWS.LOGIN))} />
  } else if (!authUser) {
    content = <LoginPage onSuccess={handleAuthSuccess} onSwitchToRegister={() => dispatch(setView(VIEWS.REGISTER))} />
  } else {
    content = (
      <SocketProvider>
        <MainPage
          authUser={authUser}
          defaultUsername={authUser.username ?? ''}
          onLogout={handleLogout}
          email={authUser.email}
          onJoin={handleJoinRoom}
          chatUser={chatUser}
          onLeave={handleLeaveRoom}
        />
      </SocketProvider>
    )
  }

  return <div className="app-shell">{content}</div>
}

export default App
