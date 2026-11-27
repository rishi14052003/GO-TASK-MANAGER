import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpDown,
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  Columns2,
  LayoutList,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react'
import './Dashboard.css'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { api } from '../services/api'
import type { Task as ApiTask, Priority } from '../types/task'

const priorities: Priority[] = ['low', 'medium', 'high']
type Deadline = 'all' | 'overdue' | 'today' | 'upcoming'
const deadlineLabels = { overdue: 'Overdue', today: 'Due today', upcoming: 'Upcoming' } as const

function deadlineOf(task: ApiTask, today: string): Deadline {
  if (task.done || !task.dueDate) return 'all'
  const day = task.dueDate.slice(0, 10)
  return day < today ? 'overdue' : day === today ? 'today' : 'upcoming'
}

const Dashboard = () => {
  const { token, user } = useAuth()
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { showToast, setToastHost } = useToast()
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [search, setSearch] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const searchTerm = search.trim()
  const [view, setView] = useState<'list' | 'board'>('list')
  const [deadline, setDeadline] = useState<Deadline>('all')
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  useEffect(() => {
    if (!token) return
    let active = true
    api
      .getTasks(token)
      .then((data) => {
        if (active) {
          setTasks(Array.isArray(data) ? data : [])
        }
      })
      .catch((err: unknown) => {
        if (active) showToast(err instanceof Error ? err.message : 'Unable to load tasks.', 'error')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, showToast])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return
      if (event.key === 'Escape') {
        if (showForm) {
          event.preventDefault()
          if (!isAdding) setShowForm(false)
        } else if (search) {
          setSearch('')
        }
        return
      }

      const target = event.target
      if (showForm || event.repeat || !(target instanceof HTMLElement)) return
      if (target.isContentEditable || target.closest('input, textarea, select')) return
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setShowForm(true)
      } else if (event.key === '/') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, isAdding, search])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.done).length
    const pending = total - completed
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, pending, completionRate }
  }, [tasks])

  const tasksInFilter = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus = filter === 'all' || task.done === (filter === 'done')
        const matchesPriority =
          priorityFilter === 'all' || (task.priority ?? 'medium') === priorityFilter
        return (
          matchesStatus &&
          matchesPriority &&
          (deadline === 'all' || deadlineOf(task, today) === deadline)
        )
      }),
    [tasks, filter, priorityFilter, deadline, today]
  )

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasksInFilter
    const query = searchTerm.toLowerCase()
    return tasksInFilter.filter(
      (task) =>
        task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
    )
  }, [tasksInFilter, searchTerm])

  const [sortBy, setSortBy] = useState('newest')
  const sortedTasks = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...filteredTasks].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return Date.parse(a.createdAt) - Date.parse(b.createdAt)
        case 'priority-high':
          return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
        case 'priority-low':
          return (priorityOrder[b.priority] ?? 1) - (priorityOrder[a.priority] ?? 1)
        case 'alpha-asc':
          return a.title.localeCompare(b.title)
        case 'alpha-desc':
          return b.title.localeCompare(a.title)
        default:
          return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      }
    })
  }, [filteredTasks, sortBy])

  const searchCausedEmpty = tasksInFilter.length > 0 && filteredTasks.length === 0

  const handleAddTask = () => {
    if (!newTitle.trim() || !token || isAdding) return
    setIsAdding(true)
    api
      .createTask(token, {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        dueDate: newDueDate || undefined,
      })
      .then((created) => {
        setTasks((prev) => [created, ...prev])
        showToast('Task created', 'success')
        setNewTitle('')
        setNewDescription('')
        setNewDueDate('')
        setNewPriority('medium')
        setShowForm(false)
      })
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Unable to create task.', 'error')
      )
      .finally(() => setIsAdding(false))
  }

  const toggleTask = (id: number) => {
    if (!token) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    api
      .updateTask(token, id, { done: !task.done })
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        showToast('Task updated', 'success')
      })
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Unable to update task.', 'error')
      )
  }

  const editTask = async (
    id: number,
    updates: Pick<ApiTask, 'title' | 'description' | 'priority'>
  ) => {
    if (!token) return false
    try {
      const updated = await api.updateTask(token, id, updates)
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)))
      showToast('Task saved', 'success')
      return true
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save task.', 'error')
      return false
    }
  }

  const deleteTask = (id: number) => {
    if (!token) return
    api
      .deleteTask(token, id)
      .then(() => {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        showToast('Task deleted', 'success')
      })
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Unable to delete task.', 'error')
      )
  }

  function pickDeadline(next: Exclude<Deadline, 'all'>) {
    setDeadline(deadline === next ? 'all' : next)
    setFilter('all')
  }

  const renderTask = (task: ApiTask) => (
    <TaskCard
      key={task.id}
      task={task}
      onToggle={toggleTask}
      onDelete={deleteTask}
      onEdit={editTask}
    />
  )
  return (
    <div className="workspace">
      <Navbar userName={user?.name} />
      <main className="workspace-wrap work-main">
        <div className="work-header">
          <div>
            <p className="work-date">
              <Calendar size={14} />
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1>
              My workspace<span>.</span>
            </h1>
          </div>
          <button className="add-button" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            New task
          </button>
        </div>
        <section className="overview" aria-label="Workspace overview">
          <div className="progress-panel">
            <div className="contours" aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <i key={i} style={{ width: 104 + i * 19, height: 62 + i * 14 }} />
              ))}
            </div>
            <div className="progress-content">
              <h2>
                <Activity size={17} />
                Completion rate
              </h2>
              <strong>
                {stats.completionRate}
                <small>%</small>
              </strong>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Task completion"
                aria-valuenow={stats.completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${stats.completionRate}%` }} />
              </div>
              <p>
                {stats.completed} of {stats.total} tasks complete
              </p>
            </div>
          </div>
          <div className="agenda">
            <h2>
              <CalendarClock size={17} />
              Deadlines
            </h2>
            {(['overdue', 'today', 'upcoming'] as const).map((key) => (
              <StatsCard
                key={key}
                label={deadlineLabels[key]}
                value={tasks.filter((task) => deadlineOf(task, today) === key).length}
                icon={key === 'overdue' ? AlertCircle : key === 'today' ? Sun : Calendar}
                selected={deadline === key}
                onClick={() => pickDeadline(key)}
              />
            ))}
          </div>
        </section>
        <section className="tasks-section" aria-label="My tasks">
          <div className="tasks-header">
            <h2>
              My tasks <span>{stats.total}</span>
            </h2>
            <div className="view-switch" aria-label="Task view">
              <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
                <LayoutList size={15} />
                List
              </button>
              <button aria-pressed={view === 'board'} onClick={() => setView('board')}>
                <Columns2 size={15} />
                Board
              </button>
            </div>
          </div>
          <div className="task-toolbar">
            <div className="search-field">
              <Search size={16} />
              <input
                ref={searchInput}
                aria-label="Search tasks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch('')
                    searchInput.current?.focus()
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="status-filters" aria-label="Task status">
              {(['all', 'pending', 'done'] as const).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f}{' '}
                  <span>
                    {f === 'all' ? stats.total : f === 'pending' ? stats.pending : stats.completed}
                  </span>
                </button>
              ))}
            </div>
            <label className="priority-select">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              >
                <option value="all">All priorities</option>
                {priorities.map((p) => (
                  <option value={p} key={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <select
                aria-label="Sort tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer bg-transparent text-sm text-slate-300 [color-scheme:dark]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority-high">Priority: High → Low</option>
                <option value="priority-low">Priority: Low → High</option>
                <option value="alpha-asc">Name: A → Z</option>
                <option value="alpha-desc">Name: Z → A</option>
              </select>
            </div>
          </div>
          {deadline !== 'all' && (
            <button
              className="deadline-chip"
              onClick={() => setDeadline('all')}
              aria-label={`Clear ${deadlineLabels[deadline]} filter`}
            >
              {deadlineLabels[deadline]} <X size={13} />
            </button>
          )}
          {search && !isLoading && (
            <p className="search-count" role="status">
              {filteredTasks.length === 0
                ? 'No tasks match your search'
                : `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} found`}
            </p>
          )}

          {isLoading ? (
            <p className="blank-state">Loading tasks…</p>
          ) : filteredTasks.length === 0 ? (
            <div className="blank-state">
              <strong>
                {searchCausedEmpty
                  ? `🔍 No tasks match "${searchTerm}"`
                  : deadline !== 'all' || priorityFilter !== 'all'
                    ? 'No tasks in this view'
                    : filter === 'done'
                      ? 'No completed tasks yet'
                      : filter === 'pending'
                        ? 'No pending tasks!'
                        : 'No tasks yet'}
              </strong>
              <p>
                {searchCausedEmpty
                  ? 'Try a different search term'
                  : deadline !== 'all' || priorityFilter !== 'all'
                    ? 'Try a different filter.'
                    : filter === 'pending'
                      ? "You're all caught up 🎉"
                      : filter === 'done'
                        ? 'Complete some tasks to see them here'
                        : 'Hit "New task" to get started'}
              </p>
            </div>
          ) : view === 'list' ? (
            <div className="task-list">{sortedTasks.map(renderTask)}</div>
          ) : (
            <div className="task-board">
              {(['pending', 'done'] as const)
                .filter((status) => filter === 'all' || filter === status)
                .map((status) => {
                  const cards = sortedTasks.filter((task) => task.done === (status === 'done'))
                  return (
                    <section key={status} className="board-column">
                      <h3>
                        <i className={status} />
                        {status}
                        <span>{cards.length}</span>
                      </h3>
                      {cards.length ? (
                        cards.map(renderTask)
                      ) : (
                        <p className="column-empty">No {status} tasks</p>
                      )}
                    </section>
                  )
                })}
            </div>
          )}
        </section>
        <div className="mt-8 flex items-center justify-center gap-6 pb-6">
          {[
            { key: 'N', label: 'New task' },
            { key: '/', label: 'Search' },
            { key: 'Esc', label: 'Close' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-400">
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono">
                {key}
              </kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </main>
      {showForm && (
        <dialog
          className="task-dialog"
          aria-labelledby="new-task-heading"
          ref={(dialog) => {
            if (dialog && !dialog.open) dialog.showModal()
          }}
          onClose={() => setShowForm(false)}
          onCancel={(e) => {
            if (isAdding) e.preventDefault()
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddTask()
            }}
          >
            <div className="dialog-top">
              <h2 id="new-task-heading">New task</h2>
              <button
                type="button"
                aria-label="Close form"
                disabled={isAdding}
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Task name
              <input
                autoFocus
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </label>
            <label>
              Description
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Add details or context…"
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>Priority</legend>
              <div className="priority-options">
                {priorities.map((p) => (
                  <button
                    type="button"
                    key={p}
                    aria-pressed={newPriority === p}
                    onClick={() => setNewPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="dialog-actions">
              <button type="button" disabled={isAdding} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="add-button" disabled={!newTitle.trim() || isAdding}>
                <Check size={16} />
                {isAdding ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </form>
          <div ref={setToastHost} />
        </dialog>
      )}
    </div>
  )
}

export default Dashboard
