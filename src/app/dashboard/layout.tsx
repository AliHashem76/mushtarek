import { requireRole } from '@/lib/auth'
import TopBar from '@/components/top-bar'
import type { Settings } from '@/lib/types'


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireRole('provider')
  const { data } = await supabase.from('provider_settings').select('*').eq('provider_id', profile.id).single()
  const settings = (data ?? { provider_id: profile.id, usd_rate: 89500, kwh_price_usd: 0.35, base_generator_fee: 0 }) as Settings

  return (
    <div className="min-h-screen bg-navy bg-brand-glow">
      <TopBar businessName={profile.business_name} ownerName={profile.owner_name} settings={settings} />
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  )
}
