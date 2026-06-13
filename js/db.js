// ============================================================================
// IndexedDB persistence layer.
// Stores (all keyed by profileId where relevant so the schema is multi-profile
// from day one and trivially syncable to a backend later):
//   profiles  — user profiles
//   quests    — generated + completed quests
//   logs      — logged activities (swim/sport/run/walk/mobility)
//   meta      — app-level key/value (e.g. activeProfileId)
// ============================================================================

const DB_NAME = 'summer-quest';
const DB_VERSION = 1;
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('quests')) {
        const s = db.createObjectStore('quests', { keyPath: 'id' });
        s.createIndex('profileId', 'profileId', { unique: false });
      }
      if (!db.objectStoreNames.contains('logs')) {
        const s = db.createObjectStore('logs', { keyPath: 'id' });
        s.createIndex('profileId', 'profileId', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode = 'readonly') {
  return openDB().then(db => db.transaction(store, mode).objectStore(store));
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---- generic helpers -------------------------------------------------------
export async function put(store, value) {
  const s = await tx(store, 'readwrite');
  await reqToPromise(s.put(value));
  return value;
}

export async function get(store, key) {
  const s = await tx(store);
  return reqToPromise(s.get(key));
}

export async function del(store, key) {
  const s = await tx(store, 'readwrite');
  return reqToPromise(s.delete(key));
}

export async function getAll(store) {
  const s = await tx(store);
  return reqToPromise(s.getAll());
}

export async function getAllByProfile(store, profileId) {
  const s = await tx(store);
  const idx = s.index('profileId');
  return reqToPromise(idx.getAll(profileId));
}

// ---- meta ------------------------------------------------------------------
export async function getMeta(key, fallback = null) {
  const row = await get('meta', key);
  return row ? row.value : fallback;
}
export async function setMeta(key, value) {
  return put('meta', { key, value });
}
