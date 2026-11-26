import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { api } from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const email = String(new FormData(event.currentTarget).get('email')).trim()
    setError('')
    setSending(true)
    try {
      await api.forgotPassword(email)
      navigate('/verify-otp', { state: { email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send a code.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout mode="recovery" title="Reset your password"
      subtitle="Enter your account email and we'll send you a 6-digit OTP"
      footer={<Link to="/login">Back to login</Link>}>
      <form onSubmit={submit} aria-busy={sending}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-900/20 p-3 text-sm text-rose-400">{error}</p>}
        <button className="add-button" disabled={sending}>{sending ? 'Sending…' : 'Send OTP'}</button>
      </form>
    </AuthLayout>
  )
}
