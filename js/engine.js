// ============================================================================
// Summer Quest engine: recovery (fatigue), weekly effective-rep volume,
// XP/ratings, and the explainable quest generator.
//
// Design note: completed quests and logged activities are the source of truth.
// Everything below (fatigue %, weekly volume per muscle, the reasons behind a
// quest) is *derived* from that event history, so it can always explain itself.
// ============================================================================

import {
  MUSCLE_IDS, CATEGORIES, EXERCISES, CHAINS, exerciseById,
  ACTIVITY_TYPES, SPORTS, muscleName, effortById,
} from './data.js';

const HOUR = 3600 * 1000;
const FATIGUE_HALF_LIFE_H = 30;      // muscle fatigue half-life in hours
const QUEST_FATIGUE_K = 2.2;         // load per unit of quest volume
const ACTIVITY_FATIGUE_K = 1.4;      // load per (weight x minute) of activity
const GYM_FATIGUE_K = 2.0;           // load per (rep x muscle-weight) of gym work
const GYM_XP_K = 2.75;               // calibrated so a hard ~1hr session ≈ 100 XP
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// How much total muscle an exercise recruits (proxy for how taxing a set is):
// a deadlift recruits far more than a curl, so it earns more per set.
const recruitment = (muscles) =>
  Math.min(3.5, Object.entries(muscles || {})
    .filter(([m]) => MUSCLE_IDS.includes(m))
    .reduce((s, [, w]) => s + w, 0));

// Volume of one set, normalised toward bodyweight reps (holds: seconds/5).
const setVolume = (entry) =>
  entry.unit === 'seconds' ? (entry.seconds || 0) / 5 : (entry.reps || 0);

// XP for one gym entry: effort × recruitment × volume, weight-independent.
export function gymEntryXp(entry) {
  const R = recruitment(entry.muscles);
  const eff = effortById(entry.effort).xp;
  const repF = entry.unit === 'seconds'
    ? clamp((entry.seconds || 0) / 45, 0.6, 1.6)
    : clamp((entry.reps || 0) / 10, 0.6, 1.6);
  return Math.max(3, Math.round(GYM_XP_K * (entry.sets || 0) * R * eff * repF));
}

export const gymSessionXp = (entries) =>
  (entries || []).reduce((s, e) => s + gymEntryXp(e), 0);

// Rough duration estimate for a logged gym session (for weekly-minutes stats).
export const gymSessionMinutes = (entries) =>
  Math.max(1, Math.round((entries || []).reduce((s, e) =>
    s + (e.sets || 0) * (e.unit === 'seconds' ? (e.seconds || 0) / 60 + 0.5 : (e.reps || 0) * 0.05 + 0.75), 0)));

// --------------------------------------------------------------------------
// Date helpers (local time).
// --------------------------------------------------------------------------
export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const zeroMuscles = () => Object.fromEntries(MUSCLE_IDS.map(m => [m, 0]));

// Convert a performed amount into a comparable "volume" number.
function repEquivalent(unit, amount) {
  if (unit === 'reps_each') return amount * 2;
  if (unit === 'seconds') return amount / 4;
  return amount; // reps
}

