import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// These two values are public by design: the anon key only lets a browser
// do what the database access rules allow. The AI model key is NOT here;
// it lives in the Edge Function's secrets.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

// When the values are missing, App shows a notice and renders no screen,
// so no screen ever uses this placeholder.
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as unknown as SupabaseClient)

// supabase-js returns errors instead of throwing them. This turns a
// result into its data, or throws, so screens handle errors in one place.
export function unwrap<T>(result: {
  data: T | null
  error: { message: string } | null
}): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}
