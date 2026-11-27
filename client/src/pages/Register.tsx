import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useToast } from '../context/useToast'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password'))
    if (password !== fields.get('confirm-password')) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSubmitting(true)
    try {
      await register({
        name: String(fields.get('name')),
        email: String(fields.get('email')),
        password,
      })
      navigate('/login', { replace: true })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create account.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="register">
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="auth-field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" required autoComplete="name" placeholder="Jane Doe" />
        </div>
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
        <PasswordField autoComplete="new-password" placeholder="Create a password" />
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        <button className="add-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </AuthLayout>
  )
}
