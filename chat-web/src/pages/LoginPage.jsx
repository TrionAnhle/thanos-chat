import { useState } from 'react'
import authService from '../services/authService.js'
import { saveAuthSession } from '../services/authStorage.js'
import { Toaster, toast } from 'react-hot-toast';

const LoginPage = ({ onSuccess, onSwitchToRegister }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    if (!trimmedUsername || !trimmedPassword) {
      toast.error('Please enter both email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.login({ username: trimmedUsername, password: trimmedPassword })
      handleLoginSuccess(response, { username: trimmedUsername })
    } catch (submissionError) {
      toast.error(submissionError.message ?? 'Unable to signin. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoginSuccess = (response, profile = {}) => {
    const authState = {
      token: response.access_token,
      username: profile.username,
      id: response.id,
      name: response.name,
    }
    saveAuthSession(authState)
    onSuccess?.(authState)
  }

  return (
    <section className="auth-page">
      <Toaster />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <label>
          Username{' '}
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="email@domain.com" />
        </label>
        <label>
          Password{' '}
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Signin'}
        </button>
        <p className="auth-form__switch">
          Chưa có tài khoản?{' '}
          <button type="button" onClick={onSwitchToRegister} className="link-button" disabled={isSubmitting}>
            Đăng ký ngay
          </button>
        </p>
      </form>
    </section>
  )
}

export default LoginPage
