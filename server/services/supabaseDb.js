const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://drkxuilxrhjjcixeuftj.supabase.co';
const supabaseAnonKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe';

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey =
  rawServiceKey && !rawServiceKey.startsWith('CHANGE_ME') ? rawServiceKey : null;

// Primary server client
let client = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

let adminSession = null;
let adminSessionExpiresAt = 0;

async function getAdminClient() {
  if (supabaseServiceKey) return client;
  const now = Date.now();
  if (adminSession && now < adminSessionExpiresAt) {
    return client;
  }
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: 'admin@genius.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
    });
    if (!error && data?.session) {
      adminSession = data.session;
      adminSessionExpiresAt = now + (data.session.expires_in || 3600) * 1000 - 60000;
    }
  } catch (err) {
    console.warn('[supabaseDb] Admin session note:', err.message);
  }
  return client;
}

// In-memory cache for fast querying
const cache = {
  users: null,
  usersAt: 0,
  portfolios: {},
};
const CACHE_TTL_MS = 20000;

function clearCache() {
  cache.users = null;
  cache.usersAt = 0;
}

// Persistent deleted users tracking
const DELETED_USERS_FILE = path.join(__dirname, '../data/deleted_users.json');

function getDeletedSet() {
  try {
    if (fs.existsSync(DELETED_USERS_FILE)) {
      const arr = JSON.parse(fs.readFileSync(DELETED_USERS_FILE, 'utf8'));
      if (Array.isArray(arr)) {
        return new Set(arr.map((x) => String(x).toLowerCase().trim()));
      }
    }
  } catch (_) {}
  return new Set();
}

function markDeleted(id, email) {
  const set = getDeletedSet();
  if (id) set.add(String(id).toLowerCase().trim());
  if (email) set.add(String(email).toLowerCase().trim());
  try {
    const dir = path.dirname(DELETED_USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify([...set], null, 2), 'utf8');
  } catch (_) {}
}

function isDeleted(idOrEmail) {
  if (!idOrEmail) return false;
  const set = getDeletedSet();
  return set.has(String(idOrEmail).toLowerCase().trim());
}

// Persistent custom/created users storage
const CUSTOM_USERS_FILE = path.join(__dirname, '../data/custom_users.json');

