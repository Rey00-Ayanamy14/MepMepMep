import { useEffect, useState } from 'react'
import { api } from '../api/endpoints.js'
import { USER_ROLES } from '../constants.js'
import { useAuth } from '../state/AuthContext.jsx'
import { formatDate } from '../utils/format.js'

const emptyForm = {
  login: '',
  password: '',
  name: '',
  role: 'manager'
}

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [roleFilter, setRoleFilter] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.users.list(token, roleFilter || undefined)
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const startEdit = (user) => {
    setEditingUser(user)
    setForm({
      login: user.login,
      name: user.name,
      role: user.role,
      password: ''
    })
  }

  const resetForm = () => {
    setEditingUser(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingUser) {
        const payload = {
          login: form.login,
          name: form.name,
          role: form.role || editingUser.role
        }
        if (form.password) {
          payload.password = form.password
        }
        await api.users.update(token, editingUser.id, payload)
      } else {
        await api.users.create(token, form)
      }
      resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Удалить пользователя ${user.name} (${user.login})?`
    )
    if (!confirmed) return
    try {
      await api.users.delete(token, user.id)
      await loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid two">
      <section className="card">
        <div className="section-head">
          <h2>Пользователи</h2>
          <select
            className="input"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">Все роли</option>
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="muted">Загрузка...</p>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Логин</th>
                  <th>Роль</th>
                  <th>Создан</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.login}</td>
                    <td>
                      <span className="tag">{user.role}</span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="table-actions">
                      <button className="btn ghost" onClick={() => startEdit(user)}>
                        Изменить
                      </button>
                      <button
                        className="btn ghost danger"
                        onClick={() => handleDelete(user)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <div className="section-head">
          <h2>{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>
          {editingUser && (
            <button className="btn ghost" onClick={resetForm}>
              Очистить
            </button>
          )}
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Имя</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Логин</span>
            <input
              name="login"
              value={form.login}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Роль</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              {USER_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{editingUser ? 'Новый пароль' : 'Пароль'}</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={editingUser ? 'Оставьте пустым чтобы не менять' : ''}
              required={!editingUser}
            />
          </label>
          <button className="btn primary" type="submit">
            {editingUser ? 'Обновить' : 'Создать'}
          </button>
        </form>
      </section>
    </div>
  )
}
