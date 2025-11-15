import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login: '', password: '' })
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, location.state, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError(null)
    try {
      await login(form)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  return (
    <div className="login-layout">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-headline">
          <p className="page-subtitle">Courier Management System</p>
          <h1>Вход в систему</h1>
          <p className="muted">
            Используйте корпоративный логин и пароль, выданные администратором
          </p>
        </div>
        <label className="form-field">
          <span>Логин</span>
          <input
            name="login"
            value={form.login}
            onChange={handleChange}
            placeholder="admin"
            required
          />
        </label>
        <label className="form-field">
          <span>Пароль</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </label>
        {(error || localError) && (
          <div className="alert danger">{error || localError}</div>
        )}
        <button className="btn primary" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <section className="login-info">
        <h2>Функциональность системы</h2>
        <ul>
          <li>
            <strong>Администратор</strong> — управление пользователями,
            машинами и товарами
          </li>
          <li>
            <strong>Менеджер</strong> — планирование маршрутов и доставок
          </li>
          <li>
            <strong>Курьер</strong> — просмотр назначенных доставок
          </li>
        </ul>
        <p className="muted">
          Если вы впервые в системе, обратитесь к администратору за учетной
          записью
        </p>
      </section>
    </div>
  )
}
