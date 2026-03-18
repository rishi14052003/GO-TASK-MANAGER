import { LogOut, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type NavbarProps = {
  userName?: string
}

const Navbar = ({ userName }: NavbarProps) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = (userName || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Zap className="h-4 w-4 text-slate-950" />
          </div>
          <span className="text-sm font-semibold text-slate-100">GoTask Pro</span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
            Go-powered
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-slate-950">
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-200">{userName || 'User'}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