function loadCustomUsers() {
  try {
    if (fs.existsSync(CUSTOM_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOM_USERS_FILE, 'utf8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (_) {}
  return [];
}

function saveCustomUsers(list) {
  try {
    const dir = path.dirname(CUSTOM_USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CUSTOM_USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (_) {}
}

// Allowed employee portal usernames
const USERNAME_MAP = {
  admin: 'admin@genius.com',
  bm: 'bm@genius.com',
  branch: 'bm@genius.com',
  rm: 'rm1@genius.com',
  rm1: 'rm1@genius.com',
  arm: 'arm@genius.com',
  advisor: 'advisor@genius.com',
  broker: 'broker@genius.com',
  sub_broker: 'broker@genius.com',
  employee: 'employee@genius.com',
};

async function resolveEmail(identifier) {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const lower = trimmed.toLowerCase();
  if (USERNAME_MAP[lower]) return USERNAME_MAP[lower];
  try {
    const sb = await getAdminClient();
    const { data: p } = await sb
      .from('profiles')
      .select('email')
      .ilike('username', trimmed)
      .maybeSingle();
    if (p?.email) return p.email.toLowerCase();
  } catch {}
  return `${lower}@genius.com`;
}

async function getUserById(id) {
  if (!id || isDeleted(id)) return null;
  try {
    const sb = await getAdminClient();
    const { data: p, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !p || isDeleted(p.id) || isDeleted(p.email)) {
      const customMatch = loadCustomUsers().find((u) => u.id === id);
      if (customMatch && !isDeleted(customMatch.id) && !isDeleted(customMatch.email)) {
        return customMatch;
      }
      return null;
    }

    let pan = p.pan || null;
    let dob = p.dob || null;
    let riskProfile = null;

    if (p.role === 'client') {
      const { data: c } = await sb
        .from('clients')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      if (c) {
        pan = c.pan || pan;
        dob = c.dob || dob;
        riskProfile = c.risk_profile;
      }
    }

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      username: p.username || (p.email ? p.email.split('@')[0] : ''),
      role: p.role,
      phone: p.phone,
      status: p.status || 'active',
      reportsTo: p.reports_to,
      rmId: p.rm_id,
      armId: p.arm_id,
      advisorId: p.advisor_id,
      branchId: p.branch_id,
      pan,
      dob,
      riskProfile,
      createdAt: p.created_at,
    };
  } catch (err) {
    const customMatch = loadCustomUsers().find((u) => u.id === id);
    if (customMatch && !isDeleted(customMatch.id) && !isDeleted(customMatch.email)) {
      return customMatch;
    }
    return null;
  }
}

async function getUserByEmail(email) {
  if (!email || isDeleted(email)) return null;
  try {
    const sb = await getAdminClient();
    const { data: p, error } = await sb
      .from('profiles')
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();
    if (error || !p || isDeleted(p.id) || isDeleted(p.email)) {
      const customMatch = loadCustomUsers().find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (customMatch && !isDeleted(customMatch.id) && !isDeleted(customMatch.email)) {
        return customMatch;
      }
      return null;
    }
    return getUserById(p.id);
  } catch (err) {
    const customMatch = loadCustomUsers().find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (customMatch && !isDeleted(customMatch.id) && !isDeleted(customMatch.email)) {
      return customMatch;
    }
    return null;
  }
}

async function getUserByUsername(username) {
  if (!username || isDeleted(username)) return null;
  try {
    const sb = await getAdminClient();
    const { data: p, error } = await sb
      .from('profiles')
      .select('*')
      .ilike('username', username.trim())
      .maybeSingle();
    if (error || !p || isDeleted(p.id) || isDeleted(p.email)) return null;
    return getUserById(p.id);
  } catch (err) {
    console.error('[supabaseDb.getUserByUsername]', err.message);
    return null;
  }
}

async function authenticateWithSupabase(identifier, password, requestedRole) {
  if (isDeleted(identifier)) return { user: null, error: 'User does not exist or has been removed' };
  const email = await resolveEmail(identifier);
  if (!email || isDeleted(email)) return { user: null, error: 'User does not exist or has been removed' };

  // Create temporary client for this login attempt
  const tempClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    return { user: null, error: 'Invalid email or password' };
  }

  const user = await getUserById(authData.user.id);
  if (!user) {
    return {
      user: {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || email.split('@')[0],
        email,
        role: requestedRole || 'client',
        status: 'active',
      },
      error: null,
    };
  }

  if (user.status !== 'active' && user.role !== 'admin') {
    return { user: null, error: 'Account is not active' };
  }

  return { user, error: null };
}

async function getUsers(filter = {}) {
  try {
    const now = Date.now();
    let all = null;
    if (cache.users && now - cache.usersAt < CACHE_TTL_MS) {
      all = cache.users;
    } else {
      const sb = await getAdminClient();
      const { data: profiles, error } = await sb
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      const deletedSet = getDeletedSet();
      all = (profiles || [])
        .filter((p) => !deletedSet.has(String(p.id).toLowerCase()) && !deletedSet.has(String(p.email || '').toLowerCase()) && !deletedSet.has(String(p.username || '').toLowerCase()))
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          username: p.username || (p.email ? p.email.split('@')[0] : ''),
          role: p.role,
          phone: p.phone,
          status: p.status || 'active',
          reportsTo: p.reports_to,
          rmId: p.rm_id,
          armId: p.arm_id,
          advisorId: p.advisor_id,
          branchId: p.branch_id,
          createdAt: p.created_at,
        }));
      const customList = loadCustomUsers().filter(
        (u) => !deletedSet.has(String(u.id).toLowerCase()) && !deletedSet.has(String(u.email || '').toLowerCase())
      );
      for (const c of customList) {
        if (!all.some((u) => u.id === c.id || u.email?.toLowerCase() === c.email?.toLowerCase())) {
          all.push(c);
        }
      }
      cache.users = all;
      cache.usersAt = now;
    }

    let result = [...all];
    if (filter.role) {
      result = result.filter((u) => u.role === filter.role);
    }
    if (filter.q) {
      const q = String(filter.q).toLowerCase().trim();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)),
      );
    }
    return result;
  } catch (err) {
    console.error('[supabaseDb.getUsers]', err.message);
    return [];
  }
}

