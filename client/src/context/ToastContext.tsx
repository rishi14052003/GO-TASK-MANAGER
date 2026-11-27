import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContainer, type ToastItem, type ToastType } from '../components/Toast'
import { ToastContext } from './useToast'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [toastHost, setToastHost] = useState<HTMLElement | null>(null)
  const [toastRoot] = useState(() => document.createElement('div'))
  // Native modal dialogs make everything outside them inert. Move the portal
  // host without remounting notifications or restarting their dismiss timers.
  useLayoutEffect(() => {
    const host = toastHost ?? document.body
    host.appendChild(toastRoot)
    return () => toastRoot.remove()
  }, [toastHost, toastRoot])

  const lastId = useRef(0)
  const showToast = useCallback((message: string, type: ToastType) => {
    lastId.current = Math.max(Date.now(), lastId.current + 1)
    const item = { id: lastId.current.toString(), message, type }
    setToasts((current) => [...current, item])
  }, [])
  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])
  const value = useMemo(() => ({ showToast, setToastHost }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(<ToastContainer toasts={toasts} onClose={removeToast} />, toastRoot)}
    </ToastContext.Provider>
  )
}
