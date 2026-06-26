// ============================================================================
// UI: hash router + screens (home, quest, log, stats, library, profile).
// Renders HTML strings into #app and handles interaction via event delegation.
// ============================================================================

import * as S from './state.js';
import {
  EXERCISES, CATEGORIES, SPORTS, ACTIVITY_TYPES, EQUIPMENT_OPTIONS,
  GOAL_OPTIONS, LOCATION_OPTIONS, MUSCLES, MUSCLE_IDS, exerciseById,
  muscleName, GYM_EXERCISES, EFFORT_LEVELS, effortById,
  gymExerciseById, STARTER_PROGRAMS,
} from './data.js';
import {
  generateQuest, swapExercise, estMinutes, effortEvents, currentFatigue,
  volumeWindow, xpForDay, currentStreak, dayRating, activityXp, gymEntryXp,
  gymSessionXp, gymSessionMinutes, dayKey, QUEST_XP,
} from './engine.js';
import { bodyMap, muscleHighlight, demoSVG } from './ui-svg.js';
import { exerciseMedia } from './media.js';
import { HOWTO } from './howto.js';

// Merged gym catalog (built-in + user custom) and a name resolver.
const gymCatalog = () => [...GYM_EXERCISES, ...S.get().customExercises];
const gymResolve = (str) => {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;
  const list = gymCatalog();
  return list.find(e => e.name.toLowerCase() === s)
    || list.find(e => e.name.toLowerCase().includes(s))
    || list.find(e => s.includes(e.name.toLowerCase())) || null;
};

const app = () => document.getElementById('app');
const nav = () => document.getElementById('nav');

// Ephemeral UI state (not persisted).
const ui = {
  selectedTier: 'standard', logType: 'swim', sport: 'volleyball', creatingProfile: false,
  // gym session builder
  session: [], sessionName: '', gymEffort: 'hard', customUnit: 'reps',
  customMuscles: {}, addMode: 'list', qaMusclesOpen: false,
  editingIndex: null, editEffort: 'hard', loadedProgramId: null,
  backupView: null, backupText: '',
};

// Build a free / typed-in session entry (custom move or mobility step). No
// catalog needed; muscles are optional (empty = mobility/recovery).
function buildFreeEntry(name, desc, unit, sets, amt, weight, effort, muscles) {
  return {
    ref: null, name, desc: desc || '', muscles: muscles || {}, unit,
    sets: Math.max(1, sets || 0),
    reps: unit === 'reps' ? Math.max(1, amt || 0) : undefined,
    seconds: unit === 'seconds' ? Math.max(1, amt || 0) : undefined,
    weight: weight || 0, effort,
  };
}

// Build a gym session entry from the add-form inputs / a catalog exercise.
function buildEntry(gx, weight, sets, amt, effort) {
  const unit = gx.unit || 'reps';
  return {
    ref: gx.id, name: gx.name, muscles: gx.muscles, unit,
    sets: Math.max(1, sets || 0),
    reps: unit === 'reps' ? Math.max(1, amt || 0) : undefined,
    seconds: unit === 'seconds' ? Math.max(1, amt || 0) : undefined,
    weight: weight || 0, effort,
  };
}
const gymEntryMeta = (e) =>
  `${e.sets}×${e.unit === 'seconds' ? e.seconds + 's' : e.reps}${e.weight ? ` · ${e.weight}kg` : ''} · ${effortById(e.effort).label}`;

// Quick-log shortcuts shown on the home screen (short labels for the grid).
const QUICK_LOG = [
  { type: 'swim', icon: '🏊', label: 'Swim' },
  { type: 'run', icon: '🏃', label: 'Run' },
  { type: 'walk', icon: '🚶', label: 'Walk' },
  { type: 'gym', icon: '🏋️', label: 'Gym' },
  { type: 'sport', icon: '🏐', label: 'Sport' },
  { type: 'mobility', icon: '🧘', label: 'Mobility' },
];
const LOG_TABS = ['swim', 'run', 'walk', 'gym', 'sport', 'mobility'];
const logTabMeta = (t) => t === 'sport' ? { icon: '🏐', name: 'Sport' } : t === 'gym' ? { icon: '🏋️', name: 'Gym' } : { icon: ACTIVITY_TYPES[t].icon, name: ACTIVITY_TYPES[t].name };

// ---- small helpers ---------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const route = () => (location.hash.replace(/^#/, '') || '/home');

function formatAmount(unit, amount) {
  if (unit === 'seconds') return `${amount}s hold`;
  if (unit === 'reps_each') return `${amount} each side`;
  return `${amount} reps`;
}

function muscleChips(muscles) {
  const prim = [], sec = [];
  for (const [m, w] of Object.entries(muscles)) {
    const label = m === 'conditioning' ? 'Cardio' : muscleName(m);
    if (w >= 0.6) prim.push(label);
    else if (w >= 0.25) sec.push(label);
  }
  return `${prim.map(p => `<span class="chip chip-prim">${p}</span>`).join('')}${sec.map(s => `<span class="chip chip-sec">${s}</span>`).join('')}`;
}

// ---- aggregates for stats --------------------------------------------------
function aggregates() {
  const { quests, logs } = S.get();
  const completed = quests.filter(q => q.status === 'completed');
  let totalXp = 0;
  for (const q of completed) totalXp += QUEST_XP[q.tier] || 0;
  for (const l of logs) totalXp += l.xp || 0;
  const events = effortEvents(quests, logs);
  const fatigue = currentFatigue(events);
  const vol30 = volumeWindow(events, 30);
  const vol7 = volumeWindow(events, 7);
  let swimM = 0, runKm = 0;
  for (const l of logs) {
    if (l.metric === 'swim_m' && l.distance) swimM += l.distance;
    if (l.metric === 'run_km' && l.distance) runKm += l.distance;
  }
  const sportCount = logs.filter(l => l.kind === 'sport').length;
  return { completed, totalXp, fatigue, vol30, vol7, swimM, runKm, sportCount, logs, quests };
}