async function addUser(userData) {
  try {
    clearCache();
    const id = userData.id || ('u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
    const newRecord = {
      id,
      name: userData.name,
      email: userData.email,
      username: userData.username || (userData.email ? userData.email.split('@')[0] : id),
      role: userData.role || 'client',
      phone: userData.phone || null,
      status: userData.status || 'active',
      reportsTo: userData.reportsTo || null,
      rmId: userData.rmId || null,
      armId: userData.armId || null,
      advisorId: userData.advisorId || null,
      branchId: userData.branchId || null,
      pan: userData.pan || null,
      dob: userData.dob || null,
      createdAt: new Date().toISOString(),
    };
    const currentCustom = loadCustomUsers().filter((u) => u.id !== id && u.email?.toLowerCase() !== userData.email?.toLowerCase());
    currentCustom.push(newRecord);
    saveCustomUsers(currentCustom);

    try {
      const sb = await getAdminClient();
      const profileRow = {
        id,
        name: userData.name,
        email: userData.email,
        username: newRecord.username,
        role: userData.role || 'client',
        phone: userData.phone || null,
        status: userData.status || 'active',
        reports_to: userData.reportsTo || null,
        rm_id: userData.rmId || null,
        arm_id: userData.armId || null,
        advisor_id: userData.advisorId || null,
        branch_id: userData.branchId || null,
      };
      await sb.from('profiles').upsert(profileRow);
      if (userData.role === 'client') {
        await sb.from('clients').upsert({
          user_id: id,
          pan: userData.pan || null,
          dob: userData.dob || null,
        });
      }
    } catch (_) {}

    return newRecord;
  } catch (err) {
    console.error('[supabaseDb.addUser]', err.message);
    throw err;
  }
}

async function createSupabaseAuthUser(userData) {
  try {
    const temp = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await temp.auth.signUp({
      email: userData.email,
      password: userData.rawPassword || 'Client@123',
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'client',
        },
      },
    });
    if (!error && data?.user?.id) return data.user.id;
  } catch {}
  return 'u_' + Date.now().toString(36);
}

async function updateUser(id, patch) {
  try {
    clearCache();
    const sb = await getAdminClient();
    const profilePatch = {};
    if (patch.name !== undefined) profilePatch.name = patch.name;
    if (patch.email !== undefined) profilePatch.email = patch.email;
    if (patch.phone !== undefined) profilePatch.phone = patch.phone;
    if (patch.role !== undefined) profilePatch.role = patch.role;
    if (patch.status !== undefined) profilePatch.status = patch.status;
    if (patch.reportsTo !== undefined) profilePatch.reports_to = patch.reportsTo;
    if (patch.rmId !== undefined) profilePatch.rm_id = patch.rmId;
    if (patch.armId !== undefined) profilePatch.arm_id = patch.armId;
    if (patch.advisorId !== undefined) profilePatch.advisor_id = patch.advisorId;
    if (patch.branchId !== undefined) profilePatch.branch_id = patch.branchId;

    if (Object.keys(profilePatch).length > 0) {
      profilePatch.updated_at = new Date().toISOString();
      await sb.from('profiles').update(profilePatch).eq('id', id);
    }

    if (patch.pan !== undefined || patch.dob !== undefined) {
      const clientPatch = {};
      if (patch.pan !== undefined) clientPatch.pan = patch.pan;
      if (patch.dob !== undefined) clientPatch.dob = patch.dob;
      await sb.from('clients').update(clientPatch).eq('user_id', id);
    }

    return getUserById(id);
  } catch (err) {
    console.error('[supabaseDb.updateUser]', err.message);
    throw err;
  }
}

