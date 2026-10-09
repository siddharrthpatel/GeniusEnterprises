const assertEnv = (keys) => {
  const missing = []
  for (const k of keys) {
    const v = process.env[k]
    if (!v) {
      missing.push(k)
      continue
    }
    const s = String(v)
    if (
      k === 'JWT_SECRET' && s.length < 32 && process.env.NODE_ENV === 'production'
    ) {
      missing.push(k + ' (too short, >= 32 chars required)')
      continue
    }
    if (
      s.includes('CHANGE_ME') ||
      s.includes('change_me') ||
      s.startsWith('genius_super_secret_change') ||
      (k === 'COOKIE_SECRET' && s.startsWith('change_me_to'))
    ) {
      if (process.env.NODE_ENV === 'production') missing.push(k + ' (placeholder)')
    }
  }
  if (missing.length) {
    const msg = `[security] Missing or placeholder env vars: ${missing.join(', ')}. ` +
      `Set them in server/.env before starting in production.`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
    console.warn(msg)
  }
}

const validateEnv = () => {
  assertEnv(['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'])

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    const msg =
      '[security] JWT_SECRET is too short (< 32 chars). Generate a strong secret e.g. openssl rand -hex 32'
    if (process.env.NODE_ENV === 'production') throw new Error(msg)
    console.warn(msg)
  }
}

module.exports = { assertEnv, validateEnv, default: validateEnv }
