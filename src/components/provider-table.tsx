'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import type { ProviderRow } from '@/lib/types'
import { fmtDate } from '@/lib/billing'
import { btnGhost, btnPrimary, card, inputCls } from '@/lib/styles'
import { createProvider, extendExpiry, setFee, setStatus } from '@/app/super-admin/actions'
import { ErrorBox, Field, Modal, SubmitButton } from './ui'

const DAY = 86_400_000

function Row({ p }: { p: ProviderRow }) {
  const [pending, start] = useTransition()
  const active = p.subscription_status === 'active'
  const left = p.expires_at ? (new Date(p.expires_at).getTime() - Date.now()) / DAY : Infinity
  const expiryCls = left < 0 ? 'text-red-300' : left <= 7 ? 'text-amber-300' : 'text-slate-200'

  return (
    <tr className={`border-b border-cyan-500/5 transition hover:bg-cyan-500/5 ${pending ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <p className="font-semibold text-white">{p.business_name}</p>
        <p className="text-xs text-slate-400">{p.owner_name} - <span dir="ltr">{p.phone}</span></p>
      </td>
      <td className="px-4 py-3 text-center font-semibold text-white">{p.subscribers?.[0]?.count ?? 0}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" dir="ltr">
          <span className="text-slate-400">$</span>
          <input type="number" min="0" step="any" defaultValue={p.monthly_fee_usd} aria-label="الرسم الشهري"
            onBlur={(e) => Number(e.target.value) !== Number(p.monthly_fee_usd) && start(() => setFee(p.id, parseFloat(e.target.value)))}
            className={`${inputCls} !w-20 !px-2 !py-1.5`} />
        </div>
      </td>
      <td className="px-4 py-3">
        <p className={`font-semibold ${expiryCls}`} dir="ltr">{p.expires_at ? fmtDate(p.expires_at) : 'بدون انتهاء'}</p>
        <div className="mt-1.5 flex gap-1.5">
          {[1, 3, 12].map((m) => (
            <button key={m} disabled={pending} onClick={() => start(() => extendExpiry(p.id, m))} className={`${btnGhost} !gap-1 !px-2 !py-1 text-[11px]`}>
              <CalendarPlus className="size-3" />{m === 12 ? 'سنة' : `${m} ${m === 1 ? 'شهر' : 'أشهر'}`}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button role="switch" aria-checked={active} aria-label="حالة الاشتراك" disabled={pending}
            onClick={() => start(() => setStatus(p.id, active ? 'suspended' : 'active'))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-brand-gradient shadow-glow-sm' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${active ? 'start-[1.375rem]' : 'start-0.5'}`} />
          </button>
          {active ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan">
              <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-cyan opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-brand-cyan" /></span>
              فعّال
            </span>
          ) : <span className="text-xs font-semibold text-red-300">موقوف</span>}
        </div>
      </td>
    </tr>
  )
}

export default function ProviderTable({ providers }: { providers: ProviderRow[] }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  return (
    <section className={`${card} shadow-glow`}>
      <div className="flex items-center justify-between border-b border-cyan-500/10 p-4">
        <h2 className="font-bold text-white">المزوّدون ({providers.length})</h2>
        <button onClick={() => setAdding(true)} className={btnPrimary}><Plus className="size-4" /> مزوّد جديد</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-cyan-500/10 text-xs text-slate-400">
              {['المزوّد', 'المشتركون', 'الرسم الشهري', 'انتهاء الاشتراك', 'الحالة'].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => <Row key={p.id} p={p} />)}
            {!providers.length && <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-400">لا يوجد مزوّدون بعد. أضف أول مزوّد.</td></tr>}
          </tbody>
        </table>
      </div>

      {adding && (
        <Modal title="إضافة مزوّد خدمة" onClose={() => setAdding(false)}>
          <form
            action={async (fd) => {
              const r = await createProvider(fd)
              if (r.error) setError(r.error); else setAdding(false)
            }}
            className="space-y-3"
          >
            <Field label="اسم المشروع"><input name="business_name" required className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم المالك"><input name="owner_name" required className={inputCls} /></Field>
              <Field label="الهاتف"><input name="phone" required dir="ltr" className={inputCls} /></Field>
            </div>
            <Field label="البريد الإلكتروني"><input name="email" type="email" required dir="ltr" className={inputCls} /></Field>
            <Field label="كلمة المرور (8 أحرف على الأقل)"><input name="password" type="text" minLength={8} required dir="ltr" className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الرسم الشهري ($)"><input name="monthly_fee_usd" type="number" step="any" min="0" defaultValue={25} dir="ltr" className={inputCls} /></Field>
              <Field label="مدة الاشتراك (أشهر)"><input name="months" type="number" min="1" defaultValue={1} dir="ltr" className={inputCls} /></Field>
            </div>
            <ErrorBox msg={error} />
            <SubmitButton>إنشاء الحساب</SubmitButton>
          </form>
        </Modal>
      )}
    </section>
  )
}