function insights() {
  const { quests, logs } = S.get();
  const out = [];

  // Leg vs upper-body volume balance.
  const v = volumeWindow(effortEvents(quests, logs), 30);
  const upper = v.chest + v.back + v.shoulders + v.triceps + v.biceps;
  const lower = v.quads + v.hamstrings + v.glutes + v.calves;
  if (upper > 0 && lower > 0) {
    if (lower < upper) out.push(`Your legs receive ${Math.round((1 - lower / upper) * 100)}% less volume than your upper body.`);
    else if (upper < lower) out.push(`Your upper body receives ${Math.round((1 - upper / lower) * 100)}% less volume than your legs.`);
  }

  // Quests on swim days vs non-swim days.
  const byDay = {};
  for (const q of quests) if (q.status === 'completed' && q.completedAt) {
    const k = dayKey(q.completedAt); (byDay[k] = byDay[k] || { q: 0, swim: false }).q++;
  }
  for (const l of logs) { const k = dayKey(l.createdAt); (byDay[k] = byDay[k] || { q: 0, swim: false }); if (l.subtype === 'swim') byDay[k].swim = true; }
  const swimDays = Object.values(byDay).filter(d => d.swim), nonSwim = Object.values(byDay).filter(d => !d.swim);
  if (swimDays.length >= 2 && nonSwim.length >= 1) {
    const avgS = swimDays.reduce((s, d) => s + d.q, 0) / swimDays.length;
    const avgN = nonSwim.reduce((s, d) => s + d.q, 0) / Math.max(1, nonSwim.length);
    if (avgN > 0 && avgS > avgN) out.push(`You complete ${Math.round((avgS / avgN - 1) * 100)}% more quests on days you swim.`);
  }

  // Most active weekday.
  const wk = [0, 0, 0, 0, 0, 0, 0], names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const q of quests) if (q.status === 'completed' && q.completedAt) wk[new Date(q.completedAt).getDay()] += QUEST_XP[q.tier] || 0;
  for (const l of logs) wk[new Date(l.createdAt).getDay()] += l.xp || 0;
  if (wk.some(x => x > 0)) out.push(`${names[wk.indexOf(Math.max(...wk))]} is your most active day.`);

  if (!out.length) out.push('Complete a few quests and log activities — personalised insights will appear here.');
  return out;
}

// ---- progress ring ---------------------------------------------------------
function ratingRing(todayXp) {
  const r = dayRating(todayXp);
  const bands = [0, 50, 100, 150];
  let lo = 0, hi = 150;
  for (let i = 0; i < bands.length; i++) if (todayXp >= bands[i]) { lo = bands[i]; hi = bands[i + 1] || bands[i] + 50; }
  const frac = todayXp >= 150 ? 1 : Math.min(1, (todayXp - lo) / (hi - lo));
  const C = 2 * Math.PI * 52;
  return `<svg class="ring" viewBox="0 0 120 120">
    <circle class="ring-bg" cx="60" cy="60" r="52"/>
    <circle class="ring-fg ring-${r.tier}" cx="60" cy="60" r="52"
      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/>
    <text class="ring-xp" x="60" y="56">${todayXp}</text>
    <text class="ring-unit" x="60" y="74">XP today</text>
  </svg>`;
}

// ---- screens ---------------------------------------------------------------
function screenOnboarding() {
  return profileForm(null, true);
}

function screenHome() {
  const p = S.activeProfile();
  const { quests, logs } = S.get();
  const todayXp = xpForDay(quests, logs, dayKey());
  const rating = dayRating(todayXp);
  const streak = currentStreak(quests, logs);
  const pending = S.pendingQuest();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const feed = recentFeed(6);

  return `
  <header class="topbar">
    <div><div class="greet">${greet},</div><div class="pname">${esc(p.name)}</div></div>
    <a class="avatar" href="#/profile" style="background:${p.avatarColor}">${esc(p.name[0] || '?').toUpperCase()}</a>
  </header>

  <div class="card today-card">
    ${ratingRing(todayXp)}
    <div class="today-meta">
      <div class="rating-badge rating-${rating.tier}">${rating.label}</div>
      <div class="streak">🔥 ${streak} day${streak === 1 ? '' : 's'} streak</div>
    </div>
  </div>

  ${pending ? `
  <a class="card pending-card" href="#/quest">
    <div><div class="card-kicker">In progress</div><div class="pending-title">${pending.tierName} · ${pending.estMinutes} min</div></div>
    <div class="btn-ghost">Continue →</div>
  </a>` : `
  <div class="card quest-cta">
    <div class="cta-q">Ready for your next quest?</div>
    <div class="tier-row">
      ${['micro', 'standard', 'challenge'].map(t => `
        <button class="tier-pill ${ui.selectedTier === t ? 'on' : ''}" data-action="set-tier" data-tier="${t}">
          <span class="tier-name">${t[0].toUpperCase() + t.slice(1)}</span>
          <span class="tier-xp">+${QUEST_XP[t]} XP</span>
        </button>`).join('')}
    </div>
    <button class="btn-primary big" data-action="generate">⚡ Generate Quest</button>
  </div>`}

  <div class="section-title">Quick log</div>
  <div class="quick-log">
    ${QUICK_LOG.map(q => `<a class="ql" href="#/log?type=${q.type}"><span class="ql-icon">${q.icon}</span>${q.label}</a>`).join('')}
  </div>

  <div class="section-title">Recent activity</div>
  ${feed || '<div class="empty">No activity yet today. Generate a quest to begin your adventure.</div>'}
  `;
}

function recentFeed(n) {
  const { quests, logs } = S.get();
  const items = [];
  for (const q of quests) if (q.status === 'completed' && q.completedAt) items.push({ t: q.completedAt, icon: '⚡', title: `${q.tierName}`, sub: q.exercises.map(e => exerciseById(e.exerciseId)?.name).slice(0, 2).join(', '), xp: QUEST_XP[q.tier] });
  for (const l of logs) {
    let sub;
    if (l.kind === 'gym') {
      const es = l.entries || [];
      sub = `${es.length} exercise${es.length === 1 ? '' : 's'} · ${es.reduce((s, e) => s + (e.sets || 0), 0)} sets`;
    } else {
      sub = `${l.minutes} min${l.distance ? ` · ${l.distance}${l.metric === 'swim_m' ? ' m' : ' km'}` : ''}`;
    }
    items.push({ t: l.createdAt, icon: l.icon || '🏅', title: l.label, sub, xp: l.xp });
  }
  items.sort((a, b) => new Date(b.t) - new Date(a.t));
  if (!items.length) return '';
  return `<div class="feed">${items.slice(0, n).map(it => `
    <div class="feed-row">
      <div class="feed-icon">${it.icon}</div>
      <div class="feed-body"><div class="feed-title">${esc(it.title)}</div><div class="feed-sub">${esc(it.sub || '')}</div></div>
      <div class="feed-xp">+${it.xp}</div>
    </div>`).join('')}</div>`;
}

