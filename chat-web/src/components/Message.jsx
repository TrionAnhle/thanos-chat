const Message = ({ currentUserId, authorId, name, username, content, timestamp, isSystem }) => {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : ''
  const isCurrentUser = currentUserId === authorId
  return (
    <article
      className={`message ${isSystem ? 'message--system' : ''} ${isCurrentUser ? 'message--self' : 'message--other'}`}
    >
      <header className="message__meta">
        <span className="message__author">{isCurrentUser ? `You`: `${name}(${username})`}</span>
        {formattedTime && <time className="message__time">{formattedTime}</time>}
      </header>
      <p className="message__body">{content ?? ''}</p>
    </article>
  )
}

export default Message
