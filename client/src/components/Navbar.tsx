import { LayoutDashboard, LogOut } from 'lucide-react'
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
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Go-Task-Pro</p>
            <p className="text-xs text-slate-400">Task Manager For Intellectual People</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-100">
                {(userName || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="text-sm text-slate-300">
                <div className="text-xs">Welcome back,</div>
                <div className="font-semibold text-slate-100">{userName || 'User'}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-transparent border border-emerald-600 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-600/10 transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar