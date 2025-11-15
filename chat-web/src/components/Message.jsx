const Message = ({ author, text, timestamp, isSystem }) => {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : ''

  return (
    <article className={`message ${isSystem ? 'message--system' : ''}`}>
      <header className="message__meta">
        <span className="message__author">{author ?? 'Hệ thống'}</span>
        {formattedTime && <time className="message__time">{formattedTime}</time>}
      </header>
      <p className="message__body">{text ?? ''}</p>
    </article>
  )
}

export default Message
