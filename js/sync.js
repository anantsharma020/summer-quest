// ============================================================================
// Cloud sync via Supabase (optional, config-gated).
//
// When SUPABASE_URL / SUPABASE_ANON_KEY are set in config.js, this enables
// email/password accounts and syncs the user's whole app-state blob to a
// per-user row in the `user_data` table (protected by row-level security).
// When unset, every function is a safe no-op and the app stays local-only.
//
// supabase-js is only loaded (from a CDN) when sync is actually configured, so
// guests have no extra dependency and the app still works offline.
// ============================================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let _client = null;

export const syncConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

async function client() {
  if (!syncConfigured()) return null;
  if (_client) return _client;
  const mod = await import('https://esm.sh/@supabase/supabase-js@2');
  _client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

export async function currentUser() {
  const c = await client(); if (!c) return null;
  const { data } = await c.auth.getUser();
  return data && data.user ? data.user : null;
}

export async function signUp(email, password) {
  const c = await client(); if (!c) throw new Error('Cloud accounts are not set up yet.');
  const { data, error } = await c.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signIn(email, password) {
  const c = await client(); if (!c) throw new Error('Cloud accounts are not set up yet.');
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const c = await client(); if (c) await c.auth.signOut();
}

// Fetch this user's stored blob (or null if they have no row yet).
export async function pullData() {
  const c = await client(); if (!c) return null;
  const u = await currentUser(); if (!u) return null;
  const { data, error } = await c.from('user_data').select('data').eq('user_id', u.id).maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

// Upsert this user's blob.
export async function pushData(blob) {
  const c = await client(); if (!c) return;
  const u = await currentUser(); if (!u) return;
  const { error } = await c.from('user_data')
    .upsert({ user_id: u.id, data: blob, updated_at: new Date().toISOString() });
  if (error) throw error;
}