// --------------------------------------------------------------------------
// Turn raw history (completed quests + logs) into a flat list of effort
// events: { time, fatigue:{muscle:load}, reps:{muscle:effectiveReps} }.
// --------------------------------------------------------------------------
export function effortEvents(quests, logs) {
  const events = [];

  for (const q of quests) {
    if (q.status !== 'completed' || !q.completedAt) continue;
    const time = new Date(q.completedAt).getTime();
    const fatigue = {}, reps = {};
    for (const item of q.exercises) {
      const ex = exerciseById(item.exerciseId);
      if (!ex) continue;
      const vol = repEquivalent(ex.unit, item.amount);
      for (const [m, w] of Object.entries(ex.muscles)) {
        if (!MUSCLE_IDS.includes(m)) continue; // skip 'conditioning'
        fatigue[m] = (fatigue[m] || 0) + vol * w * QUEST_FATIGUE_K;
        reps[m] = (reps[m] || 0) + vol * w;
      }
    }
    events.push({ time, fatigue, reps, source: 'quest' });
  }

  for (const l of logs) {
    const time = new Date(l.createdAt).getTime();
    const fatigue = {}, reps = {};

    // Gym session: each entry contributes effective reps + effort-scaled
    // fatigue per muscle. Effort (not weight) drives how taxing it was.
    if (l.kind === 'gym') {
      for (const e of (l.entries || [])) {
        const base = (e.sets || 0) * setVolume(e);
        const effMult = effortById(e.effort).fatigue;
        for (const [m, w] of Object.entries(e.muscles || {})) {
          if (!MUSCLE_IDS.includes(m)) continue;
          reps[m] = (reps[m] || 0) + base * w;
          fatigue[m] = (fatigue[m] || 0) + base * w * GYM_FATIGUE_K * effMult;
        }
      }
      events.push({ time, fatigue, reps, source: 'activity', log: l });
      continue;
    }

    const def = l.kind === 'sport' ? SPORTS[l.subtype] : ACTIVITY_TYPES[l.subtype];
    let fmap = {};
    if (l.kind === 'sport') fmap = def ? def.fatigue : {};
    else if (def && def.intensities[l.intensity]) fmap = def.intensities[l.intensity].fatigue;
    const mins = l.minutes || 0;
    for (const [m, w] of Object.entries(fmap)) {
      if (!MUSCLE_IDS.includes(m)) continue;
      fatigue[m] = (fatigue[m] || 0) + w * mins * ACTIVITY_FATIGUE_K;
    }
    // Swimming contributes partial pull (back/shoulder) volume.
    if (l.subtype === 'swim' && l.intensity !== 'easy') {
      const k = l.intensity === 'hard' ? 2.4 : 1.4;
      reps.back = (reps.back || 0) + mins * k;
      reps.shoulders = (reps.shoulders || 0) + mins * k * 0.5;
    }
    events.push({ time, fatigue, reps, source: 'activity', log: l });
  }

  return events;
}

// --------------------------------------------------------------------------
// Current fatigue per muscle (0-100), with exponential recovery decay.
// --------------------------------------------------------------------------
export function currentFatigue(events, now = Date.now()) {
  const out = zeroMuscles();
  for (const ev of events) {
    const hrs = (now - ev.time) / HOUR;
    if (hrs < 0) continue;
    const decay = Math.pow(0.5, hrs / FATIGUE_HALF_LIFE_H);
    for (const [m, load] of Object.entries(ev.fatigue)) {
      out[m] += load * decay;
    }
  }
  for (const m of MUSCLE_IDS) out[m] = Math.min(100, Math.round(out[m]));
  return out;
}

// --------------------------------------------------------------------------
// Effective reps per muscle over a rolling window (default 7 days).
// --------------------------------------------------------------------------
export function volumeWindow(events, days = 7, now = Date.now()) {
  const cutoff = now - days * 24 * HOUR;
  const out = zeroMuscles();
  for (const ev of events) {
    if (ev.time < cutoff) continue;
    for (const [m, r] of Object.entries(ev.reps || {})) out[m] += r;
  }
  for (const m of MUSCLE_IDS) out[m] = Math.round(out[m]);
  return out;
}

// --------------------------------------------------------------------------
// XP + daily rating.
// --------------------------------------------------------------------------
export const QUEST_XP = { micro: 10, standard: 20, challenge: 40 };

export function activityXp(kind, subtype, intensity, minutes) {
  let def, perMin;
  if (kind === 'sport') { def = SPORTS[subtype]; perMin = def ? def.xpPerMin : 1; }
  else { def = ACTIVITY_TYPES[subtype]; perMin = def && def.intensities[intensity] ? def.intensities[intensity].xpPerMin : 1; }
  let xp = Math.round(perMin * (minutes || 0));
  // Clamp to the spec's stated ranges.
  const ranges = { swim: [20, 60], run: [20, 50], walk: [10, 30], mobility: [10, 10], sport: [20, 80] };
  const r = kind === 'sport' ? ranges.sport : ranges[subtype];
  if (r) xp = Math.max(r[0], Math.min(r[1], xp || r[0]));
  return xp;
}

