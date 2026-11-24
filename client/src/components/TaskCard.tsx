import { useState } from 'react'
import { AlertCircle, Calendar, Check, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Task, Priority } from '../types/task'

type Props = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onEdit: (
    id: number,
    fields: { title: string; description: string; priority: Priority }
  ) => Promise<boolean>
}

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
    <time
      dateTime={day}
      title={formatted}
      className={`task-date ${overdue ? 'late' : dueToday ? 'today' : ''}`}
    >
      <Icon size={13} />
      {overdue ? 'Overdue' : dueToday ? 'Due today' : formatted}
    </time>
  )
}

export default function TaskCard({ task, onToggle, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { title, description, done, dueDate, id } = task
  const priority = task.priority ?? 'medium'
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDescription, setEditDescription] = useState(description ?? '')
  const [editPriority, setEditPriority] = useState(priority)
  const [saving, setSaving] = useState(false)

  function resetEditor(open: boolean) {
    setEditTitle(title)
    setEditDescription(description ?? '')
    setEditPriority(priority)
    setIsEditing(open)
  }

  async function save() {
    if (saving || !editTitle.trim()) return
    setSaving(true)
    try {
      if (
        await onEdit(id, {
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
        })
      ) {
        setIsEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <article className="work-task">
        <form
          className="task-editor"
          aria-label={`Edit ${title}`}
          aria-busy={saving}
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !saving) {
              event.preventDefault()
              resetEditor(false)
            }
          }}
        >
          <fieldset disabled={saving}>
            <label>
              Title
              <input
                autoFocus
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
            <div>
              <label htmlFor={`task-description-${id}`}>Description</label>
              <textarea
                id={`task-description-${id}`}
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <fieldset>
              <legend>Priority</legend>
              <div className="priority-options">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    aria-pressed={editPriority === p}
                    onClick={() => setEditPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="dialog-actions">
              <button className="edit-cancel" type="button" onClick={() => resetEditor(false)}>
                Cancel
              </button>
              <button className="add-button" type="submit" disabled={!editTitle.trim() || saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </fieldset>
        </form>
      </article>
    )
  }
  return (
    <article className={`work-task ${done ? 'is-done' : ''}`}>
      <div className="task-line">
        <button
          className="task-check"
          aria-label={`Mark ${title} ${done ? 'pending' : 'done'}`}
          aria-pressed={done}
          onClick={() => onToggle(id)}
        >
          {done && <Check size={13} strokeWidth={3} />}
        </button>
        <button
          className="task-summary"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <strong>{title}</strong>
          {description && !expanded && <small>{description}</small>}
        </button>
        <div className="task-meta">
          {dueDate && <TaskDueDate value={dueDate} done={done} />}
          <span className={`priority priority-${priority}`}>
            <i aria-hidden="true" />
            {priority}
          </span>
        </div>
        <div className="card-actions">
          <button
            className="row-action task-more"
            onClick={() => resetEditor(true)}
            aria-label={`Edit ${title}`}
            title="Edit task"
          >
            <Pencil size={15} />
          </button>
          <button
            className="row-action task-more"
            onClick={() => onDelete(id)}
            aria-label={`Delete ${title}`}
            title="Delete task"
          >
            <Trash2 size={15} />
          </button>
          <button
            aria-label={`${expanded ? 'Hide' : 'Show'} details for ${title}`}
            aria-expanded={expanded}
            className="task-more"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="task-details">
          {description && <p>{description}</p>}
          <div>
            {task.createdAt && (
              <small>
                Created{' '}
                {new Date(task.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </small>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
