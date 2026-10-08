'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function guard() {
  await requireRole('super_admin')
  return createAdminClient()
}
const done = () => revalidatePath('/super-admin')

export async function setStatus(id: string, status: 'active' | 'suspended') {
  const admin = await guard()
  await admin.from('providers').update({ subscription_status: status }).eq('id', id).eq('role', 'provider')
  done()
}

/** Extends from the later of (now, current expiry) so early renewals never lose days. */
export async function extendExpiry(id: string, months: number) {
  const admin = await guard()
  const { data } = await admin.from('providers').select('expires_at').eq('id', id).eq('role', 'provider').single()
  if (!data) return
  const base = data.expires_at && new Date(data.expires_at) > new Date() ? new Date(data.expires_at) : new Date()
  base.setMonth(base.getMonth() + months)
  await admin.from('providers').update({ expires_at: base.toISOString() }).eq('id', id)
  done()
}

export async function setFee(id: string, fee: number) {
  const admin = await guard()
  if (!Number.isFinite(fee) || fee < 0) return
  await admin.from('providers').update({ monthly_fee_usd: fee }).eq('id', id).eq('role', 'provider')
  done()
}

export async function createProvider(fd: FormData): Promise<{ error?: string }> {
  const admin = await guard()
  const s = (k: string) => String(fd.get(k) ?? '').trim()
  const email = s('email'), password = s('password'), business_name = s('business_name'), owner_name = s('owner_name'), phone = s('phone')
  const fee = parseFloat(s('monthly_fee_usd')) || 0, months = parseInt(s('months')) || 1

  if (!email || password.length < 8 || !business_name || !owner_name || !phone) return { error: 'أكمل الحقول (كلمة المرور 8 أحرف على الأقل)' }

  const { data: created, error: authErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (authErr || !created.user) return { error: authErr?.message ?? 'تعذّر إنشاء الحساب' }

  const expires = new Date(); expires.setMonth(expires.getMonth() + months)
  const { error } = await admin.from('providers').insert({
    id: created.user.id, business_name, owner_name, phone, role: 'provider',
    monthly_fee_usd: fee, expires_at: expires.toISOString(),
  })
  if (error) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: 'تعذّر حفظ المزوّد' }
  }
  done()
  return {}
}
