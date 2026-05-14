import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login, error } = useAuth()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    login({ email, password })
      .then(() => navigate('/dashboard', { replace: true }))
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="min-h-screen bg-fokus-pale px-4 py-8 sm:px-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-fokus-dark-orange/10 lg:grid lg:grid-cols-2">
        <section className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden bg-fokus-dark-orange p-10 sm:p-12 lg:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[36px] border-fokus-yellow/15" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-fokus-yellow/10 blur-2xl" />
          </div>

          <p className="relative text-2xl font-bold tracking-tight text-white">Fokus</p>

          <div className="relative max-w-md space-y-7">
            <span className="inline-flex rounded-full bg-fokus-yellow px-4 py-2 text-sm font-bold text-slate-950">
              Make every day count
            </span>
            <h2 className="text-5xl font-bold leading-tight text-white">
              Your day,<br />
              in better focus.
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Plan your tasks, track your progress, and keep your attention on what matters.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-base font-semibold text-white">
              <span className="rounded-full border border-white/30 px-4 py-2">Plan</span>
              <span className="rounded-full border border-white/30 px-4 py-2">Track</span>
              <span className="rounded-full border border-white/30 px-4 py-2">Finish</span>
            </div>
          </div>

          <p className="relative text-sm text-white/80">Small steps add up. Make today count.</p>
        </section>

        <section className="flex min-h-[600px] items-center justify-center px-6 py-10 sm:px-12 lg:min-h-[640px] lg:px-14">
          <div className="w-full max-w-md animate-fade-in">
            <p className="mb-10 text-2xl font-bold tracking-tight text-fokus-dark-orange lg:hidden">Fokus</p>

            <div className="mb-10">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-fokus-dark-orange">Welcome back</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Sign in to your account</h1>
              <p className="mt-3 text-base text-slate-600">Pick up where you left off.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-base font-semibold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-fokus-pale px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-fokus-dark-orange focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/25 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-base font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-fokus-pale px-4 py-3.5 pr-12 text-base text-slate-900 placeholder:text-slate-400 focus:border-fokus-dark-orange focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-orange-100 hover:text-slate-900 transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-base text-rose-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-fokus-dark-orange px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-fokus-dark-orange/20 transition-all hover:bg-fokus-dark-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center text-base text-slate-600">
              No account?{' '}
              <Link to="/register" className="font-semibold text-fokus-dark-orange hover:text-fokus-dark-orange-hover transition">
                Create one free
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
