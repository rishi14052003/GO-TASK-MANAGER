import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ListTodo, TrendingUp, Plus, X, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { Task as ApiTask } from '../types/task'

const Dashboard = () => {
  const { token, user } = useAuth()
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    api.getTasks(token)
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load tasks.'))
      .finally(() => setIsLoading(false))
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

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (filter === 'pending') result = result.filter((t) => !t.done)
    if (filter === 'done') result = result.filter((t) => t.done)

    if (searchQuery) {
      result = result.filter(matchesSearch)
    }

    return result
  }, [tasks, filter, searchQuery])

  const searchCounts = useMemo(() => {
    const matchingTasks = searchQuery ? tasks.filter(matchesSearch) : tasks

    return {
      all: matchingTasks.length,
      pending: matchingTasks.filter((t) => !t.done).length,
      done: matchingTasks.filter((t) => t.done).length,
    }
  }, [tasks, searchQuery])

  const resultSummary = useMemo(() => {
    if (!hasActiveFilters) return 'Showing all tasks'
    if (hasActiveSearch && hasActiveStatusFilter) {
      return `Showing ${filteredTasks.length} ${filter === 'pending' ? 'pending' : 'completed'} task${filteredTasks.length !== 1 ? 's' : ''} for "${search}"`
    }
    if (hasActiveSearch) return `Showing ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} for "${search}"`
    return `Showing ${filteredTasks.length} ${filter === 'pending' ? 'pending' : 'completed'} task${filteredTasks.length !== 1 ? 's' : ''}`
  }, [filteredTasks.length, filter, hasActiveFilters, hasActiveSearch, hasActiveStatusFilter, search])

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

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-50">
      <Navbar userName={user?.name} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {todayLabel}
            </div>
            <p className="text-sm text-slate-500 font-medium">{greeting()},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mt-0.5">{firstName} 👋</h1>
            <p className="text-sm text-slate-400 mt-1">
              {stats.pending === 0
                ? "You're all caught up — nice work!"
                : `You have ${stats.pending} task${stats.pending !== 1 ? 's' : ''} pending`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatsCard label="Total" value={stats.total} icon={<ListTodo className="h-4 w-4 text-slate-400" />} />
          <StatsCard label="Completed" value={stats.completed} accentColorClass="text-emerald-400" iconBg="bg-emerald-500/10" icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
          <StatsCard label="Pending" value={stats.pending} accentColorClass="text-amber-400" iconBg="bg-amber-500/10" icon={<Clock3 className="h-4 w-4 text-amber-400" />} />
          <StatsCard label="Progress" value={`${stats.completionRate}%`} accentColorClass="text-sky-400" iconBg="bg-sky-500/10" icon={<TrendingUp className="h-4 w-4 text-sky-400" />}>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
            </div>
          </StatsCard>
        </div>

        {/* Add task form */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-200">New task</p>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 transition">
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
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all mb-3"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="Add details or context… (optional)"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none mb-3"
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">Cancel</button>
              <button
                onClick={handleAddTask}
                disabled={!newTitle.trim() || isAdding}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-slate-950 transition-all"
              >
                {isAdding ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="animate-fade-in">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 pl-9 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Filter tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800 self-start">
                  {(['all', 'pending', 'done'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                        filter === f ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
                    className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-slate-400">{resultSummary}</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-all self-start"
                >
                  <X className="h-3 w-3" />
                  Reset view
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-900/20 px-4 py-3 mb-4">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 py-16 text-center">
                <p className="text-3xl mb-3">
                  {search ? '🔍' : filter === 'done' ? '🎯' : filter === 'pending' ? '✅' : '📋'}
                </p>
                <p className="text-sm font-medium text-slate-300">
                  {search
                    ? filter === 'all'
                      ? `No tasks match "${search}"`
                      : `No ${filter} tasks match "${search}"`
                    : filter === 'done' ? 'No completed tasks yet'
                    : filter === 'pending' ? 'No pending tasks!'
                    : 'No tasks yet'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {search
                    ? 'Try a different search term or clear the filters'
                    : filter === 'all' ? 'Hit "New task" to get started'
                    : filter === 'pending' ? "You're all caught up 🎉"
                    : 'Complete some tasks to see them here'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-all"
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
