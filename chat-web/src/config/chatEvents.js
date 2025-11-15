const ChatEvents = Object.freeze({
  CONNECTED: 'connected',
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  SEND_MESSAGE: 'chat:send',
  NEW_MESSAGE: 'chat:new',
  TYPING: 'chat:typing',
  ERROR: 'chat:error',
})

export default ChatEvents
