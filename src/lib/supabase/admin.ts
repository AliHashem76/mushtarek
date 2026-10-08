import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Bypasses RLS. Use ONLY in server actions / route handlers after verifying the caller's role.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
