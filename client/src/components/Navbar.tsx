import { LayoutDashboard, LogOut } from 'lucide-react'

type NavbarProps = {
  userName?: string
  onLogout?: () => void
}

const Navbar = ({ userName = 'User', onLogout }: NavbarProps) => {
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
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-slate-300">
            Welcome back, <span className="font-semibold">{userName}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
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