'use client'

import { useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { btnPrimary } from '@/lib/styles'

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/80 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-cyan-500/20 bg-navy-card/95 shadow-glow sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-500/10 bg-navy-card/95 px-5 py-4 backdrop-blur">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-1 text-slate-400 hover:text-brand-cyan">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function SubmitButton({ children, className = btnPrimary }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${className} w-full`}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export function ErrorBox({ msg }: { msg: string }) {
  return msg ? (
    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{msg}</div>
  ) : null
}
