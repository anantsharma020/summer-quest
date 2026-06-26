// ============================================================================
// Generated visuals:
//   bodyMap(values, mode)  — front + back muscle diagram. Two modes:
//       'highlight' (weights 0..1 -> primary red / secondary orange)
//       'heat'      (fatigue 0..100 -> green->amber->red)
//   demoSVG(pattern)       — looping animated stick-figure demo per movement.
// Animation keyframes live in styles.css (classes prefixed `anim-`).
// ============================================================================

// --- colour helpers ---------------------------------------------------------
function hexLerp(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
function heatColor(v) {
  const t = Math.max(0, Math.min(1, v / 100));
  return t < 0.5 ? hexLerp('#2fbf71', '#ffc24b', t * 2) : hexLerp('#ffc24b', '#ff4d56', (t - 0.5) * 2);
}
function highlightColor(w) {
  if (w >= 0.6) return '#ff4d56';
  if (w >= 0.25) return '#ff9f40';
  return null; // inactive -> base
}
const BASE = 'var(--muscle-base)';

// --- muscle region geometry -------------------------------------------------
// Each muscle maps to one or more shapes on the front (fx) or back (bx) figure.
const FRONT_X = 0, BACK_X = 140;
function blob(cx, cy, rx, ry) { return { cx, cy, rx, ry }; }

const REGIONS = {
  // front figure
  shoulders: { fig: 'f', shapes: [blob(46, 50, 9, 7), blob(94, 50, 9, 7)] },
  chest:     { fig: 'f', shapes: [blob(62, 58, 9, 7), blob(78, 58, 9, 7)] },
  biceps:    { fig: 'f', shapes: [blob(41, 70, 6, 11), blob(99, 70, 6, 11)] },
  core:      { fig: 'f', shapes: [blob(70, 90, 11, 16)] },
  quads:     { fig: 'f', shapes: [blob(61, 132, 8, 21), blob(79, 132, 8, 21)] },
  calves:    { fig: 'f', shapes: [blob(61, 172, 7, 15), blob(79, 172, 7, 15)] },
  // back figure
  back:       { fig: 'b', shapes: [blob(62, 62, 11, 18), blob(78, 62, 11, 18)] },
  triceps:    { fig: 'b', shapes: [blob(41, 70, 6, 11), blob(99, 70, 6, 11)] },
  glutes:     { fig: 'b', shapes: [blob(62, 110, 9, 9), blob(78, 110, 9, 9)] },
  hamstrings: { fig: 'b', shapes: [blob(61, 140, 8, 18), blob(79, 140, 8, 18)] },
};

function silhouette(ox) {
  return `
    <circle cx="${ox + 70}" cy="22" r="13"/>
    <rect x="${ox + 52}" y="38" width="36" height="68" rx="14"/>
    <rect x="${ox + 35}" y="44" width="13" height="58" rx="6"/>
    <rect x="${ox + 92}" y="44" width="13" height="58" rx="6"/>
    <rect x="${ox + 53}" y="104" width="15" height="86" rx="7"/>
    <rect x="${ox + 72}" y="104" width="15" height="86" rx="7"/>`;
}

export function bodyMap(values = {}, mode = 'highlight', opts = {}) {
  const shapesMarkup = [];
  for (const [muscle, def] of Object.entries(REGIONS)) {
    const ox = def.fig === 'f' ? FRONT_X : BACK_X;
    const v = values[muscle];
    let fill = BASE;
    if (v != null) {
      fill = mode === 'heat' ? heatColor(v) : (highlightColor(v) || BASE);
    }
    for (const s of def.shapes) {
      shapesMarkup.push(`<ellipse cx="${ox + s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${fill}"/>`);
    }
  }
  const labels = opts.labels
    ? `<text x="70" y="208" class="bm-label">Front</text><text x="210" y="208" class="bm-label">Back</text>`
    : '';
  return `<svg class="bodymap" viewBox="0 0 280 214" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="muscle map">
    <g class="bm-sil">${silhouette(FRONT_X)}${silhouette(BACK_X)}</g>
    ${shapesMarkup.join('')}
    ${labels}
  </svg>`;
}

// Build a highlight value map from an exercise's muscle weights.
export function muscleHighlight(muscles) {
  const out = {};
  for (const [m, w] of Object.entries(muscles)) out[m] = w;
  return out;
}

// --- animated exercise demos ------------------------------------------------
const G = '<line class="demo-ground" x1="8" y1="84" x2="112" y2="84"/>';
const F = 'class="demo-fig"';

const DEMOS = {
  pushup: `${G}<g class="anim-bob" ${F}>
    <circle cx="32" cy="50" r="6"/>
    <line x1="38" y1="54" x2="88" y2="66"/>
    <line x1="88" y1="66" x2="106" y2="82"/>
    <line x1="40" y1="55" x2="42" y2="82"/></g>`,

  pike: `${G}<g class="anim-bob" ${F}>
    <line x1="30" y1="82" x2="60" y2="40"/>
    <line x1="60" y1="40" x2="92" y2="82"/>
    <circle cx="56" cy="36" r="6"/>
    <line x1="30" y1="82" x2="44" y2="58"/></g>`,

  dip: `${G}<line class="demo-bar" x1="30" y1="48" x2="46" y2="48"/><line class="demo-bar" x1="74" y1="48" x2="90" y2="48"/>
    <g class="anim-bob" ${F}>
    <circle cx="60" cy="36" r="6"/>
    <line x1="60" y1="42" x2="60" y2="64"/>
    <line x1="60" y1="46" x2="40" y2="48"/><line x1="60" y1="46" x2="80" y2="48"/>
    <line x1="60" y1="64" x2="56" y2="80"/><line x1="60" y1="64" x2="64" y2="80"/></g>`,

  pull: `<line class="demo-bar" x1="34" y1="18" x2="86" y2="18"/>
    <g class="anim-pull" ${F}>
    <line x1="52" y1="20" x2="56" y2="34"/><line x1="68" y1="20" x2="64" y2="34"/>
    <circle cx="60" cy="42" r="6"/>
    <line x1="60" y1="48" x2="60" y2="66"/>
    <line x1="60" y1="66" x2="52" y2="82"/><line x1="60" y1="66" x2="68" y2="82"/></g>`,

  squat: `${G}<g class="anim-squat" ${F}>
    <circle cx="60" cy="32" r="6"/>
    <line x1="60" y1="38" x2="60" y2="58"/>
    <line x1="60" y1="42" x2="76" y2="40"/>
    <line x1="60" y1="58" x2="50" y2="70"/><line x1="50" y1="70" x2="50" y2="84"/>
    <line x1="60" y1="58" x2="70" y2="70"/><line x1="70" y1="70" x2="70" y2="84"/></g>`,

  lunge: `${G}<g class="anim-squat" ${F}>
    <circle cx="60" cy="32" r="6"/>
    <line x1="60" y1="38" x2="60" y2="58"/>
    <line x1="60" y1="58" x2="44" y2="70"/><line x1="44" y1="70" x2="44" y2="84"/>
    <line x1="60" y1="58" x2="76" y2="76"/><line x1="76" y1="76" x2="86" y2="84"/></g>`,

  wallsit: `${G}<line class="demo-bar" x1="40" y1="20" x2="40" y2="84"/>
    <g ${F}>
    <circle cx="52" cy="40" r="6"/>
    <line x1="46" y1="46" x2="46" y2="64"/>
    <line x1="46" y1="64" x2="72" y2="64"/><line x1="72" y1="64" x2="72" y2="84"/>
    <line x1="46" y1="46" x2="62" y2="50"/></g>`,

  jump: `${G}<g class="anim-jump" ${F}>
    <circle cx="60" cy="30" r="6"/>
    <line x1="60" y1="36" x2="60" y2="56"/>
    <line x1="60" y1="40" x2="46" y2="30"/><line x1="60" y1="40" x2="74" y2="30"/>
    <line x1="60" y1="56" x2="52" y2="74"/><line x1="60" y1="56" x2="68" y2="74"/></g>`,

  calf: `${G}<g class="anim-calf" ${F}>
    <circle cx="60" cy="34" r="6"/>
    <line x1="60" y1="40" x2="60" y2="60"/>
    <line x1="60" y1="44" x2="50" y2="56"/><line x1="60" y1="44" x2="70" y2="56"/>
    <line x1="60" y1="60" x2="54" y2="82"/><line x1="60" y1="60" x2="66" y2="82"/></g>`,

  plank: `${G}<g class="anim-breathe" ${F}>
    <circle cx="32" cy="60" r="6"/>
    <line x1="38" y1="62" x2="98" y2="70"/>
    <line x1="40" y1="63" x2="40" y2="80"/>
    <line x1="98" y1="70" x2="106" y2="80"/></g>`,

  hollow: `${G}<g class="anim-hollow" ${F}>
    <circle cx="40" cy="64" r="6"/>
    <line x1="46" y1="66" x2="72" y2="62"/>
    <line x1="46" y1="66" x2="30" y2="56"/>
    <line x1="72" y1="62" x2="92" y2="50"/></g>`,

  core: `${G}<circle cx="30" cy="72" r="6" class="demo-fig"/><line class="demo-fig" x1="36" y1="72" x2="66" y2="72"/>
    <g class="anim-legs" ${F}><line x1="66" y1="72" x2="92" y2="60"/></g>`,

  run: `${G}<g ${F}><circle cx="60" cy="34" r="6"/><line x1="60" y1="40" x2="60" y2="62"/>
    <line x1="60" y1="46" x2="48" y2="54" class="anim-run-b"/><line x1="60" y1="46" x2="72" y2="54" class="anim-run-a"/></g>
    <g ${F}><line x1="60" y1="62" x2="50" y2="82" class="anim-run-a"/><line x1="60" y1="62" x2="70" y2="82" class="anim-run-b"/></g>`,

  mobility: `${G}<g ${F}><circle cx="60" cy="36" r="6"/><line x1="60" y1="42" x2="60" y2="64"/>
    <line x1="60" y1="64" x2="52" y2="82"/><line x1="60" y1="64" x2="68" y2="82"/>
    <line x1="60" y1="46" x2="76" y2="40" class="anim-arm"/></g>`,
};

const PATTERN_MAP = {
  pushup: 'pushup', pike: 'pike', dip: 'dip',
  row: 'pull', hang: 'pull', pullup: 'pull',
  squat: 'squat', lunge: 'lunge', wallsit: 'wallsit', calf: 'calf',
  jump: 'jump', jumprope: 'jump', burpee: 'jump',
  plank: 'plank', superman: 'plank', crawl: 'plank',
  hollow: 'hollow', deadbug: 'core', legraise: 'core', bicycle: 'core',
  climber: 'run', run: 'run', mobility: 'mobility', deadbug2: 'core',
};

export function demoSVG(pattern) {
  const key = PATTERN_MAP[pattern] || 'squat';
  return `<svg class="demo" viewBox="0 0 120 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="exercise demo">${DEMOS[key]}</svg>`;
}
