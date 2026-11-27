import { useEffect, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'
export type ToastItem = { id: string; message: string; type: ToastType }

const appearance = {
  success: {
    icon: CheckCircle2,
    colors: 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300',
  },
  error: { icon: XCircle, colors: 'bg-rose-900/90 border-rose-500/30 text-rose-300' },
  info: { icon: Info, colors: 'bg-sky-900/90 border-sky-500/30 text-sky-300' },
}

type CloseToast = (id: string) => void

export function Toast({ id, message, type, onClose }: ToastItem & { onClose: CloseToast }) {
  const [visible, setVisible] = useState(false)
  const { icon: Icon, colors } = appearance[type]

  useEffect(() => {
    const enter = window.setTimeout(() => setVisible(true), 10)
    const dismiss = window.setTimeout(() => onClose(id), 3000)
    return () => {
      window.clearTimeout(enter)
      window.clearTimeout(dismiss)
    }
  }, [id, onClose])

  return (
    <div
      className={`flex w-80 max-w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition duration-200 motion-reduce:transition-none ${colors} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span role={type === 'error' ? 'alert' : 'status'} className="flex-1 text-sm font-medium">
        {message}
      </span>
      <button type="button" aria-label="Dismiss notification" onClick={() => onClose(id)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: CloseToast }) {
  return (
    <div className="fixed right-6 bottom-6 z-50 flex max-w-[calc(100vw-3rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
