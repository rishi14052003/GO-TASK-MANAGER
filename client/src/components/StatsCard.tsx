import { ArrowUpRight, type LucideIcon } from 'lucide-react'

type Props = { label: string; value: number; icon: LucideIcon; onClick: () => void; selected: boolean }

export default function StatsCard({ label, value, icon: Icon, onClick, selected }: Props) {
  return (
    <button className="agenda-row" aria-pressed={selected} onClick={onClick}>
      <Icon size={16} /><span>{label}</span><strong>{value}</strong><ArrowUpRight size={15} />
    </button>
  )
}
