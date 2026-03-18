import type { ReactNode } from 'react'

type StatsCardProps = {
  label: string
  value: string | number
  accentColorClass?: string
  icon?: ReactNode
  iconBg?: string
  children?: ReactNode
}

const StatsCard = ({
  label,
  value,
  accentColorClass = 'text-slate-50',
  icon,
  iconBg = 'bg-slate-800',
  children,
}: StatsCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col gap-3 hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accentColorClass}`}>{value}</p>
      {children}
    </div>
  )
}

export default StatsCard
