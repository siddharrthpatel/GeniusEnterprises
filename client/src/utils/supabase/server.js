/** (developed by @neelotpal.dey) **/
import { createServerClient } from '@supabase/ssr'

const supabaseUrl =
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_SUPABASE_URL)

const supabaseKey =
  (typeof process !== 'undefined' &&
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY)) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY))

export const createClient = (cookieStore) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return typeof cookieStore?.getAll === 'function'
          ? cookieStore.getAll()
          : []
      },
      setAll(cookiesToSet) {
        try {
          if (typeof cookieStore?.setAll === 'function') {
            cookieStore.setAll(cookiesToSet)
          } else if (Array.isArray(cookiesToSet)) {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof cookieStore?.set === 'function') {
                cookieStore.set(name, value, options)
              }
            })
          }
        } catch {
          // Supabase SSR setAll called from a Server context where cookies
          // can't be mutated directly. Safe to ignore when you have a
          // refresh middleware (Express) handling session refresh instead.
        }
      },
    },
  })
}

export default createClient
