import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { api } from '../services/api'

const emptyDigits = () => Array<string>(6).fill('')

export default function VerifyOTP() {
  const email: string | undefined = useLocation().state?.email
  const navigate = useNavigate()
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const [digits, setDigits] = useState(emptyDigits)
  const [pending, setPending] = useState<'verify' | 'resend' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  if (!email) return <Navigate to="/forgot-password" replace />

  async function verify(code: string) {
    if (!email || pending || code.length !== 6) return
    setError('')
    setNotice('')
    setPending('verify')
    try {
      await api.verifyOTP(email, code)
      navigate('/reset-password', { state: { email, otp: code }, replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the code.')
      setDigits(emptyDigits())
      inputs.current[0]?.focus()
    } finally {
      setPending(null)
    }
  }

  function enter(index: number, value: string) {
    if (pending || !/^\d*$/.test(value)) return
    const next = digits.slice()
    const part = value.slice(0, 6 - index)
    next.splice(index, part.length || 1, ...(part ? [...part] : ['']))
    setDigits(next)
    setError('')
    setNotice('')
    if (part) inputs.current[Math.min(index + part.length, 5)]?.focus()
    if (next.every(Boolean)) void verify(next.join(''))
  }

  async function resend() {
    if (!email || pending) return
    setPending('resend')
    setError('')
    setNotice('')
    try {
      await api.forgotPassword(email)
      setDigits(emptyDigits())
      setNotice('Check your inbox for a new code.')
      inputs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend the code.')
    } finally {
      setPending(null)
    }
  }

  return (
    <AuthLayout mode="recovery" title="Enter verification code" subtitle={`We sent a 6-digit code to ${email}`}
      footer={<Link to="/forgot-password">Back</Link>}>
      <form onSubmit={event => { event.preventDefault(); void verify(digits.join('')) }} aria-busy={!!pending}>
        <div className="flex gap-2" role="group" aria-label="Six-digit verification code">
          {digits.map((digit, index) => (
            <input key={index} ref={el => { inputs.current[index] = el }}
              aria-label={`Digit ${index + 1} of 6`} type="text" inputMode="numeric" maxLength={1}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              className="w-12 min-w-0 h-12 text-center text-lg font-bold rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
              value={digit} readOnly={!!pending} onChange={event => enter(index, event.target.value)}
              onFocus={event => event.target.select()}
              onPaste={event => { event.preventDefault(); enter(index, event.clipboardData.getData('text').trim()) }}
              onKeyDown={event => {
                if (digit && event.key === digit && !event.ctrlKey && !event.metaKey && !event.altKey) {
                  event.preventDefault()
                  enter(index, digit)
                } else if (event.key === 'Backspace' && !digit && index > 0) {
                  event.preventDefault()
                  inputs.current[index - 1]?.focus()
                }
              }}
            />
          ))}
        </div>
        {error && <p role="alert" className="auth-error">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
        <button className="add-button" disabled={!!pending || digits.some(digit => !digit)}>
          {pending === 'verify' ? 'Verifying…' : 'Verify OTP'}
        </button>
        <button type="button" className="text-sm text-slate-300" disabled={!!pending} onClick={resend}>
          {pending === 'resend' ? 'Sending…' : 'Resend OTP'}
        </button>
      </form>
    </AuthLayout>
  )
}