function screenQuest() {
  const q = S.pendingQuest();
  if (!q) {
    return `<header class="topbar"><div class="pname">Quest</div></header>
      <div class="card quest-cta">
        <div class="cta-q">No active quest</div>
        <div class="tier-row">${['micro', 'standard', 'challenge'].map(t => `<button class="tier-pill ${ui.selectedTier === t ? 'on' : ''}" data-action="set-tier" data-tier="${t}"><span class="tier-name">${t[0].toUpperCase() + t.slice(1)}</span><span class="tier-xp">+${QUEST_XP[t]} XP</span></button>`).join('')}</div>
        <button class="btn-primary big" data-action="generate">⚡ Generate Quest</button>
      </div>`;
  }
  return `
  <header class="topbar"><a class="back" href="#/home">←</a><div class="pname">${q.tierName}</div></header>
  <div class="card quest-head">
    <div class="qh-row"><span class="qh-time">⏱ ${q.estMinutes} min</span><span class="qh-xp">+${q.xp} XP</span></div>
    <div class="reason">💡 ${esc(q.reason)}</div>
    ${q.rounds > 1 ? `<div class="rounds-banner">🔁 Complete the whole circuit <strong>${q.rounds} times</strong></div>` : ''}
  </div>
  ${q.exercises.map((it, i) => {
    const ex = exerciseById(it.exerciseId);
    return `<div class="card ex-card">
      <div class="ex-top">
        <div class="ex-demo">${exerciseMedia(ex)}</div>
        <div class="ex-headinfo">
          <a class="ex-name" href="#/exercise/${ex.id}?from=quest">${i + 1}. ${esc(ex.name)} <span class="ex-info">ⓘ</span></a>
          <div class="ex-amount">${formatAmount(ex.unit, it.amount)}${q.rounds > 1 ? ' <span class="per-round">per round</span>' : ''}</div>
          <div class="chips">${muscleChips(ex.muscles)}</div>
          <button class="ex-swap" data-action="swap-exercise" data-i="${i}">↻ Swap this exercise</button>
        </div>
      </div>
      <div class="ex-mid">
        <div class="ex-map">${bodyMap(muscleHighlight(ex.muscles), 'highlight')}</div>
        <ul class="cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
    </div>`;
  }).join('')}
  <div class="quest-actions">
    <button class="btn-ghost" data-action="regenerate">↻ Regenerate</button>
    <button class="btn-primary big" data-action="complete-quest" data-id="${q.id}">✓ Complete Quest (+${q.xp} XP)</button>
  </div>
  `;
}

// Quick-add: type any move (a gym exercise that isn't listed, or a mobility /
// stretch step) straight into the session. Muscle tags are optional.
function quickAddForm() {
  const amtLabel = ui.customUnit === 'seconds' ? 'Seconds' : 'Reps';
  return `
    <label class="field"><span>Name</span><input id="qa-name" type="text" maxlength="44" placeholder="e.g. World's Greatest Stretch"></label>
    <label class="field"><span>Description / how-to <span class="muted-note">(optional)</span></span><input id="qa-desc" type="text" maxlength="120" placeholder="e.g. Deep lunge, rotate up, hold and breathe"></label>
    <div class="field"><span>Measured in</span>
      <div class="effort-row">${['reps', 'seconds'].map(u => `<button type="button" class="effort-pill ${ui.customUnit === u ? 'on' : ''}" data-action="set-custom-unit" data-u="${u}">${u === 'reps' ? 'Reps' : 'Seconds (hold)'}</button>`).join('')}</div>
    </div>
    <div class="gym-row">
      <label class="field"><span>Weight (kg)</span><input id="qa-weight" type="number" min="0" step="0.5" placeholder="opt."></label>
      <label class="field"><span>Sets</span><input id="qa-sets" type="number" min="1" step="1" value="3"></label>
      <label class="field"><span id="qa-amt-label">${amtLabel}</span><input id="qa-amt" type="number" min="1" step="1" value="${ui.customUnit === 'seconds' ? 30 : 10}"></label>
    </div>
    <div class="field"><span>Effort</span>
      <div class="effort-row" id="effort-row">${EFFORT_LEVELS.map(l => `<button type="button" class="effort-pill ${ui.gymEffort === l.id ? 'on' : ''}" data-action="set-effort" data-effort="${l.id}">${l.label}</button>`).join('')}</div>
    </div>
    <button class="link-btn" data-action="toggle-qa-muscles">${ui.qaMusclesOpen ? 'Hide muscle tags' : 'Tag muscle groups (optional)'}</button>
    ${ui.qaMusclesOpen ? `<div class="muscle-grid">${MUSCLE_IDS.map(m => `<button type="button" class="mtag ${ui.customMuscles[m] || ''}" data-action="cycle-muscle" data-m="${m}">${muscleName(m)}</button>`).join('')}</div>` : ''}
    <p class="muted-note">No tags = treated as <strong>mobility / recovery</strong>: earns XP but adds no muscle fatigue. Tag muscles to make it count toward those groups.</p>
    <label class="checkrow"><input type="checkbox" id="qa-save"> Also save to my exercises for next time</label>
    <button class="btn-primary big" data-action="add-free">＋ Add to session</button>`;
}

