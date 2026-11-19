import { useState } from 'react'
import { Trash2, ChevronDown } from 'lucide-react'

type TaskCardProps = {
  id: number
  title: string
  description?: string
  done: boolean
  createdAt?: string
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const TaskCard = ({ id, title, description, done, createdAt, onToggle, onDelete }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false)

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      className={`group rounded-xl border transition-all duration-150 ${
        done
          ? 'border-orange-200 bg-orange-50/50'
          : 'border-orange-100 bg-white hover:border-fokus-dark-orange/40'
      }`}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(id)}
          className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${
            done
              ? 'border-fokus-yellow bg-fokus-yellow'
              : 'border-slate-300 bg-transparent hover:border-fokus-dark-orange'
          }`}
        >
          {done && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium leading-snug transition-all ${done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
            {title}
          </p>
          {description && !expanded && (
            <p className="mt-1 text-sm text-slate-500 truncate">{description}</p>
          )}
          {description && expanded && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed animate-fade-in">{description}</p>
          )}
          {formattedDate && (
            <p className="mt-1 text-sm text-slate-500">{formattedDate}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-fokus-pale transition-all"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="p-1 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
