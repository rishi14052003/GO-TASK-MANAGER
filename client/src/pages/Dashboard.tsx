import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ListTodo, TrendingUp, Plus, X, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import type { Task as ApiTask } from '../types/task'

const Dashboard = () => {
  const { token, user } = useAuth()
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [loadedToken, setLoadedToken] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [search, setSearch] = useState('')
  const isLoading = Boolean(token) && loadedToken !== token

  useEffect(() => {
    if (!token) return
    let active = true
    api.getTasks(token)
      .then((data) => {
        if (!active) return
        setTasks(Array.isArray(data) ? data : [])
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load tasks.')
      })
      .finally(() => {
        if (active) setLoadedToken(token)
      })
    return () => {
      active = false
    }
  }, [token])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.done).length
    const pending = total - completed
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, pending, completionRate }
  }, [tasks])

  const searchQuery = search.trim().toLowerCase()
  const hasActiveSearch = searchQuery !== ''
  const hasActiveStatusFilter = filter !== 'all'
  const hasActiveFilters = hasActiveSearch || hasActiveStatusFilter

  const matchesSearch = (task: ApiTask) => {
    if (!searchQuery) return true
    return task.title.toLowerCase().includes(searchQuery) || (task.description ?? '').toLowerCase().includes(searchQuery)
  }

  let filteredTasks = tasks
  if (filter === 'pending') filteredTasks = filteredTasks.filter((task) => !task.done)
  if (filter === 'done') filteredTasks = filteredTasks.filter((task) => task.done)
  if (searchQuery) filteredTasks = filteredTasks.filter(matchesSearch)

  const matchingTasks = searchQuery ? tasks.filter(matchesSearch) : tasks
  const searchCounts = {
    all: matchingTasks.length,
    pending: matchingTasks.filter((task) => !task.done).length,
    done: matchingTasks.filter((task) => task.done).length,
  }

  let resultSummary = 'Showing all tasks'
  if (hasActiveSearch && hasActiveStatusFilter) {
    resultSummary = `Showing ${filteredTasks.length} ${filter === 'pending' ? 'pending' : 'completed'} task${filteredTasks.length !== 1 ? 's' : ''} for "${search}"`
  } else if (hasActiveSearch) {
    resultSummary = `Showing ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} for "${search}"`
  } else if (hasActiveStatusFilter) {
    resultSummary = `Showing ${filteredTasks.length} ${filter === 'pending' ? 'pending' : 'completed'} task${filteredTasks.length !== 1 ? 's' : ''}`
  }

  const clearFilters = () => {
    setSearch('')
    setFilter('all')
  }

  const handleAddTask = () => {
    if (!newTitle.trim() || !token) return
    setIsAdding(true)
    api.createTask(token, { title: newTitle.trim(), description: newDescription.trim() || undefined })
      .then((created) => {
        setTasks((prev) => [created, ...prev])
        setNewTitle('')
        setNewDescription('')
        setShowForm(false)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to create task.'))
      .finally(() => setIsAdding(false))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask() }
    if (e.key === 'Escape') setShowForm(false)
  }

  const toggleTask = (id: number) => {
    if (!token) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    api.updateTask(token, id, { done: !task.done })
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === id ? updated : t))))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to update task.'))
  }

  const deleteTask = (id: number) => {
    if (!token) return
    api.deleteTask(token, id)
      .then(() => setTasks((prev) => prev.filter((t) => t.id !== id)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to delete task.'))
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-fokus-pale text-slate-900">
      <Navbar userName={user?.name} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 rounded-3xl bg-fokus-dark-orange px-6 py-7 text-white shadow-xl shadow-fokus-dark-orange/10 sm:px-8 sm:py-9 animate-fade-in">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-fokus-yellow">Welcome back</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">{firstName}</h1>
            <p className="text-base text-white/85 mt-2">
              {stats.pending === 0
                ? "You're all caught up — nice work!"
                : `You have ${stats.pending} task${stats.pending !== 1 ? 's' : ''} pending`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-fokus-yellow hover:bg-amber-400 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-black/10 transition-all self-start sm:self-auto"
          >
            <Plus className="h-5 w-5" />
            New task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatsCard label="Total" value={stats.total} icon={<ListTodo className="h-4 w-4 text-slate-500" />} />
          <StatsCard label="Completed" value={stats.completed} accentColorClass="text-fokus-dark-orange" iconBg="bg-fokus-yellow/20" icon={<CheckCircle2 className="h-4 w-4 text-fokus-dark-orange" />} />
          <StatsCard label="Pending" value={stats.pending} accentColorClass="text-fokus-dark-orange" iconBg="bg-fokus-yellow/20" icon={<Clock3 className="h-4 w-4 text-fokus-dark-orange" />} />
          <StatsCard label="Progress" value={`${stats.completionRate}%`} accentColorClass="text-fokus-dark-orange" iconBg="bg-fokus-yellow/20" icon={<TrendingUp className="h-4 w-4 text-fokus-dark-orange" />}>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-fokus-dark-orange to-fokus-yellow transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
            </div>
          </StatsCard>
        </div>

        {/* Add task form */}
        {showForm && (
          <div className="rounded-2xl border border-fokus-dark-orange/20 bg-white p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold text-slate-800">New task</p>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all mb-3"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="Add details or context… (optional)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all resize-none mb-3"
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-fokus-pale transition-all">Cancel</button>
              <button
                onClick={handleAddTask}
                disabled={!newTitle.trim() || isAdding}
                className="px-4 py-2 rounded-xl bg-fokus-dark-orange hover:bg-fokus-dark-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all"
              >
                {isAdding ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="animate-fade-in">
          <div className="rounded-2xl border border-orange-100 bg-white p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="w-full rounded-xl border border-orange-100 bg-fokus-pale pl-10 pr-10 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fokus-dark-orange/30 focus:border-fokus-dark-orange transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Filter tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-fokus-pale border border-orange-100 self-start">
                  {(['all', 'pending', 'done'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                        filter === f ? 'bg-white text-fokus-dark-orange shadow-sm' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {f}
                      <span className="ml-1 opacity-80">
                        {f === 'all' ? `(${searchCounts.all})` : f === 'pending' ? `(${searchCounts.pending})` : `(${searchCounts.done})`}
                      </span>
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-fokus-dark-orange/50 hover:text-slate-900 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-slate-600">{resultSummary}</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm font-medium text-fokus-yellow-dark hover:text-fokus-dark-orange transition-all self-start"
                >
                  <X className="h-3 w-3" />
                  Reset view
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 mb-4">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="text-3xl mb-3">
                  {search ? '🔍' : filter === 'done' ? '🎯' : filter === 'pending' ? '✅' : '📋'}
                </p>
                <p className="text-base font-medium text-slate-800">
                  {search
                    ? filter === 'all'
                      ? `No tasks match "${search}"`
                      : `No ${filter} tasks match "${search}"`
                    : filter === 'done' ? 'No completed tasks yet'
                    : filter === 'pending' ? 'No pending tasks!'
                    : 'No tasks yet'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {search
                    ? 'Try a different search term or clear the filters'
                    : filter === 'all' ? 'Hit "New task" to get started'
                    : filter === 'pending' ? "You're all caught up 🎉"
                    : 'Complete some tasks to see them here'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 rounded-xl border border-orange-100 bg-fokus-pale px-3 py-2 text-xs text-slate-700 hover:bg-orange-50 transition-all"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="animate-slide-in">
                  <TaskCard
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    done={task.done}
                    createdAt={task.createdAt}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
