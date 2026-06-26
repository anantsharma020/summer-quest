// ============================================================================
// App state: owns the active profile, its history (quests + logs), and the
// currently-pending generated quest. Persists everything to IndexedDB and
// notifies subscribers (the UI) on change.
// ============================================================================

import * as db from './db.js';
import * as sync from './sync.js';
import { dayKey } from './engine.js';

const state = {
  profiles: [],
  activeId: null,
  quests: [],
  logs: [],
  customExercises: [],
  programs: [],
  theme: 'light',
  user: null,
  syncing: false,
  ready: false,
};

const subs = new Set();
export const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
const emit = () => { subs.forEach(cb => cb()); schedulePush(); };

export const get = () => state;
export const activeProfile = () => state.profiles.find(p => p.id === state.activeId) || null;
export const syncConfigured = () => sync.syncConfigured();

async function loadAll() {
  state.profiles = await db.getAll('profiles');
  state.activeId = await db.getMeta('activeProfileId', null);
  if (state.activeId && !state.profiles.find(p => p.id === state.activeId)) state.activeId = null;
  if (!state.activeId && state.profiles.length) state.activeId = state.profiles[0].id;
  state.customExercises = await db.getAll('customExercises');
  state.theme = await db.getMeta('theme', 'light');
  document.documentElement.dataset.theme = state.theme;
  await loadHistory();
}

export async function init() {
  await loadAll();
  state.ready = true;
  emit();
  initSync(); // non-blocking
}

// ---- cloud sync ------------------------------------------------------------
async function initSync() {
  if (!sync.syncConfigured()) return;
  try {
    const user = await sync.currentUser();
    state.user = user;
    if (user) await reconcileWithCloud();
    emit();
  } catch (e) { console.warn('Cloud sync init failed:', e.message); }
}

// On login/startup: if the cloud has data, use it; otherwise seed it with what
// is on this device.
async function reconcileWithCloud() {
  const remote = await sync.pullData();
  if (remote && Array.isArray(remote.profiles) && remote.profiles.length) {
    await applyBlob(remote);
  } else {
    await sync.pushData(await exportData());
  }
}

async function applyBlob(blob) {
  for (const p of blob.profiles || []) await db.put('profiles', p);
  for (const q of blob.quests || []) await db.put('quests', q);
  for (const l of blob.logs || []) await db.put('logs', l);
  for (const pr of blob.programs || []) await db.put('programs', pr);
  for (const c of blob.customExercises || []) await db.put('customExercises', c);
  if (blob.activeProfileId) await db.setMeta('activeProfileId', blob.activeProfileId);
  await loadAll();
}

let pushTimer = null;
function schedulePush() {
  if (!sync.syncConfigured() || !state.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try { await sync.pushData(await exportData()); } catch (e) { console.warn('Cloud push failed:', e.message); }
  }, 2000);
}

export async function signUpUser(email, password) {
  const { user } = await sync.signUp(email, password);
  state.user = await sync.currentUser();
  if (state.user) await sync.pushData(await exportData());
  emit();
  return { user, needsConfirm: !state.user };
}

export async function signInUser(email, password) {
  await sync.signIn(email, password);
  state.user = await sync.currentUser();
  state.syncing = true; emit();
  if (state.user) await reconcileWithCloud();
  state.syncing = false; emit();
}

export async function signOutUser() {
  await sync.signOut();
  state.user = null;
  emit();
}

export async function setTheme(t) {
  state.theme = t;
  document.documentElement.dataset.theme = t;
  await db.setMeta('theme', t);
  emit();
}

async function loadHistory() {
  if (!state.activeId) { state.quests = []; state.logs = []; state.programs = []; return; }
  state.quests = await db.getAllByProfile('quests', state.activeId);
  state.logs = await db.getAllByProfile('logs', state.activeId);
  state.programs = await db.getAllByProfile('programs', state.activeId);
}

// ---- custom exercises & programs ------------------------------------------
export async function addCustomExercise(ex) {
  const record = { id: db.uid(), custom: true, ...ex };
  await db.put('customExercises', record);
  state.customExercises.push(record);
  emit();
  return record;
}

export async function saveProgram(name, exercises, category = 'gym') {
  const record = { id: db.uid(), profileId: state.activeId, name, exercises, category, createdAt: new Date().toISOString() };
  await db.put('programs', record);
  state.programs.push(record);
  emit();
  return record;
}

export async function updateProgram(id, name, exercises) {
  const p = state.programs.find(x => x.id === id);
  if (!p) return null;
  p.name = name;
  p.exercises = exercises;
  await db.put('programs', p);
  emit();
  return p;
}

export async function deleteProgram(id) {
  await db.del('programs', id);
  state.programs = state.programs.filter(p => p.id !== id);
  emit();
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

export async function persistQuest(q) {
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

// ---- backup / restore ------------------------------------------------------
export async function exportData() {
  return {
    app: 'summer-quest', version: 1, exportedAt: new Date().toISOString(),
    profiles: await db.getAll('profiles'),
    quests: await db.getAll('quests'),
    logs: await db.getAll('logs'),
    programs: await db.getAll('programs'),
    customExercises: await db.getAll('customExercises'),
    activeProfileId: await db.getMeta('activeProfileId', null),
  };
}

export async function importData(data) {
  if (!data || data.app !== 'summer-quest') throw new Error('Not a Summer Quest backup');
  for (const p of data.profiles || []) await db.put('profiles', p);
  for (const q of data.quests || []) await db.put('quests', q);
  for (const l of data.logs || []) await db.put('logs', l);
  for (const pr of data.programs || []) await db.put('programs', pr);
  for (const c of data.customExercises || []) await db.put('customExercises', c);
  if (data.activeProfileId) await db.setMeta('activeProfileId', data.activeProfileId);
  await init();
}
