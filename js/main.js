// Bootstrap: register the service worker, init state, wire up the UI.
import * as S from './state.js';
import { render, bindEvents } from './ui.js';

async function boot() {
  bindEvents();
  await S.init();
  render();

  // Ask the OS to keep our IndexedDB data (reduces the chance it gets evicted).
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* best effort */ }

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./sw.js'); } catch (e) { /* offline support optional */ }
  }
}

boot();
