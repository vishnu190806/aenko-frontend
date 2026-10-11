import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../services/authApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { useAuth } from '../../context/AuthContext.jsx'

export function Register() {
  const navigate = useNavigate()
  const { saveSession } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (!email.trim() || password.length < 6) {
      setError('Provide a valid email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await register({ username: username.trim(), email: email.trim(), password })
      saveSession(res)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="page-head">
        <h2>Begin your journey 🌸</h2>
        <p>Create your AENKO account to track anime, earn XP and join guilds.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
      </form>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

export default Register

