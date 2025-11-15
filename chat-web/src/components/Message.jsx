const Message = ({ name, content, timestamp, isSystem }) => {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : ''

  return (
    <article className={`message ${isSystem ? 'message--system' : ''}`}>
      <header className="message__meta">
        <span className="message__author">{name ?? 'Hệ thống'}</span>
        {formattedTime && <time className="message__time">{formattedTime}</time>}
      </header>
      <p className="message__body">{content ?? ''}</p>
    </article>
  )
}

export default Message
