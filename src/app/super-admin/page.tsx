import Image from 'next/image'
import { CalendarClock, DollarSign, Server, Users } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { fmtUsd } from '@/lib/billing'
import { card } from '@/lib/styles'
import type { ProviderRow } from '@/lib/types'
import ProviderTable from '@/components/provider-table'
import SignOutButton from '@/components/signout-button'

export default async function SuperAdminPage() {
  await requireRole('super_admin')
  const { data } = await createAdminClient()
    .from('providers').select('*, subscribers(count)').eq('role', 'provider').order('created_at', { ascending: false })
  const providers = (data ?? []) as ProviderRow[]

  const now = Date.now()
  const live = providers.filter((p) => p.subscription_status === 'active' && (!p.expires_at || new Date(p.expires_at).getTime() > now))
  const mrr = live.reduce((a, p) => a + Number(p.monthly_fee_usd), 0)
  const expiring = providers.filter((p) => p.expires_at && new Date(p.expires_at).getTime() - now < 7 * 86_400_000).length
  const subs = providers.reduce((a, p) => a + (p.subscribers?.[0]?.count ?? 0), 0)
  const suspended = providers.filter((p) => p.subscription_status === 'suspended').length

  return (
    <div className="min-h-screen bg-navy bg-brand-glow">
      <header className="border-b border-cyan-500/15 bg-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Image src="/logo-mark.png" alt="مشترك" width={40} height={32} className="h-8 w-auto drop-shadow-[0_0_12px_rgba(0,242,254,0.5)]" />
          <p className="text-sm font-bold text-white">مشترك - لوحة المدير العام</p>
          <div className="ms-auto"><SignOutButton /></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${card} border-cyan-400/40 p-5 shadow-[0_0_50px_-12px_rgba(0,242,254,0.55)] sm:col-span-2 lg:col-span-1`}>
            <p className="flex items-center gap-2 text-xs text-slate-400"><DollarSign className="size-4 text-brand-cyan" />الإيراد الشهري المتكرر (MRR)</p>
            <p className="mt-2 bg-brand-gradient bg-clip-text text-4xl font-extrabold text-transparent" dir="ltr">{fmtUsd(mrr)}</p>
            <p className="mt-1 text-xs text-slate-500" dir="ltr">ARR {fmtUsd(mrr * 12)}</p>
          </div>
          {[
            { label: 'مزوّدون فعّالون', value: `${live.length} / ${providers.length}`, sub: `${suspended} موقوف`, icon: Server },
            { label: 'ينتهي خلال 7 أيام', value: String(expiring), sub: 'يشمل المنتهي', icon: CalendarClock },
            { label: 'إجمالي المشتركين', value: subs.toLocaleString('en-US'), sub: 'عبر كل المزوّدين', icon: Users },
          ].map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className={`${card} p-5 shadow-glow`}>
              <p className="flex items-center gap-2 text-xs text-slate-400"><Icon className="size-4 text-brand-cyan" />{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-white" dir="ltr">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </div>

        <ProviderTable providers={providers} />
      </main>
    </div>
  )
}
