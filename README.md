# ☀️ Summer Quest

A fitness **RPG for high-free-time periods** (summer, travel, breaks). Instead of scheduled workouts, you accumulate movement through short **quests** (2–20 min) and by logging swims, sports, runs and walks. An intelligent recovery + volume engine generates each quest and **explains why** it chose it.

Built as an **installable PWA** — mobile-first, offline-capable, with **on-device multi-profile** storage (IndexedDB, no login). The schema is profile-keyed throughout so it can sync to a backend later.

## Run it

It's a static app — any static file server works. From this folder:

```bash
python3 -m http.server 8124
```

Then open **http://localhost:8124** in a browser.

> It must be served over `http(s)` (not opened as a `file://` path) because it uses ES modules + a service worker.

## Put it on your iPhone

1. Run the server on your Mac (above), and make sure your iPhone is on the **same Wi‑Fi**.
2. Find your Mac's IP: System Settings → Wi‑Fi → Details → IP address (e.g. `192.168.1.42`).
3. On your iPhone open **Safari** → `http://192.168.1.42:8124`.
4. Tap **Share → Add to Home Screen**. It launches full-screen like a native app, with its own icon.

(For an always-on install independent of your Mac, deploy the folder to any static host — Netlify, Vercel, GitHub Pages, Cloudflare Pages — and add that URL to your Home Screen instead.)

## How the "intelligence" works

Completed quests and logged activities are the **source of truth**. Everything else is derived from that event history, which is why the app can always explain itself:

- **Recovery engine** (`js/engine.js`) — every exercise/activity adds *fatigue load* to the 10 tracked muscle groups; fatigue decays exponentially (≈30 h half-life). A hard swim raises shoulder/back fatigue; volleyball raises shoulders/calves/conditioning.
- **Effective-rep volume** — rolling 7/30-day reps-per-muscle ledger (swimming contributes partial *pull* volume).
- **Quest generator** — scores each muscle group by *freshness × under-training*, penalises sore groups, maps the winners to exercise categories, picks the variation matching your level + equipment, and writes a reason citing real numbers (e.g. *"…you've logged 107 effective reps for your back but only 2 for your calves…"*).

## Project layout

```
index.html              app shell
styles.css              all styling + demo animation keyframes
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline cache)
icon.svg / icon-maskable.svg
js/
  data.js     muscles, full exercise catalog, activities, sports, equipment
  db.js       IndexedDB wrapper (profiles / quests / logs / meta)
  engine.js   recovery, volume, XP, ratings, quest generator
  state.js    active profile + history, persistence, pub/sub
  ui-svg.js   muscle-overlay body map + animated exercise demos
  ui.js       hash router + all screens + interactions
  main.js     bootstrap
```

## Swapping in real exercise videos

Each exercise in `js/data.js` is one object. Add a `media` URL field and render it in the exercise cards (`ex-demo` in `js/ui.js`) in place of `demoSVG(...)` — the rest of the app is unaffected.

## Future features (from the brief, not yet built)

Apple Health / Watch integration, GPS detection, friend leaderboards, daily random challenges, seasonal events, AI coach personality, and the various "modes" (beach / hiking / winter / strength / endurance).
