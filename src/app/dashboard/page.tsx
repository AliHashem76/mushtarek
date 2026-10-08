import { Users, Wallet, Hourglass } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { currentBillingMonth, fmtUsd } from '@/lib/billing'
import { card } from '@/lib/styles'
import type { Invoice, Settings, Subscriber, SubscriberRow } from '@/lib/types'
import SubscribersView from '@/components/subscribers-view'

export default async function DashboardPage() {
  const { supabase, profile } = await requireRole('provider')
  const month = currentBillingMonth()

  const [{ data: subs }, { data: st }, { data: invs }] = await Promise.all([
    supabase.from('subscribers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('provider_settings').select('*').eq('provider_id', profile.id).single(),
    supabase.from('invoices').select('*').or(`status.eq.unpaid,billing_month.eq.${month}`).order('billing_month', { ascending: false }),
  ])

  const settings = (st ?? { provider_id: profile.id, usd_rate: 89500, kwh_price_usd: 0.35, base_generator_fee: 0 }) as Settings
  const invoices = (invs ?? []) as Invoice[]

  const rows: SubscriberRow[] = ((subs ?? []) as Subscriber[]).map((s) => {
    const mine = invoices.filter((i) => i.subscriber_id === s.id)
    const current = mine.find((i) => i.billing_month === month) ?? null
    const oldUnpaid = mine.find((i) => i.status === 'unpaid' && i.billing_month < month)
    return { ...s, current, debt: Number(oldUnpaid?.total_amount_usd ?? 0) }
  })

  const collected = rows.reduce((a, r) => a + (r.current?.status === 'paid' ? Number(r.current.total_amount_usd) : 0), 0)
  const outstanding = rows.reduce((a, r) => a + (r.current?.status === 'unpaid' ? Number(r.current.total_amount_usd) : r.debt), 0)

  const stats = [
    { label: 'المشتركون الفعّالون', value: rows.length.toLocaleString('en-US'), icon: Users },
    { label: 'المحصّل هذا الشهر', value: fmtUsd(collected), icon: Wallet },
    { label: 'مستحقات غير مدفوعة', value: fmtUsd(outstanding), icon: Hourglass },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} flex items-center gap-4 p-4 shadow-glow`}>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-navy"><Icon className="size-5" /></span>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-xl font-extrabold text-white" dir="ltr">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <SubscribersView rows={rows} settings={settings} providerName={profile.business_name} />
    </div>
  )
}