export const DAY_RATINGS = [
  { min: 150, label: 'Legendary Day', tier: 'legendary' },
  { min: 100, label: 'Adventure Day', tier: 'adventure' },
  { min: 50,  label: 'Great Day',     tier: 'great' },
  { min: 0,   label: 'Active',        tier: 'active' },
];
export function dayRating(xp) {
  return DAY_RATINGS.find(r => xp >= r.min) || DAY_RATINGS[DAY_RATINGS.length - 1];
}

// XP earned on a given day key from history.
export function xpForDay(quests, logs, key) {
  let xp = 0;
  for (const q of quests) if (q.status === 'completed' && q.completedAt && dayKey(q.completedAt) === key) xp += QUEST_XP[q.tier] || 0;
  for (const l of logs) if (dayKey(l.createdAt) === key) xp += l.xp || 0;
  return xp;
}

// Current activity streak: consecutive days (ending today or yesterday) with XP.
export function currentStreak(quests, logs) {
  const active = new Set();
  for (const q of quests) if (q.status === 'completed' && q.completedAt) active.add(dayKey(q.completedAt));
  for (const l of logs) active.add(dayKey(l.createdAt));
  let streak = 0;
  const d = new Date();
  if (!active.has(dayKey(d))) d.setDate(d.getDate() - 1); // allow today to be empty so far
  while (active.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// --------------------------------------------------------------------------
// Quest generation.
// --------------------------------------------------------------------------
const TIERS = {
  micro:     { name: 'Micro Quest',     slots: 2, rounds: 1, volMult: 0.8, time: '2–5 min' },
  standard:  { name: 'Standard Quest',  slots: 3, rounds: 2, volMult: 1.0, time: '5–10 min' },
  challenge: { name: 'Challenge Quest', slots: 4, rounds: 3, volMult: 1.3, time: '10–20 min' },
};

// Average fatigue of a category's primary muscles.
function categoryFatigue(catKey, fatigue) {
  const ms = CATEGORIES[catKey].muscles;
  if (!ms.length) return 0;
  return ms.reduce((s, m) => s + (fatigue[m] || 0), 0) / ms.length;
}

// Pick the exercise within a chain that matches the user's progression level,
// then bias the chosen category's exercises toward the targeted muscle.
// opts.avoid: ids to skip (e.g. the previous quest's). opts.jitter: when true,
// randomise among the top candidates so regenerate/swap give fresh variety.
function pickExercise(catKey, targetMuscle, fatigue, profile, used, opts = {}) {
  const level = profile.level || 2;
  const equip = new Set(profile.equipment || []);
  const usable = e => e.category === catKey && (e.equip || []).every(req => equip.has(req) || req === 'wall');

  let pool = EXERCISES.filter(e => usable(e) && !used.has(e.id) && !(opts.avoid && opts.avoid.has(e.id)));
  if (!pool.length) pool = EXERCISES.filter(e => usable(e) && !used.has(e.id)); // relax avoid
  if (!pool.length) pool = EXERCISES.filter(usable);
  if (!pool.length) return null;

  // Reduce to one representative per chain — the variation nearest the user's
  // level (variation progression), preferring moves that hit the target muscle.
  const byChain = {};
  for (const e of pool) {
    const key = e.chain || e.id;
    if (!byChain[key] || Math.abs(e.level - level) < Math.abs(byChain[key].level - level)) {
      byChain[key] = e;
    }
  }
  let candidates = Object.values(byChain);
  candidates.sort((a, b) => (b.muscles[targetMuscle] || 0) - (a.muscles[targetMuscle] || 0));

  if (opts.jitter && candidates.length > 1) {
    // Randomise among the strongest few candidates for the target muscle.
    const top = candidates.slice(0, Math.min(3, candidates.length));
    return top[Math.floor(Math.random() * top.length)];
  }
  return candidates[0] || null;
}

// Replace a single exercise in an existing quest with a fresh alternative from
// the same category (used by the per-exercise "swap" button).
export function swapExercise(profile, items, index, tier, quests, logs, now = Date.now()) {
  const fatigue = currentFatigue(effortEvents(quests, logs), now);
  const cur = exerciseById(items[index].exerciseId);
  if (!cur) return null;
  const used = new Set(items.map(it => it.exerciseId)); // exclude everything already in the quest
  const target = Object.entries(cur.muscles).sort((a, b) => b[1] - a[1])[0][0];
  const ex = pickExercise(cur.category, target, fatigue, profile, used, { jitter: true });
  return ex ? prescribe(ex, tier, profile) : null;
}

function prescribe(ex, tier, profile) {
  const level = profile.level || 2;
  const volMult = TIERS[tier].volMult * (0.8 + level * 0.1); // volume progression
  let amount = Math.round(ex.base * volMult);
  if (ex.unit === 'seconds') amount = Math.max(10, Math.round(amount / 5) * 5);
  else amount = Math.max(3, amount);
  return { exerciseId: ex.id, unit: ex.unit, amount };
}

export function estMinutes(items, rounds = 1) {
  let secs = 0;
  for (const it of items) {
    const ex = exerciseById(it.exerciseId);
    if (ex.unit === 'seconds') secs += it.amount + 20;
    else if (ex.unit === 'reps_each') secs += it.amount * 2 * 3 + 20;
    else secs += it.amount * 3 + 20;
  }
  return Math.max(2, Math.round(secs * rounds / 60));
}

// Subject-verb agreement: most muscle names are plural ("shoulders are"),
// but chest/back/core read as singular ("back is").
const verbFor = (name) => (name.endsWith('s') ? 'are' : 'is');

// Build the human-readable reason citing real numbers from history.
// `focusMuscles` are derived from the exercises actually chosen, so the
// explanation always matches the quest.
function buildReason(focusMuscles, fatigue, volume, events, now) {
  // Recent (last 40h) activities that drove fatigue.
  const recentActs = events
    .filter(e => e.source === 'activity' && (now - e.time) < 40 * HOUR && e.log)
    .sort((a, b) => b.time - a.time)   // most recent first
    .map(e => e.log);
  const actLabel = (l) => l.kind === 'gym'
    ? (l.name && !/session|workout|gym/i.test(l.name) ? l.name.toLowerCase() : 'gym')
    : l.label.toLowerCase();
  const actNames = [...new Set(recentActs.map(actLabel))];

  // Most-fatigued muscle group right now.
  const sorted = [...MUSCLE_IDS].sort((a, b) => fatigue[b] - fatigue[a]);
  const sore = sorted[0];
  const soreName = muscleName(sore).toLowerCase();

  // Volume imbalance: highest vs lowest weekly volume.
  const volSorted = [...MUSCLE_IDS].sort((a, b) => volume[b] - volume[a]);
  const high = volSorted[0], low = volSorted[volSorted.length - 1];

  const focusStr = focusMuscles.slice(0, 2).map(m => muscleName(m).toLowerCase()).join(' and ') || 'full-body movement';

  let parts = [];
  if (fatigue[sore] >= 45 && actNames.length) {
    parts.push(`Your ${soreName} ${verbFor(soreName)} still recovering from your recent ${actNames.slice(0, 2).join(' and ')} session`);
  } else if (fatigue[sore] >= 45) {
    parts.push(`Your ${soreName} ${verbFor(soreName)} carrying the most fatigue right now`);
  }

  if (volume[high] > 0 && volume[high] > volume[low] * 1.6) {
    parts.push(`this week you've logged ${volume[high]} effective reps for your ${muscleName(high).toLowerCase()} but only ${volume[low]} for your ${muscleName(low).toLowerCase()}`);
  }

  if (parts.length) {
    return capitalize(parts.join(', ')) + `, so today's quest focuses on ${focusStr}.`;
  }
  return `A balanced quest focused on ${focusStr} to keep your week well-rounded.`;
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

export function generateQuest(profile, quests, logs, tier = 'standard', now = Date.now(), opts = {}) {
  const events = effortEvents(quests, logs);
  const fatigue = currentFatigue(events, now);
  const volume = volumeWindow(events, 7, now);
  const jitter = opts.jitter !== false; // vary by default
  const avoid = opts.avoid || null;

  // Need score per muscle: fresh + under-trained => high priority.
  const maxVol = Math.max(1, ...MUSCLE_IDS.map(m => volume[m]));
  const need = {};
  for (const m of MUSCLE_IDS) {
    const freshness = 100 - fatigue[m];               // 0..100
    const underTrained = 100 * (1 - volume[m] / maxVol); // 0..100
    need[m] = freshness * 0.6 + underTrained * 0.4;
    if (fatigue[m] >= 75) need[m] -= 60;              // strongly avoid sore muscles
  }
  const targets = [...MUSCLE_IDS].sort((a, b) => need[b] - need[a]);

  // Rank categories by the need of their muscles, penalising fatigued primaries.
  const catScore = {};
  for (const cat of Object.keys(CATEGORIES)) {
    if (cat === 'mobility') { catScore[cat] = 0; continue; }
    const ms = CATEGORIES[cat].muscles;
    const avgNeed = ms.reduce((s, m) => s + need[m], 0) / ms.length;
    catScore[cat] = avgNeed - categoryFatigue(cat, fatigue) * 0.5 + (jitter ? Math.random() * 10 : 0);
  }
  const rankedCats = Object.keys(catScore).filter(c => c !== 'mobility')
    .sort((a, b) => catScore[b] - catScore[a]);

  const slots = TIERS[tier].slots;
  const items = [];
  const used = new Set();
  const usedCats = [];

  // If the body is broadly fatigued, lead with a mobility/recovery move.
  const avgFatigue = MUSCLE_IDS.reduce((s, m) => s + fatigue[m], 0) / MUSCLE_IDS.length;
  if (avgFatigue >= 60) {
    const mob = pickExercise('mobility', targets[0], fatigue, profile, used, { avoid, jitter });
    if (mob) { items.push(prescribe(mob, tier, profile)); used.add(mob.id); usedCats.push('mobility'); }
  }

  let ti = 0;
  while (items.length < slots) {
    // Choose a category: rotate through ranked list, avoid immediate repeats.
    let cat = rankedCats.find(c => !usedCats.includes(c));
    if (!cat) cat = rankedCats[ti % rankedCats.length];
    const target = CATEGORIES[cat].muscles
      .slice()
      .sort((a, b) => need[b] - need[a])[0] || targets[0];
    const ex = pickExercise(cat, target, fatigue, profile, used, { avoid, jitter });
    if (ex) { items.push(prescribe(ex, tier, profile)); used.add(ex.id); usedCats.push(cat); }
    ti++;
    if (ti > 20) break; // safety
  }

  // Focus muscles = the groups the chosen exercises actually train hardest.
  const focusTally = {};
  for (const it of items) {
    const ex = exerciseById(it.exerciseId);
    for (const [m, w] of Object.entries(ex.muscles)) {
      if (MUSCLE_IDS.includes(m) && w >= 0.5) focusTally[m] = (focusTally[m] || 0) + w;
    }
  }
  let focusMuscles = Object.keys(focusTally).sort((a, b) => focusTally[b] - focusTally[a]);
  if (!focusMuscles.length) focusMuscles = targets.filter(t => fatigue[t] < 75).slice(0, 2);
  const reason = buildReason(focusMuscles, fatigue, volume, events, now);

  const rounds = TIERS[tier].rounds;
  return {
    tier,
    tierName: TIERS[tier].name,
    estTime: TIERS[tier].time,
    rounds,
    estMinutes: estMinutes(items, rounds),
    xp: QUEST_XP[tier],
    exercises: items,
    reason,
    fatigueSnapshot: fatigue,
    volumeSnapshot: volume,
  };
}

export { TIERS };
