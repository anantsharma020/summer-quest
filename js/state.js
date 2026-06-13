// ============================================================================
// App state: owns the active profile, its history (quests + logs), and the
// currently-pending generated quest. Persists everything to IndexedDB and
// notifies subscribers (the UI) on change.
// ============================================================================

import * as db from './db.js';
import { dayKey } from './engine.js';

const state = {
  profiles: [],
  activeId: null,
  quests: [],
  logs: [],
  ready: false,
};

const subs = new Set();
export const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
const emit = () => subs.forEach(cb => cb());

export const get = () => state;
export const activeProfile = () => state.profiles.find(p => p.id === state.activeId) || null;

export async function init() {
  state.profiles = await db.getAll('profiles');
  state.activeId = await db.getMeta('activeProfileId', null);
  if (state.activeId && !state.profiles.find(p => p.id === state.activeId)) state.activeId = null;
  if (!state.activeId && state.profiles.length) state.activeId = state.profiles[0].id;
  await loadHistory();
  state.ready = true;
  emit();
}

async function loadHistory() {
  if (!state.activeId) { state.quests = []; state.logs = []; return; }
  state.quests = await db.getAllByProfile('quests', state.activeId);
  state.logs = await db.getAllByProfile('logs', state.activeId);
}

// ---- profiles --------------------------------------------------------------
const AVATAR_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#cc5de8', '#ff922b', '#20c997', '#f06595'];

export async function createProfile(data) {
  const profile = {
    id: db.uid(),
    name: data.name || 'Quester',
    avatarColor: data.avatarColor || AVATAR_COLORS[state.profiles.length % AVATAR_COLORS.length],
    goal: data.goal || 'general',
    equipment: data.equipment || ['wall', 'chair'],
    location: data.location || 'home',
    level: data.level || 2,
    createdAt: new Date().toISOString(),
  };
  await db.put('profiles', profile);
  state.profiles.push(profile);
  await setActive(profile.id);
  return profile;
}

export async function updateProfile(patch) {
  const p = activeProfile();
  if (!p) return;
  Object.assign(p, patch);
  await db.put('profiles', p);
  emit();
}

export async function deleteProfile(id) {
  await db.del('profiles', id);
  const qs = await db.getAllByProfile('quests', id);
  const ls = await db.getAllByProfile('logs', id);
  await Promise.all([...qs.map(q => db.del('quests', q.id)), ...ls.map(l => db.del('logs', l.id))]);
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.activeId === id) state.activeId = state.profiles[0]?.id || null;
  await db.setMeta('activeProfileId', state.activeId);
  await loadHistory();
  emit();
}

export async function setActive(id) {
  state.activeId = id;
  await db.setMeta('activeProfileId', id);
  await loadHistory();
  emit();
}

// ---- quests ----------------------------------------------------------------
export function pendingQuest() {
  return state.quests.find(q => q.status === 'pending') || null;
}

export async function savePendingQuest(quest) {
  // Replace any existing pending quest.
  const existing = pendingQuest();
  if (existing) { await db.del('quests', existing.id); state.quests = state.quests.filter(q => q.id !== existing.id); }
  const record = {
    id: db.uid(),
    profileId: state.activeId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    date: dayKey(),
    ...quest,
  };
  await db.put('quests', record);
  state.quests.push(record);
  emit();
  return record;
}

export async function completeQuest(id) {
  const q = state.quests.find(x => x.id === id);
  if (!q) return;
  q.status = 'completed';
  q.completedAt = new Date().toISOString();
  await db.put('quests', q);
  emit();
}

export async function discardPendingQuest() {
  const q = pendingQuest();
  if (!q) return;
  await db.del('quests', q.id);
  state.quests = state.quests.filter(x => x.id !== q.id);
  emit();
}

// ---- logs ------------------------------------------------------------------
export async function addLog(log) {
  const record = {
    id: db.uid(),
    profileId: state.activeId,
    createdAt: new Date().toISOString(),
    date: dayKey(),
    ...log,
  };
  await db.put('logs', record);
  state.logs.push(record);
  emit();
  return record;
}

export async function deleteLog(id) {
  await db.del('logs', id);
  state.logs = state.logs.filter(l => l.id !== id);
  emit();
}
