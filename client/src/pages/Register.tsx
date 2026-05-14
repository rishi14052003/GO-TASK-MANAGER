import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Eye, EyeOff } from 'lucide-react'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { register, error } = useAuth()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setLocalError(null)
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }
    setIsSubmitting(true)
    register({ name, email, password })
      .then(() => navigate('/login', { replace: true }))
      .catch(() => {})
      .finally(() => setIsSubmitting(false))
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-fokus-pale px-4 py-8 sm:px-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-fokus-dark-orange/10 lg:grid lg:grid-cols-2">
        <section className="relative hidden min-h-[760px] flex-col justify-between overflow-hidden bg-fokus-dark-orange p-10 sm:p-12 lg:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[36px] border-fokus-yellow/15" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-fokus-yellow/10 blur-2xl" />
          </div>

          <p className="relative text-2xl font-bold tracking-tight text-white">Fokus</p>

          <div className="relative max-w-md space-y-7">
            <span className="inline-flex rounded-full bg-fokus-yellow px-4 py-2 text-sm font-bold text-slate-950">
              Start with a clear plan
            </span>
            <h2 className="text-5xl font-bold leading-tight text-white">
              Make space<br />
              for what matters.
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Create your workspace and turn your to-dos into steady progress.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-base font-semibold text-white">
              <span className="rounded-full border border-white/30 px-4 py-2">Plan</span>
              <span className="rounded-full border border-white/30 px-4 py-2">Track</span>
              <span className="rounded-full border border-white/30 px-4 py-2">Finish</span>
            </div>
          </div>

          <p className="relative text-sm text-white/80">A little focus goes a long way.</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:min-h-[760px] lg:px-14">
          <div className="w-full max-w-md animate-fade-in">
            <p className="mb-8 text-2xl font-bold tracking-tight text-fokus-dark-orange lg:hidden">Fokus</p>
            <div className="mb-8">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-fokus-dark-orange">Get started</p>
              <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
              <p className="text-base text-slate-600 mt-2">Start organizing your work in seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <label htmlFor="name" className="block text-base font-semibold text-slate-700 mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all"
              />
              </div>

              <div>
              <label htmlFor="email" className="block text-base font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all"
              />
              </div>

              <div>
              <label htmlFor="password" className="block text-base font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-orange-100 hover:text-slate-900 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              </div>

              <div>
              <label htmlFor="confirm-password" className="block text-base font-semibold text-slate-700 mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all"
              />
              </div>

              {displayError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-base text-rose-700">{displayError}</p>
              </div>
              )}

              <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-fokus-dark-orange hover:bg-fokus-dark-orange-hover disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-base font-bold text-white shadow-lg shadow-fokus-dark-orange/20 transition-all mt-2"
              >
              {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-base text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-fokus-dark-orange hover:text-fokus-dark-orange-hover transition">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register
