import { ReactNode } from 'react'

type StatsCardProps = {
  label: string
  value: string | number
  accentColorClass?: string
  icon?: ReactNode
  children?: ReactNode
}

const StatsCard = ({
  label,
  value,
  accentColorClass,
  icon,
  children,
}: StatsCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400 uppercase">{label}</p>
        {icon && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            {icon}
          </span>
        )}
      </div>
      <p
        className={`mt-1 text-2xl font-semibold ${
          accentColorClass ? accentColorClass : 'text-slate-50'
        }`}
      >
        {value}
      </p>
      {children}
    </div>
  )
}

export default StatsCard

