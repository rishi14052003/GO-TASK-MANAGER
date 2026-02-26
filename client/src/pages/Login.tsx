import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login, error } = useAuth()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    login({ email, password })
      .then(() => {
        navigate('/dashboard', { replace: true })
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        {/* Hero Section */}
        <div className="hidden md:block text-slate-50">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            GoTask <span className="text-emerald-400">Pro</span>
          </h1>
          <p className="text-slate-300 mb-6">
            A focused, minimal task management dashboard built with Go and React.
            Stay on top of your work with clear stats and fast interactions.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="font-medium text-slate-100">Real-time task stats</p>
                <p className="text-sm text-slate-400">
                  Track completed, pending, and total tasks from a single dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="font-medium text-slate-100">Secure authentication</p>
                <p className="text-sm text-slate-400">
                  JWT-based login with encrypted passwords and role-based access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-emerald-500/10 p-8">
            <div className="mb-6">
              <p className="md:hidden text-sm font-semibold tracking-wide text-emerald-400 uppercase mb-2">
                GoTask Pro
              </p>
              <h2 className="text-2xl font-semibold text-slate-50 mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-slate-400">
                Sign in to access your tasks dashboard.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                Create one
              </Link>
            </p>
              </div>

              {error && (
                <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
        </div>
      </div>
    </div>
  )
}

export default Login