function screenGym(typeTabs) {
  const programs = S.get().programs;
  const entries = ui.session;
  const total = gymSessionXp(entries);
  return `
  <header class="topbar"><a class="back" href="#/home">←</a><div class="pname">Gym Session</div></header>
  <div class="logtabs">${typeTabs}</div>

  <div class="section-title">Starter programs</div>
  <div class="prog-chips">${STARTER_PROGRAMS.map(p => `<button class="prog-chip preset" data-action="load-preset" data-id="${p.id}">⭐ ${esc(p.name)} <span>${p.exercises.length}</span></button>`).join('')}</div>

  ${programs.length ? `<div class="section-title">Your programs</div>
    <div class="prog-chips">${programs.map(p => `<button class="prog-chip" data-action="load-program" data-id="${p.id}">${esc(p.name)} <span>${p.exercises.length}</span></button>`).join('')}</div>` : ''}

  <div class="section-title">${ui.sessionName ? esc(ui.sessionName) : 'Session'}${ui.loadedProgramId ? ' <span class="muted-note">· editing saved program</span>' : ''}</div>
  <div class="card">
    ${entries.length ? entries.map((e, i) => ui.editingIndex === i ? entryEditor(e, i) : `
      <div class="sess-row">
        <div class="sess-body" data-action="edit-entry" data-i="${i}">
          <div class="sess-name">${esc(e.name)} <span class="ex-info">✎</span></div>
          <div class="sess-meta">${gymEntryMeta(e)}</div>
          ${e.desc ? `<div class="sess-desc">${esc(e.desc)}</div>` : ''}
        </div>
        <div class="sess-xp">+${gymEntryXp(e)}</div>
        <button class="sess-x" data-action="remove-entry" data-i="${i}">✕</button>
      </div>`).join('') : '<div class="muted-note">No exercises yet — add your first below.</div>'}
    ${entries.length ? `<div class="sess-total">Total <strong>+${total} XP</strong></div>` : ''}
  </div>

  <div class="section-title">Add exercise</div>
  <div class="card log-form">
    <div class="seg">
      <button class="seg-btn ${ui.addMode === 'list' ? 'on' : ''}" data-action="set-add-mode" data-mode="list">From list</button>
      <button class="seg-btn ${ui.addMode === 'custom' ? 'on' : ''}" data-action="set-add-mode" data-mode="custom">Type your own</button>
    </div>
    ${ui.addMode === 'list' ? `
    <label class="field"><span>Exercise</span>
      <input id="gym-name" list="gym-list" placeholder="e.g. Dumbbell Chest Press" autocomplete="off" data-live>
      <datalist id="gym-list">${gymCatalog().map(g => `<option value="${esc(g.name)}"></option>`).join('')}</datalist>
    </label>
    <div class="field"><span>Detected muscles</span><div class="chips" id="gym-muscles"><span class="muted-note">Start typing and pick an exercise…</span></div></div>
    <div class="gym-row">
      <label class="field"><span>Weight (kg)</span><input id="gym-weight" type="number" min="0" step="0.5" placeholder="opt." data-live></label>
      <label class="field"><span>Sets</span><input id="gym-sets" type="number" min="1" step="1" value="3" data-live></label>
      <label class="field"><span id="gym-amt-label">Reps</span><input id="gym-amt" type="number" min="1" step="1" value="10" data-live></label>
    </div>
    <div class="field"><span>Effort</span>
      <div class="effort-row" id="effort-row">${EFFORT_LEVELS.map(l => `<button type="button" class="effort-pill ${ui.gymEffort === l.id ? 'on' : ''}" data-action="set-effort" data-effort="${l.id}">${l.label}</button>`).join('')}</div>
    </div>
    <div class="xp-preview">This exercise: <strong id="xp-preview">+0</strong> XP</div>
    <button class="btn-primary big" data-action="add-entry">＋ Add to session</button>
    ` : quickAddForm()}
  </div>

  ${entries.length ? `<div class="quest-actions">
    ${ui.loadedProgramId
      ? `<button class="btn-ghost" data-action="update-program">★ Update “${esc(ui.sessionName)}”</button>`
      : `<button class="btn-ghost" data-action="save-program">★ Save as program</button>`}
    <button class="btn-primary big" data-action="log-session">Log session (+${total} XP)</button>
  </div>
  ${ui.loadedProgramId ? `<button class="link-btn" data-action="save-program">…or save as a new program</button>` : ''}` : ''}`;
}

// Inline editor for one session entry (edit weight / sets / reps / effort).
function entryEditor(e, i) {
  const amtLabel = e.unit === 'seconds' ? 'Seconds' : 'Reps';
  const amtVal = e.unit === 'seconds' ? e.seconds : e.reps;
  return `<div class="sess-row editing"><div class="entry-editor">
    <div class="sess-name">${esc(e.name)}</div>
    <div class="gym-row">
      <label class="field"><span>Weight (kg)</span><input id="edit-weight" type="number" min="0" step="0.5" value="${e.weight || ''}" placeholder="opt."></label>
      <label class="field"><span>Sets</span><input id="edit-sets" type="number" min="1" step="1" value="${e.sets}"></label>
      <label class="field"><span>${amtLabel}</span><input id="edit-amt" type="number" min="1" step="1" value="${amtVal}"></label>
    </div>
    <div class="effort-row" id="edit-effort-row">${EFFORT_LEVELS.map(l => `<button type="button" class="effort-pill ${ui.editEffort === l.id ? 'on' : ''}" data-action="set-edit-effort" data-effort="${l.id}">${l.label}</button>`).join('')}</div>
    <div class="two-btn"><button class="btn-ghost" data-action="cancel-edit">Cancel</button><button class="btn-primary" data-action="commit-edit" data-i="${i}">Save</button></div>
  </div></div>`;
}

