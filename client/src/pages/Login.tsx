import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useToast } from '../context/useToast'
import { api } from '../services/api'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/useAuth'

export default function Login({ admin = false }: { admin?: boolean }) {
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const fields = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      const credentials = {
        email: String(fields.get('email')),
        password: String(fields.get('password')),
      }
      if (admin) {
        localStorage.removeItem('admin_token')
        const { user, token } = await api.login(credentials)
        if (!user.isAdmin) {
          showToast('You do not have admin access', 'error')
          return
        }
        localStorage.setItem('admin_token', token)
        navigate('/admin', { replace: true })
      } else {
        await login(credentials)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to sign in.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout mode={admin ? 'admin' : 'login'}>
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

        <button className="add-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </AuthLayout>
  )
}