async function deleteUser(id) {
  try {
    clearCache();
    const existing = await getUserById(id);
    markDeleted(id, existing?.email);
    if (existing?.username) markDeleted(existing.username);
    const updatedCustom = loadCustomUsers().filter((u) => u.id !== id && u.email?.toLowerCase() !== existing?.email?.toLowerCase());
    saveCustomUsers(updatedCustom);
    const sb = await getAdminClient();
    try {
      await sb.from('clients').delete().eq('user_id', id);
    } catch (_) {}
    try {
      await sb.from('profiles').delete().eq('id', id);
    } catch (_) {}
    delete cache.portfolios[id];
    return true;
  } catch (err) {
    console.error('[supabaseDb.deleteUser]', err.message);
    throw err;
  }
}

async function canAccessUser(viewer, targetId) {
  if (!viewer || !targetId) return false;
  if (viewer.role === 'admin' || viewer.role === 'master_admin') return true;
  if (viewer.id === targetId) return true;

  const target = await getUserById(targetId);
  if (!target) return false;
  if (target.rmId === viewer.id || target.advisorId === viewer.id || target.armId === viewer.id) return true;

  let current = target;
  let depth = 0;
  while (current && current.reportsTo && depth < 6) {
    if (current.reportsTo === viewer.id) return true;
    current = await getUserById(current.reportsTo);
    depth++;
  }
  return false;
}

async function getPortfolio(userId) {
  if (!userId) return null;
  try {
    if (cache.portfolios[userId]) {
      return JSON.parse(JSON.stringify(cache.portfolios[userId]));
    }

    const sb = await getAdminClient();
    const { data: clientRecord } = await sb
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let totalInvested = 0;
    let totalValue = 0;
    const holdings = [];
    const transactions = [];

    if (clientRecord?.id) {
      const { data: accounts } = await sb
        .from('accounts')
        .select('*')
        .eq('client_id', clientRecord.id);

      if (Array.isArray(accounts) && accounts.length > 0) {
        for (const acc of accounts) {
          const bal = Number(acc.balance || 0);
          totalValue += bal;
          totalInvested += bal * 0.88;
          holdings.push({
            symbol: acc.type || 'PORTFOLIO',
            name: `${acc.type || 'Account'} (${acc.number || ''})`,
            units: 1,
            avgPrice: bal * 0.88,
            currentPrice: bal,
            totalValue: bal,
            unrealizedGain: bal * 0.12,
            returnPct: 12.0,
          });
        }
      }

      const { data: txs } = await sb
        .from('transactions')
        .select('*')
        .eq('client_id', clientRecord.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (Array.isArray(txs)) {
        for (const t of txs) {
          transactions.push({
            id: t.id,
            date: t.created_at || t.transaction_date,
            type: t.type || 'INVESTMENT',
            symbol: t.asset_name || 'FUND',
            amount: Number(t.amount || 0),
            status: t.status || 'COMPLETED',
          });
        }
      }
    }

    const returnsPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
    const portfolio = {
      totalValue: Math.round(totalValue),
      totalInvested: Math.round(totalInvested),
      returnsPct: +returnsPct.toFixed(2),
      holdings,
      transactions,
    };
    cache.portfolios[userId] = portfolio;
    return portfolio;
  } catch (err) {
    console.error('[supabaseDb.getPortfolio]', err.message);
    return {
      totalValue: 0,
      totalInvested: 0,
      returnsPct: 0,
      holdings: [],
      transactions: [],
    };
  }
}

async function setPortfolio(userId, portfolio) {
  if (!userId) return null;
  cache.portfolios[userId] = portfolio;
  return portfolio;
}

async function getPortfolios() {
  const users = await getUsers({ role: 'client' });
  const result = {};
  for (const u of users) {
    result[u.id] = await getPortfolio(u.id);
  }
  return result;
}

async function getUserByIdentifier(ident) {
  if (!ident) return null;
  const s = String(ident).trim();
  if (s.includes('@')) {
    return await getUserByEmail(s);
  }
  return (await getUserByUsername(s)) || (await getUserById(s)) || (await getUserByEmail(s));
}

module.exports = {
  getAdminClient,
  resolveEmail,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  getUserByIdentifier,
  authenticateWithSupabase,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  canAccessUser,
  getPortfolio,
  setPortfolio,
  getPortfolios,
  clearCache,
};
