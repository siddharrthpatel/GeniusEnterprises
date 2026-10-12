/** (developed by @neelotpal.dey) **/
import { createBrowserInvestor } from '@supabase/ssr'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const createInvestor = () =>
  createBrowserInvestor(supabaseUrl, supabaseKey)

export const supabase = createInvestor()

export default supabase
