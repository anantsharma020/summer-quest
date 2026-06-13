// Bootstrap: register the service worker, init state, wire up the UI.
import * as S from './state.js';
import { render, bindEvents } from './ui.js';

async function boot() {
  bindEvents();
  await S.init();
  render();

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./sw.js'); } catch (e) { /* offline support optional */ }
  }
}

boot();