function screenLog() {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  if (params.get('type')) ui.logType = params.get('type');
  const type = ui.logType;
  const isSport = type === 'sport';
  const isGym = type === 'gym';
  const def = (isSport || isGym) ? null : ACTIVITY_TYPES[type];

  const typeTabs = LOG_TABS.map(t => {
    const m = logTabMeta(t);
    return `<button class="logtab ${type === t ? 'on' : ''}" data-action="set-log-type" data-type="${t}"><span>${m.icon}</span>${m.name}</button>`;
  }).join('');

  if (isGym) return screenGym(typeTabs);

  let fields = '';
  if (isSport) {
    fields = `
      <label class="field"><span>Sport</span>
        <select id="log-sport" data-live>${Object.entries(SPORTS).map(([k, s]) => `<option value="${k}" ${ui.sport === k ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}</select>
      </label>`;
  } else {
    const ints = Object.entries(def.intensities);
    fields = `
      <label class="field"><span>Intensity</span>
        <select id="log-intensity" data-live>${ints.map(([k, v], i) => `<option value="${k}" ${i === 0 ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
      </label>`;
  }

  const metric = isSport ? null : def.metric;
  const distField = metric ? `
    <label class="field"><span>Distance ${metric === 'swim_m' ? '(m, optional)' : '(km, optional)'}</span>
      <input id="log-distance" type="number" min="0" step="${metric === 'swim_m' ? '50' : '0.1'}" placeholder="optional" data-live></label>` : '';

  return `
  <header class="topbar"><a class="back" href="#/home">←</a><div class="pname">Log Activity</div></header>
  <div class="logtabs">${typeTabs}</div>
  <div class="card log-form">
    ${fields}
    <label class="field"><span>Duration (minutes)</span>
      <input id="log-minutes" type="number" min="1" step="1" value="30" data-live></label>
    ${distField}
    <div class="xp-preview">Earns <strong id="xp-preview">+20</strong> XP</div>
    <button class="btn-primary big" data-action="save-log">Save Activity</button>
  </div>`;
}

function logPreviewXp() {
  const type = ui.logType, isSport = type === 'sport';
  const mins = parseFloat(document.getElementById('log-minutes')?.value) || 0;
  if (isSport) {
    const sub = document.getElementById('log-sport')?.value || ui.sport;
    return activityXp('sport', sub, null, mins);
  }
  const intensity = document.getElementById('log-intensity')?.value || Object.keys(ACTIVITY_TYPES[type].intensities)[0];
  return activityXp(ACTIVITY_TYPES[type].kind, type, intensity, mins);
}

function screenStats() {
  const a = aggregates();
  const streak = currentStreak(a.quests, a.logs);
  const last7 = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); last7.push({ k, label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], xp: xpForDay(a.quests, a.logs, k) }); }
  const maxXp = Math.max(50, ...last7.map(d => d.xp));
  const weekMin = a.logs.filter(l => (Date.now() - new Date(l.createdAt)) < 7 * 864e5).reduce((s, l) => s + (l.minutes || 0), 0)
    + a.quests.filter(q => q.status === 'completed' && (Date.now() - new Date(q.completedAt)) < 7 * 864e5).reduce((s, q) => s + (q.estMinutes || 0), 0);

  const maxVol = Math.max(1, ...MUSCLE_IDS.map(m => a.vol30[m]));

  return `
  <header class="topbar"><div class="pname">Your Adventure</div></header>
  <div class="stat-grid">
    <div class="card stat"><div class="stat-n">${a.totalXp}</div><div class="stat-l">Total XP</div></div>
    <div class="card stat"><div class="stat-n">${a.completed.length}</div><div class="stat-l">Quests done</div></div>
    <div class="card stat"><div class="stat-n">🔥 ${streak}</div><div class="stat-l">Day streak</div></div>
    <div class="card stat"><div class="stat-n">${weekMin}</div><div class="stat-l">Min this week</div></div>
  </div>

  <div class="section-title">Last 7 days</div>
  <div class="card"><div class="bars">${last7.map(d => `
    <div class="bar-col"><div class="bar" style="height:${Math.max(4, d.xp / maxXp * 100)}%"><span>${d.xp || ''}</span></div><div class="bar-lab">${d.label}</div></div>`).join('')}</div></div>

  <div class="section-title">Recovery — current fatigue</div>
  <div class="card heatcard">
    <div class="heatmap">${bodyMap(a.fatigue, 'heat', { labels: true })}</div>
    <div class="fatigue-list">${[...MUSCLE_IDS].sort((x, y) => a.fatigue[y] - a.fatigue[x]).slice(0, 5).map(m => `
      <div class="frow"><span>${muscleName(m)}</span><div class="fbar"><div style="width:${a.fatigue[m]}%;background:${a.fatigue[m] >= 60 ? '#ff4d56' : a.fatigue[m] >= 30 ? '#ffc24b' : '#2fbf71'}"></div></div><span class="fpct">${a.fatigue[m]}%</span></div>`).join('')}</div>
  </div>

  <div class="section-title">Muscle volume (30 days, effective reps)</div>
  <div class="card">${MUSCLE_IDS.map(m => `
    <div class="vrow"><span class="vlab">${muscleName(m)}</span><div class="vbar"><div style="width:${a.vol30[m] / maxVol * 100}%"></div></div><span class="vnum">${a.vol30[m]}</span></div>`).join('')}</div>

  <div class="section-title">Distances & sports</div>
  <div class="stat-grid">
    <div class="card stat"><div class="stat-n">${(a.swimM / 1000).toFixed(1)}<small>km</small></div><div class="stat-l">Swum</div></div>
    <div class="card stat"><div class="stat-n">${a.runKm.toFixed(1)}<small>km</small></div><div class="stat-l">Run / walked</div></div>
    <div class="card stat"><div class="stat-n">${a.sportCount}</div><div class="stat-l">Sports sessions</div></div>
  </div>

  <div class="section-title">Insights</div>
  <div class="card insights">${insights().map(i => `<div class="insight">📈 ${esc(i)}</div>`).join('')}</div>
  `;
}

function screenLibrary() {
  return `
  <header class="topbar"><div class="pname">Exercise Library</div></header>
  ${Object.entries(CATEGORIES).map(([key, cat]) => {
    const list = EXERCISES.filter(e => e.category === key);
    return `<div class="section-title">${cat.name}</div>
      <div class="lib-grid">${list.map(e => `
        <a class="card lib-item" href="#/exercise/${e.id}">
          <div class="lib-demo">${exerciseMedia(e)}</div>
          <div class="lib-name">${esc(e.name)}</div>
        </a>`).join('')}</div>`;
  }).join('')}`;
}

