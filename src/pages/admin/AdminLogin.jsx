import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const { session, isAdmin, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && session && isAdmin) {
    const redirectTo = location.state?.from?.pathname || '/admin'
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hero-dark flex min-h-screen items-center justify-center px-4">
      <div className="blob pointer-events-none absolute -right-20 -top-20 h-72 w-72 bg-surface/5" aria-hidden="true" />
      <div className="blob pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 bg-peach/20 blur-sm" aria-hidden="true" />
      <div className="card relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center">
          <Logo size="md" />
          <p className="mt-2 font-body text-sm font-semibold text-ink-soft">Pricing Studio · Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label-field">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-field">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="font-body text-sm text-peach">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full">
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
