import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ListTodo, Percent } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import TaskCard from '../components/TaskCard'

type Task = {
  id: number
  title: string
  description?: string
  completed: boolean
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([
    // Sample UI data – will be replaced by API integration
    {
      id: 1,
      title: 'Set up GoTask Pro',
      description: 'Connect frontend to Go backend and test JWT flow.',
      completed: true,
    },
    {
      id: 2,
      title: 'Create first task list',
      description: 'Add tasks, toggle status, and verify stats updates.',
      completed: false,
    },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const pending = total - completed
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, pending, completionRate }
  }, [tasks])

  const handleAddTask = () => {
    if (!newTitle.trim()) return
    const nextId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1
    const task: Task = {
      id: nextId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      completed: false,
    }
    setTasks((prev) => [task, ...prev])
    setNewTitle('')
    setNewDescription('')
  }

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar userName="User" />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header + stats */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Your tasks overview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Stay on top of your workload with a clear summary of what&apos;s
                done and what&apos;s next.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatsCard
              label="Total tasks"
              value={stats.total}
              icon={<ListTodo className="h-3.5 w-3.5" />}
            />
            <StatsCard
              label="Completed"
              value={stats.completed}
              accentColorClass="text-emerald-400"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            />
            <StatsCard
              label="Pending"
              value={stats.pending}
              accentColorClass="text-amber-400"
              icon={<Clock3 className="h-3.5 w-3.5 text-amber-400" />}
            />
            <StatsCard
              label="Completion"
              value={`${stats.completionRate}%`}
              icon={<Percent className="h-3.5 w-3.5 text-sky-400" />}
            >
              <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </StatsCard>
          </div>
        </section>

        {/* Task creation + list */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-6 items-start">
          {/* Task list */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-slate-100">
                Tasks ({tasks.length})
              </p>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No tasks yet. Add your first task on the right.
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    completed={task.completed}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add task form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-100">Add new task</p>
              <p className="text-xs text-slate-400 mt-1">
                Capture what you need to do next. You can mark it done or remove it
                anytime.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="task-title"
                  className="block text-xs font-medium text-slate-300"
                >
                  Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Review upcoming sprint tasks"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="task-desc"
                  className="block text-xs font-medium text-slate-300"
                >
                  Description (optional)
                </label>
                <textarea
                  id="task-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Add details, context, or links..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleAddTask}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!newTitle.trim()}
            >
              Add task
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard

