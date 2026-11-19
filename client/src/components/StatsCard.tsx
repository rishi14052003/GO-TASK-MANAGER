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
  accentColorClass = 'text-slate-900',
  icon,
  iconBg = 'bg-fokus-pale',
  children,
}: StatsCardProps) => {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6 flex flex-col gap-4 hover:border-orange-200 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-4xl font-bold tracking-tight ${accentColorClass}`}>{value}</p>
      {children}
    </div>
  )
}

export default StatsCard
