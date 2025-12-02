import { useRef, useState } from 'react'
import AttachmentPreview from './AttachmentPreview.jsx'

const ACCEPTED_TYPES = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.pdf',
]

const UserInput = ({ onSend, onSelectAttachment, onClearAttachment, attachment, attachmentError }) => {
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = message.trim()
    const hasText = Boolean(trimmed)
    const hasAttachment = Boolean(attachment)

    if (!hasText && !hasAttachment) {
      return
    }

    onSend({ text: hasText ? trimmed : '', attachment: hasAttachment ? attachment : null })
    setMessage('')
    onClearAttachment?.()
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    onSelectAttachment?.(file)
    event.target.value = ''
  }

  return (
    <form className="user-input" onSubmit={handleSubmit}>
      <AttachmentPreview attachment={attachment} error={attachmentError} onRemove={onClearAttachment} />
      <div className="user-input__controls">
        <button type="button" className="user-input__attach" onClick={handleAttachmentClick} aria-label="Attach file">
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          name="attachment"
          accept={ACCEPTED_TYPES.join(',')}
          hidden
          onChange={handleAttachmentChange}
        />
        <input
          type="text"
          name="message"
          placeholder="Typing ..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </div>
    </form>
  )
}

export default UserInput
