import { useState } from 'react'
import authService from '../services/authService.js'
import { saveAuthSession } from '../services/authStorage.js'
import { Toaster, toast } from 'react-hot-toast';

const RegisterPage = ({ onSuccess, onSwitchToLogin }) => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setUser((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { name, email, username, password, confirmPassword } = user

    if (!name.trim() || 
          !email.trim() || 
          !username.trim() ||
          !password.trim() || 
          !confirmPassword.trim()) {
      toast.error('Please fill in all the required information')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Confirmation password does not match')
      return
    }

    try {
      setIsSubmitting(true)
      const trimmedName = name.trim()
      const trimmedUsername = username.trim()
      const trimmedEmail = email.trim()
      const response = await authService.register({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      })
      handleRegisterSuccess(response)
    } catch (submissionError) {
      toast.error(submissionError.message ?? 'Unable to register. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSuccess = (response) => {
    const authState = {
        token: response.token,
      }
      saveAuthSession(authState)
      onSuccess?.(authState)
  }


  return (
    <section className="auth-page">
      <Toaster />
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Display Name{' '}
          <input type="text" value={user.name} onChange={handleChange('name')} placeholder="Thor Odinson" />
        </label>
        <label>
          Email{' '}
          <input type="email" value={user.email} onChange={handleChange('email')} placeholder="email@domain.com" />
        </label>
        <label>
          Username{' '}
          <input type="text" value={user.username} onChange={handleChange('username')} placeholder="Thor Odinson" />
        </label>
        <label>
          Password{' '}
          <input type="password" value={user.password} onChange={handleChange('password')} placeholder="••••••••" />
        </label>
        <label>
          Confirm Password{' '}
          <input
            type="password"
            value={user.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Signup'}
        </button>
        <p className="auth-form__switch">
          Đã có tài khoản?{' '}
          <button type="button" onClick={onSwitchToLogin} className="link-button" disabled={isSubmitting}>
            Đăng nhập
          </button>
        </p>
      </form>
    </section>
  )
}

export default RegisterPage
