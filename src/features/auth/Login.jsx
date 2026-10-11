import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../../services/authApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { useAuth } from '../../context/AuthContext.jsx'

export function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { saveSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await login({ email: email.trim(), password })
      saveSession(res)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="page-head">
        <h2>Welcome back, traveler ⚔️</h2>
        <p>AENKO — Your Anime Journey, Your Quests, Your Guild.</p>
      </div>
      {params.get('expired') && <div className="form-ok">Your session expired. Please log in again.</div>}
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
      </form>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>No account? <Link to="/register">Register</Link></p>
    </div>
  )
}

export default Login

