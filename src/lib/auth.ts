import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const requireRole = cache(async (role: 'provider' | 'super_admin') => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('providers').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== role) redirect('/login')
  return { supabase, user, profile }
})
