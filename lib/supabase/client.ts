import { createClient as createClientBrowser } from '@supabase/supabase-js'

export function createClient() {
  return createClientBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
