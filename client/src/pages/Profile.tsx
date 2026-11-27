import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { api } from '../services/api'
import './Dashboard.css'
import '../components/AuthLayout.css'

export default function Profile() {
  const { user, token, updateUser } = useAuth()
  const { showToast } = useToast()
  const [draftName, setDraftName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const name = draftName ?? user?.name ?? ''

  useEffect(() => {
    if (!token) return
    let active = true
    api
      .getProfile(token)
      .then((profile) => {
        if (active) updateUser(profile)
      })
      .catch((err: unknown) => {
        if (active)
          showToast(err instanceof Error ? err.message : 'Unable to load profile.', 'error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, updateUser, showToast])

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || loading || savingName) return
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error')
      return
    }
    setSavingName(true)
    try {
      updateUser(await api.updateProfile(token, name.trim()))
      setDraftName(null)
      showToast('Name updated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update name.', 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || savingPassword) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const current = String(fields.get('current-password'))
    const next = String(fields.get('new-password'))
    if ([...next].length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (next !== fields.get('confirm-password')) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await api.changePassword(token, current, next)
      form.reset()
      showToast('Password changed', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to change password.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="workspace">
      <Navbar userName={user?.name} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold">Profile settings</h1>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-semibold">Personal info</h2>
          <form onSubmit={saveName} className="space-y-4">
            <div className="auth-field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                autoComplete="name"
                required
                value={name}
                disabled={savingName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Email</p>
              <p className="break-words text-slate-400">{user?.email}</p>
            </div>
            <button className="add-button" disabled={loading || savingName}>
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-semibold">Change password</h2>
          <form onSubmit={savePassword}>
            <fieldset disabled={savingPassword} className="space-y-4">
              <PasswordField
                id="current-password"
                label="Current password"
                autoComplete="current-password"
                placeholder="Enter current password"
              />
              <PasswordField
                id="new-password"
                label="New password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
              <button className="add-button">{savingPassword ? 'Saving…' : 'Save password'}</button>
            </fieldset>
          </form>
        </section>
      </main>
    </div>
  )
}
