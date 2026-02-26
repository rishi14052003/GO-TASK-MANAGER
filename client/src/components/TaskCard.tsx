type TaskCardProps = {
  id: number
  title: string
  description?: string
  completed: boolean
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const TaskCard = ({
  id,
  title,
  description,
  completed,
  onToggle,
  onDelete,
}: TaskCardProps) => {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
      <button
        onClick={() => onToggle(id)}
        className={`mt-0.5 h-5 w-5 flex items-center justify-center rounded-md border text-xs transition ${
          completed
            ? 'border-emerald-500 bg-emerald-500 text-slate-950'
            : 'border-slate-600 bg-slate-950 text-slate-500 group-hover:border-emerald-500'
        }`}
      >
        {completed ? '✓' : ''}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            completed ? 'text-slate-400 line-through' : 'text-slate-100'
          }`}
        >
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(id)}
        className="mt-0.5 text-xs text-slate-500 hover:text-rose-400 transition"
      >
        Delete
      </button>
    </div>
  )
}

export default TaskCard

