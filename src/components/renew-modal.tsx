'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, MessageCircle, RefreshCw } from 'lucide-react'
import { Modal, Field, ErrorBox } from './ui'
import { btnGhost, btnPrimary, btnWhatsApp, inputCls } from '@/lib/styles'
import { buildWhatsAppUrl, calcInvoice, fmtLbp, fmtUsd } from '@/lib/billing'
import { renewSubscriber } from '@/app/dashboard/actions'
import type { Invoice, Settings, SubscriberRow } from '@/lib/types'

function Line({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={warn ? 'text-amber-300' : 'text-slate-300'}>
        {label}
        {hint && <span className="ms-2 text-xs text-slate-500" dir="ltr">{hint}</span>}
      </span>
      <span className="font-semibold text-white" dir="ltr">{value}</span>
    </div>
  )
}

export default function RenewModal({ row, settings, providerName, onClose }: {
  row: SubscriberRow; settings: Settings; providerName: string; onClose: () => void
}) {
  const [reading, setReading] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<Invoice | null>(null)
  const [pending, start] = useTransition()

  const metered = row.has_generator && row.generator_type === 'meter'
  const curr = metered ? parseFloat(reading) : undefined
  const calc = calcInvoice(row, settings, row.debt, curr)

  const submit = () =>
    start(async () => {
      const r = await renewSubscriber(row.id, curr)
      if ('error' in r) setError(r.error); else setDone(r.invoice)
    })

  if (done)
    return (
      <Modal title="تم إصدار الفاتورة" onClose={onClose}>
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto size-14 text-brand-cyan drop-shadow-[0_0_16px_rgba(0,242,254,0.6)]" />
          <div>
            <p className="text-sm text-slate-400">{row.full_name}</p>
            <p className="bg-brand-gradient bg-clip-text text-3xl font-extrabold text-transparent" dir="ltr">{fmtUsd(done.total_amount_usd)}</p>
            <p className="text-sm text-slate-300" dir="ltr">{fmtLbp(done.total_amount_lbp)}</p>
          </div>
          <a href={buildWhatsAppUrl(done, row, providerName)} target="_blank" rel="noopener noreferrer" className={`${btnWhatsApp} w-full`}>
            <MessageCircle className="size-4" /> إرسال الفاتورة عبر واتساب
          </a>
          <button onClick={onClose} className={`${btnGhost} w-full`}>إغلاق</button>
        </div>
      </Modal>
    )

  return (
    <Modal title={`تجديد اشتراك - ${row.full_name}`} onClose={onClose}>
      <div className="space-y-4">
        {metered && (
          <Field label={`القراءة الحالية للعدّاد (السابقة: ${row.last_meter_reading})`}>
            <input autoFocus type="number" step="any" min={row.last_meter_reading} inputMode="decimal" dir="ltr"
              value={reading} onChange={(e) => setReading(e.target.value)} placeholder="0" className={`${inputCls} text-lg font-bold`} />
          </Field>
        )}

        <div className="space-y-2.5 rounded-2xl border border-cyan-500/15 bg-navy/60 p-4">
          {calc.ok ? (
            <>
              {row.has_generator && (
                <Line label="⚡ المولد" value={fmtUsd(calc.generator)}
                  hint={calc.kwh != null ? `${calc.kwh} kWh × ${settings.kwh_price_usd} + ${settings.base_generator_fee}` : undefined} />
              )}
              {row.has_internet && <Line label="🌐 الإنترنت" value={fmtUsd(calc.internet)} hint={row.internet_plan_name ?? undefined} />}
              {row.has_satellite && <Line label="📡 الدش" value={fmtUsd(calc.satellite)} />}
              {calc.debt > 0 && <Line label="⚠️ رصيد سابق" value={fmtUsd(calc.debt)} warn />}
              <div className="my-1 border-t border-cyan-500/15" />
              <Line label="الإجمالي بالدولار" value={fmtUsd(calc.usd)} />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-300">الإجمالي بالليرة</span>
                <span className="bg-brand-gradient bg-clip-text text-xl font-extrabold text-transparent" dir="ltr">{fmtLbp(calc.lbp)}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400">{calc.reason}</p>
          )}
        </div>

        <ErrorBox msg={error} />
        <button onClick={submit} disabled={!calc.ok || pending} className={`${btnPrimary} w-full`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <><RefreshCw className="size-4" /> تجديد وإصدار الفاتورة</>}
        </button>
      </div>
    </Modal>
  )
}
