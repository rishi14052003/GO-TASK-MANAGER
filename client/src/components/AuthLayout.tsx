import type { ReactNode } from 'react'
import { Layers3, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../pages/Dashboard.css'
import './AuthLayout.css'

type Props = { children: ReactNode } & (
  | { mode: 'login' | 'register' | 'admin' }
  | { mode: 'recovery'; title: string; subtitle?: string; footer: ReactNode }
)

export default function AuthLayout(props: Props) {
  const { mode, children } = props
  const signingIn = mode !== 'register'
  const BrandIcon = mode === 'recovery' ? Zap : Layers3
  return (
    <div className="workspace auth-screen">
      <header className="workspace-nav">
        <div className="workspace-wrap nav-inner">
          <span className="brand">
            <BrandIcon aria-hidden="true" size={27} strokeWidth={2.5} />
            Fokus
          </span>
        </div>
      </header>
      <main className="workspace-wrap auth-main">
        <div className="auth-card">
          <aside className="auth-cover">
            <h2>
              {signingIn ? (
                <>
                  Your day,
                  <br />
                  in better focus.
                </>
              ) : (
                <>
                  Make space
                  <br />
                  for what matters.
                </>
              )}
            </h2>
            <p>
              {signingIn
                ? 'Plan your tasks, track your progress, and keep your attention on what matters.'
                : 'Create your workspace and turn your to-dos into steady progress.'}
            </p>
            <div className="contours" aria-hidden="true">
              {Array.from({ length: 32 }, (_, i) => (
                <i key={i} style={{ width: 115 + i * 23, height: 68 + i * 16 }} />
              ))}
            </div>
          </aside>
          <section className="auth-form-panel" aria-labelledby="auth-title">
            <h1 id="auth-title">
              {mode === 'recovery' ? props.title : mode === 'admin' ? 'Admin Access' : signingIn ? 'Welcome back' : 'Create an account'}
              <span>.</span>
            </h1>
            {mode === 'recovery' ? (props.subtitle && <p className="auth-intro">{props.subtitle}</p>) : signingIn && (
              <p className="auth-intro">
                {mode === 'admin'
                  ? 'Sign in to manage users and tasks.'
                  : 'Sign in to your workspace.'}
              </p>
            )}
            {children}
            {mode === 'recovery' ? (
              <p className="auth-switch">{props.footer}</p>
            ) : mode === 'admin' ? (
              <p className="auth-switch">
                <Link to="/login">Back to user sign in</Link>
              </p>
            ) : (
              <p className="auth-switch">
                {signingIn ? 'New to Fokus?' : 'Already have an account?'}{' '}
                <Link to={signingIn ? '/register' : '/login'}>
                  {signingIn ? 'Create an account' : 'Sign in'}
                </Link>
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
