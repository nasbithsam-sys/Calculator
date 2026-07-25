import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use mock values if env vars are missing to prevent crashes during development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
