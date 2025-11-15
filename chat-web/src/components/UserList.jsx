const getUserKey = (user, index) => {
  if (!user) {
    return `anonymous-${index}`
  }

  if (typeof user === 'string') {
    return user
  }

  return user.id ?? user.username ?? `member-${index}`
}

const getUserLabel = (user) => {
  if (!user) {
    return 'Ẩn danh'
  }

  if (typeof user === 'string') {
    return user
  }

  return user.username ?? user.name ?? 'Ẩn danh'
}

const UserList = ({ users = [] }) => (
  <aside className="user-list">
    <h3>Thành viên</h3>
    <ul>
      {users.map((user, index) => (
        <li key={getUserKey(user, index)}>{getUserLabel(user)}</li>
      ))}
    </ul>
  </aside>
)

export default UserList
