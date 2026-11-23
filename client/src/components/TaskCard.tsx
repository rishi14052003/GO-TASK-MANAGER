import { useState } from 'react'
import { AlertCircle, Calendar, ChevronDown, Trash2 } from 'lucide-react'
import type { Priority } from '../types/task'

type TaskCardProps = {
  id: number
  title: string
  description?: string
  done: boolean
  priority: Priority
  dueDate?: string | null
  createdAt?: string
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high:   { label: 'High',   className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  low:    { label: 'Low',    className: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
}

function TaskDueDate({ value, done }: { value: string; done: boolean }) {
  // A due date is a calendar day, even when the API includes a time and offset.
  const day = value.slice(0, 10)
  const date = new Date(`${day}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = !done && date < today
  const dueToday = !done && date.getTime() === today.getTime()
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const Icon = overdue ? AlertCircle : Calendar
  const color = done ? 'text-slate-500' : overdue ? 'text-rose-400' : dueToday ? 'text-amber-400' : 'text-slate-400'

  return (
    <time dateTime={day} title={formatted} className={`mt-1 flex items-center gap-1 text-xs ${color}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {overdue ? 'Overdue' : dueToday ? 'Due today' : formatted}
    </time>
  )
}

const TaskCard = ({ id, title, description, done, priority, dueDate, createdAt, onToggle, onDelete }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false)

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const p = priorityConfig[priority] ?? priorityConfig.medium

  return (
    <div className={`group rounded-xl border transition-all duration-150 ${
      done ? 'border-slate-800/50 bg-slate-900/20' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(id)}
          className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
            done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 bg-transparent hover:border-emerald-400'
          }`}
        >
          {done && (
            <svg className="h-3 w-3 text-slate-950" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium leading-snug transition-all ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
              {title}
            </p>
            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${p.className}`}>
              {p.label}
            </span>
          </div>
          {description && !expanded && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">{description}</p>
          )}
          {description && expanded && (
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed animate-fade-in">{description}</p>
          )}
          {dueDate && <TaskDueDate value={dueDate} done={done} />}
          {formattedDate && (
            <p className="mt-1 text-xs text-slate-600">{formattedDate}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
