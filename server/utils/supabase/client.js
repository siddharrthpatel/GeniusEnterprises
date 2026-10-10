/** (developed by @neelotpal.dey) **/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const { createClient: createBrowserClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://drkxuilxrhjjcixeuftj.supabase.co';

const supabaseAnonKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe';

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey =
  rawServiceKey && !rawServiceKey.startsWith('CHANGE_ME') ? rawServiceKey : null;

const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

const createSsrClient = (req, res) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies || {}).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookie(name, value, {
            ...options,
            sameSite: options?.sameSite || 'lax',
            httpOnly: options?.httpOnly ?? true,
            secure:
              options?.secure ??
              (process.env.NODE_ENV === 'production' ? true : false),
          })
        })
      },
    },
  })
}

const supabase = createClient()

module.exports = {
  supabase,
  default: supabase,
  createClient,
  createSsrClient,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
}
