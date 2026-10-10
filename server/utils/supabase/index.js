/** (developed by @neelotpal.dey) **/
const supabase = require('./client')
const { refreshSupabaseSession } = require('./middleware')

module.exports = {
  ...supabase,
  refreshSupabaseSession,
}
