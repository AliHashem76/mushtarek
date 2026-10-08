'use client'

import { useActionState, useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { login } from './actions'

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState(login, undefined)
  const [show, setShow] = useState(false)
  const error = state?.error ?? initialError

  const input =
    'w-full rounded-xl border border-cyan-500/20 bg-navy/70 py-3 ps-11 pe-4 text-sm text-white ' +
    'placeholder:text-slate-500 outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20'

  return (
    <form action={action} className="space-y-4">
      <div className="relative">
        <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-cyan/70" />
        <input name="email" type="email" required dir="ltr" autoComplete="email"
          placeholder="name@company.com" className={`${input} text-left`} />
      </div>

      <div className="relative">
        <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-cyan/70" />
        <input name="password" type={show ? 'text' : 'password'} required dir="ltr"
          autoComplete="current-password" placeholder="••••••••" className={`${input} text-left`} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label="إظهار كلمة المرور"
          className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-cyan">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <button type="submit" disabled={pending}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-navy
                   shadow-glow-sm transition hover:shadow-glow hover:brightness-110 disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" /> : (
          <>تسجيل الدخول <ArrowLeft className="size-4 transition group-hover:-translate-x-1" /></>
        )}
      </button>
    </form>
  )
}