function screenExercise(id) {
  const ex = exerciseById(id);
  if (!ex) return `<div class="empty">Exercise not found.</div>`;
  const chain = ex.chain ? EXERCISES.filter(e => e.chain === ex.chain).sort((a, b) => a.level - b.level) : [];
  const h = HOWTO[ex.id];
  const back = location.hash.includes('from=quest') ? '#/quest' : '#/library';
  return `
  <header class="topbar"><a class="back" href="${back}">←</a><div class="pname">${esc(ex.name)}</div></header>
  <div class="card ex-detail">
    <div class="ex-demo big">${exerciseMedia(ex)}</div>
    <div class="chips center">${muscleChips(ex.muscles)}</div>
    <div class="ex-map big">${bodyMap(muscleHighlight(ex.muscles), 'highlight', { labels: true })}</div>
    <div class="legend"><span class="chip chip-prim">Primary</span><span class="chip chip-sec">Secondary</span></div>
    <ul class="cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  </div>
  ${h ? `<div class="section-title">How to perform</div>
  <div class="card howto">
    ${h.tempo ? `<div class="tempo-badge">Tempo · ${esc(h.tempo)}</div>` : ''}
    <ol class="steps">${h.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${h.avoid && h.avoid.length ? `<div class="avoid-title">⚠ Common mistakes</div><ul class="avoid">${h.avoid.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
  </div>` : ''}
  ${chain.length > 1 ? `<div class="section-title">Progression</div>
    <div class="card chain">${chain.map(c => `<div class="chain-step ${c.id === ex.id ? 'on' : ''}">${c.id === ex.id ? '▸ ' : ''}${esc(c.name)}</div>`).join('<div class="chain-arrow">↓</div>')}</div>` : ''}
  `;
}

function profileForm(p, onboarding) {
  const equip = new Set(p ? p.equipment : ['wall', 'chair']);
  const goal = p ? p.goal : 'general';
  const loc = p ? p.location : 'home';
  const level = p ? p.level : 2;
  return `
  ${onboarding ? `<div class="onboard-hero"><div class="logo">☀️</div><h1>Summer Quest</h1><p>Turn your free days into an adventure. Let's set up your profile.</p></div>`
      : `<header class="topbar"><a class="back" href="#/profile">←</a><div class="pname">${p ? 'Edit profile' : 'New profile'}</div></header>`}
  <div class="card log-form">
    <label class="field"><span>Name</span><input id="pf-name" type="text" maxlength="24" value="${p ? esc(p.name) : ''}" placeholder="Your name"></label>
    <label class="field"><span>Main goal</span><select id="pf-goal">${GOAL_OPTIONS.map(g => `<option value="${g.id}" ${goal === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select></label>
    <label class="field"><span>Where are you?</span><select id="pf-loc">${LOCATION_OPTIONS.map(l => `<option value="${l.id}" ${loc === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label>
    <label class="field"><span>Difficulty level: <strong id="pf-levellab">${level}</strong>/5</span><input id="pf-level" type="range" min="1" max="5" value="${level}" oninput="document.getElementById('pf-levellab').textContent=this.value"></label>
    <div class="field"><span>Available equipment</span>
      <div class="equip-grid">${EQUIPMENT_OPTIONS.map(eq => `<label class="equip ${equip.has(eq.id) ? 'on' : ''}"><input type="checkbox" class="pf-equip" value="${eq.id}" ${equip.has(eq.id) ? 'checked' : ''}>${eq.name}</label>`).join('')}</div>
    </div>
    <button class="btn-primary big" data-action="${p ? 'update-profile' : 'create-profile'}">${p ? 'Save changes' : (onboarding ? 'Start questing ⚡' : 'Create profile')}</button>
  </div>`;
}

function screenProfile() {
  if (ui.creatingProfile) return profileForm(null, false);
  const { profiles } = S.get();
  const p = S.activeProfile();
  return `
  <header class="topbar"><div class="pname">Profile</div></header>
  <div class="section-title">Profiles</div>
  <div class="card prof-switch">
    ${profiles.map(pr => `<button class="prof-row ${pr.id === p.id ? 'on' : ''}" data-action="switch-profile" data-id="${pr.id}">
      <span class="avatar sm" style="background:${pr.avatarColor}">${esc(pr.name[0] || '?').toUpperCase()}</span>
      <span class="prof-name">${esc(pr.name)}</span>${pr.id === p.id ? '<span class="prof-active">active</span>' : ''}</button>`).join('')}
    <button class="prof-row add" data-action="new-profile">＋ Add profile</button>
  </div>
  ${profileForm(p, false)}

  <div class="section-title">Backup &amp; restore</div>
  <div class="card backup-card">
    <p class="muted-note">Your data is stored only on this device. Export a backup before reinstalling the app, or to move to another phone.</p>
    <div class="two-btn">
      <button class="btn-ghost" data-action="backup-export">⤓ Export</button>
      <button class="btn-ghost" data-action="backup-import">⤒ Restore</button>
    </div>
    ${ui.backupView === 'export' ? `
      <textarea class="backup-area" id="backup-out" readonly>${esc(ui.backupText)}</textarea>
      <div class="two-btn">
        <button class="btn-primary" data-action="backup-copy">Copy</button>
        <button class="btn-ghost" data-action="backup-download">Download .json</button>
      </div>` : ''}
    ${ui.backupView === 'import' ? `
      <textarea class="backup-area" id="backup-in" placeholder="Paste your backup JSON here…"></textarea>
      <button class="btn-primary" data-action="backup-restore">Restore from backup</button>` : ''}
  </div>

  <div class="section-title">Spread the word</div>
  <a class="card invite-link" href="./pitch.html">
    <div><div class="invite-title">📣 Invite someone</div><div class="muted-note">Open the shareable invite deck — 9 slides for WhatsApp / Instagram.</div></div>
    <div class="btn-ghost">Open →</div>
  </a>

  <button class="btn-danger" data-action="delete-profile" data-id="${p.id}">Delete this profile</button>
  `;
}

// ---- render + router -------------------------------------------------------
const NAV_ITEMS = [
  ['/home', '🏠', 'Home'], ['/log', '➕', 'Log'], ['/stats', '📊', 'Stats'],
  ['/library', '📚', 'Library'], ['/profile', '👤', 'Profile'],
];

function renderNav(active) {
  nav().innerHTML = NAV_ITEMS.map(([href, icon, label]) =>
    `<a class="navitem ${active.startsWith(href) ? 'on' : ''}" href="#${href}"><span>${icon}</span>${label}</a>`).join('');
  nav().style.display = '';
}

export function render() {
  const s = S.get();
  if (!s.ready) return;
  const r = route();

  if (!s.profiles.length) { app().innerHTML = screenOnboarding(); nav().style.display = 'none'; window.scrollTo(0, 0); return; }

  let html;
  if (r.startsWith('/quest')) html = screenQuest();
  else if (r.startsWith('/log')) html = screenLog();
  else if (r.startsWith('/stats')) html = screenStats();
  else if (r.startsWith('/library')) html = screenLibrary();
  else if (r.startsWith('/exercise/')) html = screenExercise(r.split('/')[2].split('?')[0]);
  else if (r.startsWith('/profile')) html = screenProfile();
  else html = screenHome();

  app().innerHTML = html;
  renderNav(r);
  if (r.startsWith('/log')) updateLogPreview();
  window.scrollTo(0, 0);
}

function updateLogPreview() {
  if (ui.logType === 'gym') {
    const gx = gymResolve(document.getElementById('gym-name')?.value);
    const unit = gx ? (gx.unit || 'reps') : 'reps';
    const lbl = document.getElementById('gym-amt-label');
    if (lbl) lbl.textContent = unit === 'seconds' ? 'Seconds' : 'Reps';
    const sets = parseInt(document.getElementById('gym-sets')?.value) || 0;
    const amt = parseInt(document.getElementById('gym-amt')?.value) || 0;
    const weight = parseFloat(document.getElementById('gym-weight')?.value) || 0;
    const mEl = document.getElementById('gym-muscles');
    if (mEl) mEl.innerHTML = gx ? muscleChips(gx.muscles) : '<span class="muted-note">Start typing and pick an exercise…</span>';
    const xpEl = document.getElementById('xp-preview');
    if (xpEl) xpEl.textContent = '+' + (gx ? gymEntryXp(buildEntry(gx, weight, sets, amt, ui.gymEffort)) : 0);
    return;
  }
  const el = document.getElementById('xp-preview');
  if (el) el.textContent = '+' + logPreviewXp();
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

function celebrate(xp, rating) {
  const o = document.createElement('div');
  o.className = 'celebrate';
  o.innerHTML = `<div class="celebrate-card"><div class="cel-burst">⚡</div><div class="cel-xp">+${xp} XP</div><div class="cel-rate rating-${rating.tier}">${rating.label}</div></div>`;
  document.body.appendChild(o);
  requestAnimationFrame(() => o.classList.add('show'));
  setTimeout(() => { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }, 1600);
}

// ---- event handling --------------------------------------------------------
async function onClick(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;

  switch (action) {
    case 'set-tier': ui.selectedTier = t.dataset.tier; render(); break;

    case 'generate': {
      const p = S.activeProfile();
      const q = generateQuest(p, S.get().quests, S.get().logs, ui.selectedTier);
      await S.savePendingQuest(q);
      location.hash = '#/quest';
      break;
    }
    case 'regenerate': {
      const p = S.activeProfile();
      const cur = S.pendingQuest();
      const avoid = new Set((cur ? cur.exercises : []).map(e => e.exerciseId));
      const q = generateQuest(p, S.get().quests, S.get().logs, cur ? cur.tier : ui.selectedTier, Date.now(), { avoid, jitter: true });
      await S.savePendingQuest(q);
      render();
      break;
    }
    case 'swap-exercise': {
      const p = S.activeProfile();
      const q = S.pendingQuest();
      if (!q) break;
      const i = parseInt(t.dataset.i);
      const item = swapExercise(p, q.exercises, i, q.tier, S.get().quests, S.get().logs);
      if (!item) { toast('No alternative available for that one'); break; }
      q.exercises[i] = item;
      q.estMinutes = estMinutes(q.exercises, q.rounds);
      await S.persistQuest(q);
      render();
      break;
    }
    case 'complete-quest': {
      const q = S.pendingQuest();
      await S.completeQuest(t.dataset.id);
      const { quests, logs } = S.get();
      const todayXp = xpForDay(quests, logs, dayKey());
      if (q) celebrate(q.xp, dayRating(todayXp));
      location.hash = '#/home';
      break;
    }
    case 'set-log-type': ui.logType = t.dataset.type; render(); break;

    case 'save-log': await saveLog(); break;

    // ---- gym session builder ----
    case 'set-effort':
      ui.gymEffort = t.dataset.effort;
      document.querySelectorAll('#effort-row .effort-pill').forEach(p => p.classList.toggle('on', p.dataset.effort === ui.gymEffort));
      updateLogPreview();
      break;
    case 'add-entry': {
      const gx = gymResolve(document.getElementById('gym-name').value);
      if (!gx) { toast('Pick an exercise from the list, or create a custom one'); break; }
      const sets = parseInt(document.getElementById('gym-sets').value) || 0;
      const amt = parseInt(document.getElementById('gym-amt').value) || 0;
      const weight = parseFloat(document.getElementById('gym-weight').value) || 0;
      ui.session.push(buildEntry(gx, weight, sets, amt, ui.gymEffort));
      render();
      break;
    }
    case 'remove-entry': ui.session.splice(parseInt(t.dataset.i), 1); if (ui.editingIndex !== null) ui.editingIndex = null; render(); break;
    case 'set-add-mode': ui.addMode = t.dataset.mode; render(); break;
    case 'toggle-qa-muscles': ui.qaMusclesOpen = !ui.qaMusclesOpen; render(); break;
    case 'cycle-muscle': {
      const m = t.dataset.m, cur = ui.customMuscles[m];
      const next = cur === undefined ? 'primary' : cur === 'primary' ? 'secondary' : undefined;
      if (next) ui.customMuscles[m] = next; else delete ui.customMuscles[m];
      t.className = 'mtag ' + (next || '');
      break;
    }
    case 'set-custom-unit': {
      ui.customUnit = t.dataset.u;
      document.querySelectorAll('[data-action="set-custom-unit"]').forEach(p => p.classList.toggle('on', p.dataset.u === ui.customUnit));
      const lbl = document.getElementById('qa-amt-label'); if (lbl) lbl.textContent = ui.customUnit === 'seconds' ? 'Seconds' : 'Reps';
      break;
    }
    case 'add-free': {
      const name = document.getElementById('qa-name').value.trim();
      if (!name) { toast('Give it a name'); break; }
      const desc = document.getElementById('qa-desc').value.trim();
      const sets = parseInt(document.getElementById('qa-sets').value) || 0;
      const amt = parseInt(document.getElementById('qa-amt').value) || 0;
      const weight = parseFloat(document.getElementById('qa-weight').value) || 0;
      const muscles = {};
      for (const [m, st] of Object.entries(ui.customMuscles)) muscles[m] = st === 'primary' ? 1.0 : 0.5;
      ui.session.push(buildFreeEntry(name, desc, ui.customUnit, sets, amt, weight, ui.gymEffort, muscles));
      if (document.getElementById('qa-save')?.checked) { await S.addCustomExercise({ name, muscles, unit: ui.customUnit }); }
      ui.customMuscles = {}; ui.qaMusclesOpen = false;
      render();
      break;
    }
    case 'edit-entry': {
      ui.editingIndex = parseInt(t.dataset.i);
      ui.editEffort = ui.session[ui.editingIndex]?.effort || 'hard';
      render();
      break;
    }
    case 'set-edit-effort':
      ui.editEffort = t.dataset.effort;
      document.querySelectorAll('#edit-effort-row .effort-pill').forEach(p => p.classList.toggle('on', p.dataset.effort === ui.editEffort));
      break;
    case 'cancel-edit': ui.editingIndex = null; render(); break;
    case 'commit-edit': {
      const e = ui.session[parseInt(t.dataset.i)]; if (!e) break;
      e.sets = Math.max(1, parseInt(document.getElementById('edit-sets').value) || 0);
      const amt = Math.max(1, parseInt(document.getElementById('edit-amt').value) || 0);
      if (e.unit === 'seconds') e.seconds = amt; else e.reps = amt;
      e.weight = parseFloat(document.getElementById('edit-weight').value) || 0;
      e.effort = ui.editEffort;
      ui.editingIndex = null;
      render();
      break;
    }
    case 'load-program': {
      const p = S.get().programs.find(x => x.id === t.dataset.id);
      if (p) { ui.session = p.exercises.map(e => ({ ...e })); ui.sessionName = p.name; ui.loadedProgramId = p.id; ui.editingIndex = null; render(); }
      break;
    }
    case 'load-preset': {
      const preset = STARTER_PROGRAMS.find(x => x.id === t.dataset.id);
      if (preset) {
        ui.session = preset.exercises
          .map(e => { const gx = gymExerciseById(e.ref); return gx ? buildEntry(gx, e.weight, e.sets, e.reps ?? e.seconds, e.effort) : null; })
          .filter(Boolean);
        ui.sessionName = preset.name; ui.loadedProgramId = null; ui.editingIndex = null;
        render();
      }
      break;
    }
    case 'save-program': {
      if (!ui.session.length) break;
      const name = (prompt('Name this program', ui.sessionName || 'My Program') || '').trim();
      if (!name) break;
      const rec = await S.saveProgram(name, ui.session.map(e => ({ ...e })));
      ui.sessionName = name; ui.loadedProgramId = rec.id;
      toast('Program saved');
      render();
      break;
    }
    case 'update-program': {
      if (!ui.loadedProgramId || !ui.session.length) break;
      await S.updateProgram(ui.loadedProgramId, ui.sessionName, ui.session.map(e => ({ ...e })));
      toast('Program updated');
      render();
      break;
    }
    case 'log-session': {
      if (!ui.session.length) break;
      const name = ui.sessionName || 'Session';
      const entries = ui.session.map(e => ({ ...e, xp: gymEntryXp(e) }));
      const xp = gymSessionXp(entries);
      const anyMuscle = entries.some(e => Object.keys(e.muscles || {}).length);
      await S.addLog({ kind: 'gym', subtype: 'session', name, entries, xp, minutes: gymSessionMinutes(entries), icon: anyMuscle ? '🏋️' : '🧘', label: name, metric: null });
      ui.session = []; ui.sessionName = ''; ui.loadedProgramId = null; ui.editingIndex = null;
      celebrate(xp, dayRating(xpForDay(S.get().quests, S.get().logs, dayKey())));
      location.hash = '#/home';
      break;
    }

    case 'switch-profile': if (t.dataset.id !== S.get().activeId) await S.setActive(t.dataset.id); location.hash = '#/home'; break;
    case 'new-profile': ui.creatingProfile = true; render(); break;
    case 'create-profile': await saveProfile(true); break;
    case 'update-profile': await saveProfile(false); break;
    case 'backup-export':
      ui.backupText = JSON.stringify(await S.exportData());
      ui.backupView = 'export';
      render();
      break;
    case 'backup-import':
      ui.backupView = ui.backupView === 'import' ? null : 'import';
      render();
      break;
    case 'backup-copy':
      try { await navigator.clipboard.writeText(document.getElementById('backup-out').value); toast('Backup copied to clipboard'); }
      catch (e) { document.getElementById('backup-out').select(); toast('Select all and copy'); }
      break;
    case 'backup-download': {
      const blob = new Blob([ui.backupText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `summer-quest-backup-${dayKey()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
    case 'backup-restore': {
      const raw = document.getElementById('backup-in').value.trim();
      if (!raw) { toast('Paste a backup first'); break; }
      try {
        await S.importData(JSON.parse(raw));
        ui.backupView = null;
        toast('Backup restored');
        location.hash = '#/home';
      } catch (e) { toast('Could not read that backup'); }
      break;
    }

    case 'delete-profile':
      if (confirm('Delete this profile and all its data? This cannot be undone.')) {
        await S.deleteProfile(t.dataset.id); ui.creatingProfile = false; location.hash = '#/home';
      }
      break;
  }
}

async function saveLog() {
  const type = ui.logType, isSport = type === 'sport';
  const mins = Math.max(1, parseInt(document.getElementById('log-minutes').value) || 0);
  let log;
  if (isSport) {
    const sub = document.getElementById('log-sport').value;
    ui.sport = sub;
    const s = SPORTS[sub];
    log = { kind: 'sport', subtype: sub, minutes: mins, xp: activityXp('sport', sub, null, mins), label: s.name, icon: s.icon, metric: null };
  } else {
    const def = ACTIVITY_TYPES[type];
    const intensity = document.getElementById('log-intensity').value;
    const distEl = document.getElementById('log-distance');
    const distance = distEl && distEl.value ? parseFloat(distEl.value) : null;
    log = { kind: def.kind, subtype: type, intensity, minutes: mins, xp: activityXp(def.kind, type, intensity, mins), label: def.name, icon: def.icon, metric: def.metric, distance };
  }
  await S.addLog(log);
  toast(`Logged ${log.label} · +${log.xp} XP`);
  location.hash = '#/home';
}

async function saveProfile(isNew) {
  const name = document.getElementById('pf-name').value.trim() || 'Quester';
  const goal = document.getElementById('pf-goal').value;
  const location_ = document.getElementById('pf-loc').value;
  const level = parseInt(document.getElementById('pf-level').value) || 2;
  const equipment = [...document.querySelectorAll('.pf-equip:checked')].map(c => c.value);
  if (isNew) {
    await S.createProfile({ name, goal, location: location_, level, equipment });
    ui.creatingProfile = false;
    location.hash = '#/home';
  } else {
    await S.updateProfile({ name, goal, location: location_, level, equipment });
    toast('Profile saved');
    render();
  }
}

export function bindEvents() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', (e) => {
    if (e.target.closest('[data-live]') && route().startsWith('/log')) updateLogPreview();
    if (e.target.classList.contains('pf-equip')) e.target.closest('.equip')?.classList.toggle('on', e.target.checked);
  });
  window.addEventListener('hashchange', () => { ui.creatingProfile = false; ui.backupView = null; ui.editingIndex = null; render(); });
  S.subscribe(render);
}
