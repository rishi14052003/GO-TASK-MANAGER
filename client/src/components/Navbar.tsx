import { Layers3, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Navbar({ userName = 'User' }: { userName?: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const initials = userName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return (
    <header className="workspace-nav">
      <div className="workspace-wrap nav-inner">
        <span className="brand"><Layers3 size={27} strokeWidth={2.5} />Fokus</span>
        <span className="nav-section">Workspace</span>
        <div className="account">
          <span className="avatar">{initials}</span><span className="account-name">{userName}</span>
          <button aria-label="Log out" title="Log out" onClick={() => { logout(); navigate('/login', { replace: true }) }}><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  )
}
