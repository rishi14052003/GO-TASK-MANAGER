import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { api } from '../services/api'

export default function ResetPassword() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => window.clearTimeout(timer)
  }, [navigate, success])

  if (!state?.email || !state?.otp) return <Navigate to="/forgot-password" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || success) return
    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password'))
    if ([...password].length < 6 || new TextEncoder().encode(password).length > 72) {
      setError('Use at least 6 characters and at most 72 bytes for your password.')
      return
    }
    if (password !== fields.get('confirm')) {
      setError('Passwords must match.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await api.resetPassword(state.email, state.otp, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout mode="recovery" title="Set new password" footer={<Link to="/forgot-password">Request a new code</Link>}>
      {success ? <p role="status" className="mt-6 text-emerald-400">Password reset! Redirecting to login…</p> : (
        <form onSubmit={submit} aria-busy={busy}>
          <PasswordField label="New password" autoComplete="new-password" placeholder="At least 6 characters" />
          <PasswordField id="confirm" label="Confirm password" autoComplete="new-password" placeholder="Re-enter your password" />
          {error && <p role="alert" className="auth-error">{error}</p>}
          <button className="add-button" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</button>
        </form>
      )}
    </AuthLayout>
  )
}
