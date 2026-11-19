import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

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
    <header className="sticky top-0 z-10 border-b border-white/10 bg-fokus-dark-orange">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-white">Fokus</span>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-fokus-yellow flex items-center justify-center text-sm font-bold text-slate-950">
              {initials}
            </div>
            <span className="text-base font-medium text-white">{userName || 'User'}</span>
          </div>

          <div className="h-5 w-px bg-white/30 hidden sm:block" />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-base text-white/90 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
