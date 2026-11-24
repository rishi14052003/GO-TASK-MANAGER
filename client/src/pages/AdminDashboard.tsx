import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Layers3, Trash2 } from 'lucide-react'
import { api, ApiError, type AdminStats, type AdminTask } from '../services/api'
import type { User } from '../types/user'
import './Dashboard.css'
import './AdminDashboard.css'

const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

export default function AdminDashboard() {
  const token = localStorage.getItem('admin_token')
  const navigate = useNavigate()
  const [data, setData] = useState<{ stats: AdminStats; users: User[]; tasks: AdminTask[] } | null>(
    null
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [revision, setRevision] = useState(0)

  const signOut = useCallback(() => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const report = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        signOut()
      } else {
        setError(err instanceof Error ? err.message : 'Unable to reach the admin service.')
      }
    },
    [signOut]
  )

  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([api.getAdminStats(token), api.getAdminUsers(token), api.getAdminTasks(token)])
      .then(([stats, users, tasks]) => {
        if (active) setData({ stats, users, tasks })
      })
      .catch((err: unknown) => {
        if (active) report(err)
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [token, report, revision])

  function refresh() {
    setBusy(true)
    setError('')
    setRevision((v) => v + 1)
  }

  async function remove(kind: 'user' | 'task', id: number, name: string) {
    if (!token || busy) return
    const prompt =
      kind === 'user' ? `Delete ${name} and all their tasks?` : `Delete task “${name}”?`
    if (!window.confirm(prompt)) return
    setBusy(true)
    setError('')
    try {
      if (kind === 'user') await api.adminDeleteUser(token, id)
      else await api.adminDeleteTask(token, id)
      setData((prev) => {
        if (!prev) return prev
        const users = kind === 'user' ? prev.users.filter((u) => u.id !== id) : prev.users
        const tasks = prev.tasks.filter((t) => (kind === 'user' ? t.userId !== id : t.id !== id))
        const completedTasks = tasks.filter((t) => t.done).length
        return {
          users,
          tasks,
          stats: {
            totalUsers: users.length,
            totalTasks: tasks.length,
            completedTasks,
            completionRate: tasks.length ? (completedTasks * 100) / tasks.length : 0,
          },
        }
      })
      refresh()
    } catch (err) {
      report(err)
      setBusy(false)
    }
  }

  if (!token) return <Navigate to="/admin/login" replace />

  function deleteButton(kind: 'user' | 'task', id: number, name: string) {
    return (
      <button
        className="admin-delete"
        disabled={busy}
        aria-label={`Delete ${kind} ${name}`}
        onClick={() => void remove(kind, id, name)}
      >
        <Trash2 size={15} />
        Delete
      </button>
    )
  }

  return (
    <div className="workspace">
      <header className="workspace-nav">
        <div className="workspace-wrap nav-inner">
          <span className="brand">
            <Layers3 size={27} />
            Fokus
          </span>
          <div className="account">
            <button onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="workspace-wrap work-main">
        <div className="work-header">
          <h1>
            Admin dashboard<span>.</span>
          </h1>
        </div>
        {error && (
          <div className="work-error" role="alert">
            {error}{' '}
            <button className="underline" disabled={busy} onClick={refresh}>
              Retry
            </button>
          </div>
        )}
        {!data && !error && (
          <p role="status" className="blank-state">
            Loading dashboard…
          </p>
        )}
        {data && (
          <>
            <dl className="admin-stats">
              {Object.entries({
                'Total Users': data.stats.totalUsers,
                'Total Tasks': data.stats.totalTasks,
                Completed: data.stats.completedTasks,
                'Completion Rate': `${Math.round(data.stats.completionRate)}%`,
              }).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <section className="admin-section" aria-labelledby="admin-users">
              <h2 id="admin-users">Users</h2>
              <div className="admin-table">
                <table aria-labelledby="admin-users">
                  <thead>
                    <tr>
                      {['ID', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`admin-badge ${u.isAdmin ? 'accent' : ''}`}>
                            {u.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>{date(u.createdAt)}</td>
                        <td>{deleteButton('user', u.id, u.name)}</td>
                      </tr>
                    ))}
                    {!data.users.length && (
                      <tr>
                        <td colSpan={6}>No users.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="admin-section" aria-labelledby="admin-tasks">
              <h2 id="admin-tasks">Tasks</h2>
              <div className="admin-table">
                <table aria-labelledby="admin-tasks">
                  <thead>
                    <tr>
                      {['ID', 'Title', 'User', 'Priority', 'Status', 'Created', 'Actions'].map(
                        (h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.tasks.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.title}</td>
                        <td>{t.userName}</td>
                        <td>
                          <span className={`priority priority-${t.priority}`}>{t.priority}</span>
                        </td>
                        <td>
                          <span className={`admin-badge ${t.done ? 'accent' : ''}`}>
                            {t.done ? 'Done' : 'Pending'}
                          </span>
                        </td>
                        <td>{date(t.createdAt)}</td>
                        <td>{deleteButton('task', t.id, t.title)}</td>
                      </tr>
                    ))}
                    {!data.tasks.length && (
                      <tr>
                        <td colSpan={7}>No tasks.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
