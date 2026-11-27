import { createContext, useContext } from 'react'
import type { ToastType } from '../components/Toast'

export const ToastContext = createContext<{
  showToast: (message: string, type: ToastType) => void
  setToastHost: (host: HTMLElement | null) => void
} | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast requires a ToastProvider')
  return context
}
