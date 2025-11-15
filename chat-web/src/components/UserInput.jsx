import { useState } from 'react'

const UserInput = ({ onSend }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = message.trim()

    if (!trimmed) {
      return
    }

    onSend(trimmed)
    setMessage('')
  }

  return (
    <form className="user-input" onSubmit={handleSubmit}>
      <input
        type="text"
        name="message"
        placeholder="Nhập tin nhắn ..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        autoComplete="off"
      />
      <button type="submit">Gửi</button>
    </form>
  )
}

export default UserInput
