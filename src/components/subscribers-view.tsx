'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Globe, MessageCircle, Plus, RefreshCw, Satellite, Search, UserX, Zap } from 'lucide-react'
import type { Settings, SubscriberRow } from '@/lib/types'
import { buildWhatsAppUrl, fmtLbp, fmtUsd } from '@/lib/billing'
import { btnGhost, btnPrimary, card, inputCls } from '@/lib/styles'
import { markPaid } from '@/app/dashboard/actions'
import AddSubscriberModal from './add-subscriber-modal'
import RenewModal from './renew-modal'

const tag = 'inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-gradient-to-l from-brand-cyan/15 to-brand-blue/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100'

function PaidButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return (
    <button disabled={pending} onClick={() => start(async () => { await markPaid(id) })} className={`${btnGhost} !px-2.5 !py-1.5 text-xs`}>
      <CheckCircle2 className="size-3.5" /> تم الدفع
    </button>
  )
}

function StatusBadge({ row }: { row: SubscriberRow }) {
  const s = row.current?.status
  if (s === 'paid') return <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">مدفوعة</span>
  if (s === 'unpaid')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
        <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-amber-300" /></span>
        غير مدفوعة
      </span>
    )
  return <span className="rounded-full border border-slate-600 bg-slate-700/30 px-2.5 py-1 text-xs text-slate-400">بانتظار التجديد</span>
}

export default function SubscribersView({ rows, settings, providerName }: { rows: SubscriberRow[]; settings: Settings; providerName: string }) {
  const [q, setQ] = useState('')
  const [zone, setZone] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState('')
  const [adding, setAdding] = useState(false)
  const [renewing, setRenewing] = useState<SubscriberRow | null>(null)

  const zones = useMemo(() => [...new Set(rows.map((r) => r.address_zone).filter(Boolean))] as string[], [rows])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (t && !`${r.full_name} ${r.phone} ${r.meter_number ?? ''}`.toLowerCase().includes(t)) return false
      if (zone && r.address_zone !== zone) return false
      if (service === 'gen' && !r.has_generator) return false
      if (service === 'net' && !r.has_internet) return false
      if (service === 'sat' && !r.has_satellite) return false
      if (status === 'none' && r.current) return false
      if (status && status !== 'none' && r.current?.status !== status) return false
      return true
    })
  }, [rows, q, zone, service, status])

  const select = `${inputCls} !w-auto min-w-32`

  return (
    <section className={`${card} shadow-glow`}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-cyan-500/10 p-4">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-brand-cyan/70" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو العدّاد" className={`${inputCls} ps-10`} />
        </div>
        <select value={zone} onChange={(e) => setZone(e.target.value)} className={select}>
          <option value="">كل المناطق</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select value={service} onChange={(e) => setService(e.target.value)} className={select}>
          <option value="">كل الخدمات</option>
          <option value="gen">⚡ مولد</option>
          <option value="net">🌐 إنترنت</option>
          <option value="sat">📡 دش</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
          <option value="">كل الحالات</option>
          <option value="none">بانتظار التجديد</option>
          <option value="unpaid">غير مدفوعة</option>
          <option value="paid">مدفوعة</option>
        </select>
        <button onClick={() => setAdding(true)} className={btnPrimary}><Plus className="size-4" /> إضافة مشترك</button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-slate-400">
          <UserX className="size-10 text-cyan-500/40" />
          <p>{rows.length ? 'لا نتائج مطابقة، غيّر البحث أو الفلاتر.' : 'لا يوجد مشتركون بعد. أضف أول مشترك للبدء.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-cyan-500/10 text-start text-xs text-slate-400">
                {['المشترك', 'العنوان', 'الخدمات', 'فاتورة الشهر', 'المبلغ', ''].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-cyan-500/5 transition hover:bg-cyan-500/5">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{r.full_name}</p>
                    <p className="text-xs text-slate-400" dir="ltr">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {[r.address_zone, r.address_building && `مبنى ${r.address_building}`, r.address_floor && `طابق ${r.address_floor}`].filter(Boolean).join(' - ') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.has_generator && <span className={tag}><Zap className="size-3" />{r.generator_type === 'meter' ? `عدّاد ${r.meter_number ?? ''}` : 'مولد ثابت'}</span>}
                      {r.has_internet && <span className={tag}><Globe className="size-3" />{r.internet_plan_name || 'إنترنت'}</span>}
                      {r.has_satellite && <span className={tag}><Satellite className="size-3" />دش</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge row={r} />
                    {!r.current && r.debt > 0 && <p className="mt-1 text-xs text-red-300">دين سابق {fmtUsd(r.debt)}</p>}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {r.current ? (
                      <>
                        <p className="text-start font-bold text-white">{fmtUsd(r.current.total_amount_usd)}</p>
                        <p className="text-start text-xs text-slate-400">{fmtLbp(r.current.total_amount_lbp)}</p>
                      </>
                    ) : <span className="text-slate-600">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!r.current && (
                        <button onClick={() => setRenewing(r)} className={`${btnPrimary} !px-3 !py-1.5 text-xs`}><RefreshCw className="size-3.5" /> تجديد</button>
                      )}
                      {r.current?.status === 'unpaid' && (
                        <>
                          <a href={buildWhatsAppUrl(r.current, r, providerName)} target="_blank" rel="noopener noreferrer" aria-label="إرسال عبر واتساب"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20">
                            <MessageCircle className="size-3.5" /> واتساب
                          </a>
                          <PaidButton id={r.current.id} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddSubscriberModal onClose={() => setAdding(false)} />}
      {renewing && <RenewModal row={renewing} settings={settings} providerName={providerName} onClose={() => setRenewing(null)} />}
    </section>
  )
}
