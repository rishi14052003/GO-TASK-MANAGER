import { useState } from 'react'
import { AlertCircle, Calendar, Check, ChevronDown, Trash2 } from 'lucide-react'
import type { Task } from '../types/task'

type Props = { task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void }

function TaskDueDate({ value, done }: { value: string; done: boolean }) {
  const day = value.slice(0, 10)
  const date = new Date(`${day}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = !done && date < today
  const dueToday = !done && date.getTime() === today.getTime()
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const Icon = overdue ? AlertCircle : Calendar
  return (
    <time dateTime={day} title={formatted} className={`task-date ${overdue ? 'late' : dueToday ? 'today' : ''}`}>
      <Icon size={13} />{overdue ? 'Overdue' : dueToday ? 'Due today' : formatted}
    </time>
  )
}

export default function TaskCard({ task, onToggle, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { title, description, done, dueDate, id } = task
  const priority = task.priority ?? 'medium'
  return (
    <article className={`work-task ${done ? 'is-done' : ''}`}>
      <div className="task-line">
        <button className="task-check" aria-label={`Mark ${title} ${done ? 'pending' : 'done'}`} aria-pressed={done} onClick={() => onToggle(id)}>
          {done && <Check size={13} strokeWidth={3} />}
        </button>
        <button className="task-summary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          <strong>{title}</strong>{description && !expanded && <small>{description}</small>}
        </button>
        <div className="task-meta">
          {dueDate && <TaskDueDate value={dueDate} done={done} />}
          <span className={`priority priority-${priority}`}><i aria-hidden="true" />{priority}</span>
        </div>
        <button aria-label={`${expanded ? 'Hide' : 'Show'} details for ${title}`} aria-expanded={expanded} className="task-more" onClick={() => setExpanded(!expanded)}><ChevronDown size={16} /></button>
      </div>
      {expanded && <div className="task-details">
        {description && <p>{description}</p>}
        <div>{task.createdAt && <small>Created {new Date(task.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</small>}
          <button onClick={() => onDelete(id)} aria-label={`Delete ${title}`}><Trash2 size={14} />Delete task</button>
        </div>
      </div>}
    </article>
  )
}
