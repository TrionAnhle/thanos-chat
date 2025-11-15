import { useState } from 'react'
import MainPage from './pages/MainPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { saveAuthSession } from './services/authStorage.js'
import { SocketProvider } from './context/SocketContext.jsx'

const VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  JOIN: 'join',
}

const App = () => {
  const [view, setView] = useState(VIEWS.LOGIN)
  const [authUser, setAuthUser] = useState(null)
  const [chatUser, setChatUser] = useState(null)

  const handleAuthSuccess = (authState) => {
    setAuthUser(authState)
    setView(VIEWS.JOIN)
  }

  const handleJoin = ({ username, room }) => {
    setChatUser({ username, room })
  }

  const handleLeave = () => {
    setChatUser(null)
  }

  const handleLogout = () => {
    setChatUser(null)
    setAuthUser(null)
    saveAuthSession(null)
    setView(VIEWS.LOGIN)
  }

  let content = null

  if (!authUser && view === VIEWS.REGISTER) {
    content = <RegisterPage onSuccess={handleAuthSuccess} onSwitchToLogin={() => setView(VIEWS.LOGIN)} />
  } else if (!authUser) {
    content = <LoginPage onSuccess={handleAuthSuccess} onSwitchToRegister={() => setView(VIEWS.REGISTER)} />
  } else {
    content = (
      <SocketProvider>
        <MainPage
          onJoin={handleJoin}
          defaultUsername={authUser.username ?? ''}
          onLogout={handleLogout}
          email={authUser.email}
          chatUser={chatUser}
          onLeave={handleLeave}
        />
      </SocketProvider>
    )
  }

  return <div className="app-shell">{content}</div>
}

export default App
