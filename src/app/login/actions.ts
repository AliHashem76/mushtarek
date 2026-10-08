'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string } | undefined

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'بيانات الدخول غير صحيحة' }

  const { data: profile } = await supabase
    .from('providers')
    .select('role, subscription_status, expires_at')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return { error: 'الحساب غير مرتبط بأي مزوّد خدمة' }
  }

  const expired = profile.expires_at && new Date(profile.expires_at) < new Date()
  if (profile.role === 'provider' && (profile.subscription_status === 'suspended' || expired)) {
    await supabase.auth.signOut()
    return { error: 'اشتراكك موقوف أو منتهي. تواصل مع الدعم' }
  }

  redirect(profile.role === 'super_admin' ? '/super-admin' : '/dashboard')
}
