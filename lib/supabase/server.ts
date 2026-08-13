import { createClient as createClientServer } from '@supabase/supabase-js'

export function createClient() {
  return createClientServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}
