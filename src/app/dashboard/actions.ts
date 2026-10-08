'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { calcInvoice, currentBillingMonth } from '@/lib/billing'
import type { Invoice, Settings, Subscriber } from '@/lib/types'

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const num = (fd: FormData, k: string) => { const v = parseFloat(str(fd, k)); return Number.isFinite(v) ? v : 0 }
const on = (fd: FormData, k: string) => fd.get(k) === 'on'

export async function addSubscriber(fd: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireRole('provider')

  const full_name = str(fd, 'full_name'), phone = str(fd, 'phone')
  if (!full_name || !phone) return { error: 'الاسم ورقم الهاتف مطلوبان' }

  const has_generator = on(fd, 'has_generator'), has_internet = on(fd, 'has_internet'), has_satellite = on(fd, 'has_satellite')
  if (!has_generator && !has_internet && !has_satellite) return { error: 'اختر خدمة واحدة على الأقل' }

  const generator_type = has_generator ? (str(fd, 'generator_type') === 'flat' ? 'flat' : 'meter') : null
  if (generator_type === 'flat' && num(fd, 'generator_flat_price') <= 0) return { error: 'أدخل سعر المولد الثابت' }
  if (has_internet && num(fd, 'internet_price') <= 0) return { error: 'أدخل سعر الإنترنت' }
  if (has_satellite && num(fd, 'satellite_price') <= 0) return { error: 'أدخل سعر الدش' }

  const { error } = await supabase.from('subscribers').insert({
    provider_id: user.id, full_name, phone,
    address_zone: str(fd, 'address_zone') || null,
    address_building: str(fd, 'address_building') || null,
    address_floor: str(fd, 'address_floor') || null,
    has_generator, generator_type,
    meter_number: generator_type === 'meter' ? str(fd, 'meter_number') || null : null,
    last_meter_reading: generator_type === 'meter' ? num(fd, 'last_meter_reading') : 0,
    generator_flat_price: generator_type === 'flat' ? num(fd, 'generator_flat_price') : null,
    has_internet, internet_plan_name: has_internet ? str(fd, 'internet_plan_name') || null : null,
    internet_price: has_internet ? num(fd, 'internet_price') : null,
    has_satellite, satellite_price: has_satellite ? num(fd, 'satellite_price') : null,
  })
  if (error) return { error: 'تعذّر حفظ المشترك، حاول مجدداً' }

  revalidatePath('/dashboard')
  return {}
}

/**
 * One-click renewal. Invoice totals are cumulative: previous_debt = total of the latest
 * unpaid earlier invoice (which already contains older debt), so nothing is counted twice.
 */
export async function renewSubscriber(subscriberId: string, currReading?: number): Promise<{ error: string } | { invoice: Invoice }> {
  const { supabase, user } = await requireRole('provider')
  const month = currentBillingMonth()

  const [{ data: sub }, { data: st }, { data: unpaid }] = await Promise.all([
    supabase.from('subscribers').select('*').eq('id', subscriberId).single(),
    supabase.from('provider_settings').select('*').eq('provider_id', user.id).single(),
    supabase.from('invoices').select('total_amount_usd').eq('subscriber_id', subscriberId)
      .eq('status', 'unpaid').lt('billing_month', month).order('billing_month', { ascending: false }).limit(1),
  ])
  if (!sub || !st) return { error: 'تعذّر تحميل بيانات المشترك' }

  const debt = Number(unpaid?.[0]?.total_amount_usd ?? 0)
  const calc = calcInvoice(sub as Subscriber, st as Settings, debt, currReading)
  if (!calc.ok) return { error: calc.reason }

  const { data: invoice, error } = await supabase.from('invoices').insert({
    provider_id: user.id, subscriber_id: subscriberId, billing_month: month,
    prev_reading: calc.prev, curr_reading: calc.curr, kwh_consumed: calc.kwh,
    generator_amount: calc.generator, internet_amount: calc.internet, satellite_amount: calc.satellite,
    previous_debt: calc.debt, total_amount_usd: calc.usd, total_amount_lbp: calc.lbp,
  }).select().single()

  if (error) return { error: error.code === '23505' ? 'تم إصدار فاتورة هذا الشهر مسبقاً' : 'تعذّر إنشاء الفاتورة' }

  if (calc.curr != null) await supabase.from('subscribers').update({ last_meter_reading: calc.curr }).eq('id', subscriberId)

  revalidatePath('/dashboard')
  return { invoice: invoice as Invoice }
}

/** Paying a cumulative invoice settles it and every earlier unpaid invoice of the same subscriber. */
export async function markPaid(invoiceId: string) {
  const { supabase } = await requireRole('provider')
  const { data: inv } = await supabase.from('invoices').select('subscriber_id, billing_month').eq('id', invoiceId).single()
  if (!inv) return
  await supabase.from('invoices').update({ status: 'paid' })
    .eq('subscriber_id', inv.subscriber_id).eq('status', 'unpaid').lte('billing_month', inv.billing_month)
  revalidatePath('/dashboard')
}

export async function updateSettings(fd: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireRole('provider')
  const usd_rate = num(fd, 'usd_rate'), kwh_price_usd = num(fd, 'kwh_price_usd'), base_generator_fee = num(fd, 'base_generator_fee')
  if (usd_rate <= 0 || kwh_price_usd < 0 || base_generator_fee < 0) return { error: 'قيم غير صالحة' }
  const { error } = await supabase.from('provider_settings')
    .upsert({ provider_id: user.id, usd_rate, kwh_price_usd, base_generator_fee })
  if (error) return { error: 'تعذّر حفظ الإعدادات' }
  revalidatePath('/dashboard', 'layout')
  return {}
}
