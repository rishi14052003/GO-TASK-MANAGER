import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const fields = new FormData(event.currentTarget)
    setSubmitting(true)
    setError('')
    try {
      await login({ email: String(fields.get('email')), password: String(fields.get('password')) })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="login">
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <PasswordField autoComplete="current-password" placeholder="Enter your password" />
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <button className="add-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </AuthLayout>
  )
}
