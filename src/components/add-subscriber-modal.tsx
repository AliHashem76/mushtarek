'use client'

import { useState } from 'react'
import { Modal, SubmitButton, Field, ErrorBox } from './ui'
import { inputCls } from '@/lib/styles'
import { addSubscriber } from '@/app/dashboard/actions'

function ServiceCard({ emoji, title, name, checked, onChange, children }: {
  emoji: string; title: string; name: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border p-4 transition ${checked ? 'border-brand-cyan/50 bg-cyan-500/5 shadow-glow-sm' : 'border-cyan-500/15 bg-navy/40'}`}>
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold text-white"><span className="text-lg">{emoji}</span>{title}</span>
        <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-brand-gradient peer-focus-visible:ring-2 peer-focus-visible:ring-brand-cyan after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
      </label>
      {checked && <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>}
    </div>
  )
}


export default function AddSubscriberModal({ onClose }: { onClose: () => void }) {
  const [gen, setGen] = useState(false)
  const [gtype, setGtype] = useState<'meter' | 'flat'>('meter')
  const [net, setNet] = useState(false)
  const [sat, setSat] = useState(false)
  const [error, setError] = useState('')

  return (
    <Modal title="إضافة مشترك جديد" onClose={onClose} wide>
      <form
        action={async (fd) => {
          const r = await addSubscriber(fd)
          if (r.error) setError(r.error); else onClose()
        }}
        className="space-y-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="الاسم الكامل"><input name="full_name" required className={inputCls} /></Field>
          <Field label="رقم الهاتف (واتساب)"><input name="phone" required dir="ltr" placeholder="03 123 456" className={inputCls} /></Field>
          <Field label="المنطقة"><input name="address_zone" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المبنى"><input name="address_building" className={inputCls} /></Field>
            <Field label="الطابق"><input name="address_floor" className={inputCls} /></Field>
          </div>
        </div>

        <div className="space-y-3">
          <ServiceCard emoji="⚡" title="مولد كهرباء" name="has_generator" checked={gen} onChange={setGen}>
            <div className="flex gap-2 sm:col-span-2">
              {(['meter', 'flat'] as const).map((t) => (
                <button type="button" key={t} onClick={() => setGtype(t)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${gtype === t ? 'border-brand-cyan bg-brand-gradient font-bold text-navy' : 'border-cyan-500/20 text-slate-300'}`}>
                  {t === 'meter' ? 'عدّاد' : 'اشتراك ثابت'}
                </button>
              ))}
              <input type="hidden" name="generator_type" value={gtype} />
            </div>
            {gtype === 'meter' ? (
              <>
                <Field label="رقم العدّاد"><input name="meter_number" dir="ltr" className={inputCls} /></Field>
                <Field label="القراءة الحالية"><input name="last_meter_reading" type="number" step="any" min="0" defaultValue={0} dir="ltr" className={inputCls} /></Field>
              </>
            ) : (
              <Field label="السعر الشهري ($)"><input name="generator_flat_price" type="number" step="any" min="0" dir="ltr" className={inputCls} /></Field>
            )}
          </ServiceCard>

          <ServiceCard emoji="🌐" title="إنترنت" name="has_internet" checked={net} onChange={setNet}>
            <Field label="اسم الباقة"><input name="internet_plan_name" className={inputCls} /></Field>
            <Field label="السعر الشهري ($)"><input name="internet_price" type="number" step="any" min="0" dir="ltr" className={inputCls} /></Field>
          </ServiceCard>

          <ServiceCard emoji="📡" title="دش / ستالايت" name="has_satellite" checked={sat} onChange={setSat}>
            <Field label="السعر الشهري ($)"><input name="satellite_price" type="number" step="any" min="0" dir="ltr" className={inputCls} /></Field>
          </ServiceCard>
        </div>

        <ErrorBox msg={error} />
        <SubmitButton>حفظ المشترك</SubmitButton>
      </form>
    </Modal>
  )
}
