/** (developed by @neelotpal.dey) **/
const { createSsrClient } = require('./client')

const refreshSupabaseSession = async (req, res, next) => {
  try {
    const supabase = createSsrClient(req, res)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let refreshedSession = session

    if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
      const { data } = await supabase.auth.refreshSession()
      refreshedSession = data.session
    }

    req.supabase = supabase
    req.supabaseSession = refreshedSession
    req.supabaseUser = refreshedSession?.user || null
  } catch (err) {
    // Session refresh errors are non-fatal; route handlers can inspect
    // req.supabaseUser / req.supabaseSession and redirect to /login when
    // the user isn't authenticated for a protected route.
    req.supabase = null
    req.supabaseSession = null
    req.supabaseUser = null
  }

  next()
}

module.exports = {
  refreshSupabaseSession,
  default: refreshSupabaseSession,
}
