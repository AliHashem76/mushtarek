import type { Invoice, Settings, Subscriber } from './types'

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const fmtUsd = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtLbp = (n: number) => `${Math.round(Number(n)).toLocaleString('en-US')} ل.ل`
export const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { timeZone: 'Asia/Beirut' })

/** First day of the current month in Beirut time, e.g. "2026-10-01" */
export function currentBillingMonth(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit' }).formatToParts(d)
  return `${p.find((x) => x.type === 'year')!.value}-${p.find((x) => x.type === 'month')!.value}-01`
}

export type Calc =
  | { ok: false; reason: string }
  | {
      ok: true; prev: number | null; curr: number | null; kwh: number | null
      generator: number; internet: number; satellite: number; debt: number; usd: number; lbp: number
    }

/** Single source of truth: used for the live preview (client) and the stored invoice (server). */
export function calcInvoice(s: Subscriber, st: Settings, debt: number, curr?: number): Calc {
  if (!s.has_generator && !s.has_internet && !s.has_satellite) return { ok: false, reason: 'لا توجد خدمات مفعّلة لهذا المشترك' }

  let generator = 0, prev: number | null = null, currR: number | null = null, kwh: number | null = null
  if (s.has_generator) {
    if (s.generator_type === 'meter') {
      prev = Number(s.last_meter_reading)
      if (curr == null || !Number.isFinite(curr)) return { ok: false, reason: 'أدخل القراءة الحالية للعدّاد' }
      if (curr < prev) return { ok: false, reason: 'القراءة الحالية أقل من السابقة' }
      currR = curr
      kwh = r2(curr - prev)
      generator = r2(kwh * Number(st.kwh_price_usd) + Number(st.base_generator_fee))
    } else {
      generator = r2(Number(s.generator_flat_price ?? 0))
    }
  }
  const internet = s.has_internet ? r2(Number(s.internet_price ?? 0)) : 0
  const satellite = s.has_satellite ? r2(Number(s.satellite_price ?? 0)) : 0
  const usd = r2(generator + internet + satellite + debt)
  return { ok: true, prev, curr: currR, kwh, generator, internet, satellite, debt, usd, lbp: Math.round(usd * Number(st.usd_rate)) }
}

/** Lebanese numbers: 03123456 / 71123456 / +961... / 00961... -> 961xxxxxxxx */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  return d.startsWith('961') ? d : '961' + d.replace(/^0+/, '')
}

export function buildWhatsAppUrl(inv: Invoice, s: Subscriber, providerName: string) {
  const month = new Date(`${inv.billing_month}T00:00:00Z`).toLocaleDateString('ar-LB-u-nu-latn', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const rate = inv.total_amount_usd > 0 ? Math.round(inv.total_amount_lbp / inv.total_amount_usd) : 0
  const L: string[] = [`🧾 *فاتورة اشتراك - ${providerName}*`, '', `👤 المشترك: *${s.full_name}*`, `📅 الشهر: ${month}`, '']

  if (Number(inv.generator_amount) > 0 || (s.has_generator && inv.curr_reading != null)) {
    L.push(`⚡ *المولد:* ${fmtUsd(inv.generator_amount)}`)
    if (inv.curr_reading != null)
      L.push(`   القراءة: ${inv.prev_reading} ← ${inv.curr_reading} (${inv.kwh_consumed} ك.و.س)`)
  }
  if (Number(inv.internet_amount) > 0) L.push(`🌐 *الإنترنت${s.internet_plan_name ? ` (${s.internet_plan_name})` : ''}:* ${fmtUsd(inv.internet_amount)}`)
  if (Number(inv.satellite_amount) > 0) L.push(`📡 *الدش:* ${fmtUsd(inv.satellite_amount)}`)
  if (Number(inv.previous_debt) > 0) L.push(`⚠️ *رصيد سابق غير مدفوع:* ${fmtUsd(inv.previous_debt)}`)

  L.push('', '━━━━━━━━━━━━', `💵 *الإجمالي: ${fmtUsd(inv.total_amount_usd)}*`, `🇱🇧 *بالليرة: ${fmtLbp(inv.total_amount_lbp)}*`)
  if (rate) L.push(`(سعر الصرف: ${rate.toLocaleString('en-US')} ل.ل)`)
  L.push('', 'شكراً لتعاملكم معنا 🙏')

  return `https://wa.me/${normalizePhone(s.phone)}?text=${encodeURIComponent(L.join('\n'))}`
}
