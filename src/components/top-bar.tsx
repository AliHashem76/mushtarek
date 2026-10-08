'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Banknote, Zap, Settings2 } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { Modal, SubmitButton, Field, ErrorBox } from './ui'
import SignOutButton from './signout-button'
import { inputCls } from '@/lib/styles'
import { updateSettings } from '@/app/dashboard/actions'

const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-brand-cyan transition hover:border-cyan-400/60 hover:shadow-glow-sm'

export default function TopBar({ businessName, ownerName, settings }: { businessName: string; ownerName: string; settings: Settings }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cyan-500/15 bg-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo-mark.png" alt="مشترك" width={40} height={32} className="h-8 w-auto drop-shadow-[0_0_12px_rgba(0,242,254,0.5)]" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">{businessName}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-cyan opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand-cyan" />
                </span>
                {ownerName} - اشتراك فعّال
              </p>
            </div>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            <button onClick={() => setOpen(true)} className={pill} title="تعديل الأسعار">
              <Banknote className="size-3.5" />
              <span dir="ltr">1$ = {Number(settings.usd_rate).toLocaleString('en-US')} LBP</span>
            </button>
            <button onClick={() => setOpen(true)} className={pill} title="تعديل الأسعار">
              <Zap className="size-3.5" />
              <span dir="ltr">kWh = ${Number(settings.kwh_price_usd)}</span>
              <Settings2 className="size-3 opacity-60" />
            </button>
            <SignOutButton />
          </div>
        </div>
      </header>

      {open && (
        <Modal title="الأسعار وسعر الصرف" onClose={() => setOpen(false)}>
          <form
            action={async (fd) => {
              const r = await updateSettings(fd)
              if (r.error) setError(r.error); else setOpen(false)
            }}
            className="space-y-4"
          >
            <Field label="سعر صرف الدولار (ل.ل)">
              <input name="usd_rate" type="number" step="any" min="1" required defaultValue={settings.usd_rate} dir="ltr" className={inputCls} />
            </Field>
            <Field label="سعر الكيلوواط ساعة ($)">
              <input name="kwh_price_usd" type="number" step="any" min="0" required defaultValue={settings.kwh_price_usd} dir="ltr" className={inputCls} />
            </Field>
            <Field label="رسم المولد الأساسي ($) - للعدّاد فقط">
              <input name="base_generator_fee" type="number" step="any" min="0" required defaultValue={settings.base_generator_fee} dir="ltr" className={inputCls} />
            </Field>
            <p className="text-xs text-slate-500">التغيير يُطبَّق على الفواتير الجديدة فقط.</p>
            <ErrorBox msg={error} />
            <SubmitButton>حفظ التغييرات</SubmitButton>
          </form>
        </Modal>
      )}
    </>
  )
}
