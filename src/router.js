/**
 * router.js — Enrutador por hash minimalista.
 * Cada handler devuelve un HTMLElement o { element, cleanup }.
 * `cleanup` se ejecuta al abandonar la ruta (p. ej. liberar la escena 3D).
 */

import { clear } from './utils/helpers.js';

const routes = [];
let outlet = null;
let currentCleanup = null;

function compile(pattern) {
  const keys = [];
  const rx = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === '/' ? m : '\\' + m))
    .replace(/:([A-Za-z0-9_]+)/g, (_, k) => {
      keys.push(k);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${rx}$`), keys };
}

export function addRoute(pattern, handler, opts = {}) {
  routes.push({ pattern, handler, opts, ...compile(pattern) });
}

export function navigate(hash) {
  if ((location.hash || '#/') === hash) render();
  else location.hash = hash;
}

function parseHash() {
  let h = location.hash || '#/';
  if (h === '#' || h === '') h = '#/';
  const [path] = h.split('?');
  return path;
}

async function render() {
  const path = parseHash();
  let matched = null;
  let params = {};
  for (const r of routes) {
    const m = r.regex.exec(path);
    if (m) {
      matched = r;
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      break;
    }
  }

  // Ejecuta limpieza de la vista anterior.
  if (currentCleanup) {
    try { currentCleanup(); } catch { /* no-op */ }
    currentCleanup = null;
  }
  clear(outlet);

  if (!matched) {
    outlet.append(notFound());
    window.scrollTo(0, 0);
    return;
  }

  const result = await matched.handler(params, outlet);
  if (result == null) return;
  if (result instanceof Node) {
    outlet.appendChild(result);
  } else if (result.element) {
    outlet.appendChild(result.element);
    currentCleanup = result.cleanup || null;
  }
  // Enfoca el contenido principal para accesibilidad (sin saltar el scroll bruscamente).
  if (!matched.opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  outlet.focus?.({ preventScroll: true });
}

export function startRouter(mountOutlet) {
  outlet = mountOutlet;
  window.addEventListener('hashchange', render);
  render();
}

function notFound() {
  const wrap = document.createElement('section');
  wrap.className = 'view view--center';
  wrap.innerHTML = `
    <div class="empty-state">
      <h1>Página no encontrada</h1>
      <p>La ruta solicitada no existe.</p>
      <a class="btn btn--primary" href="#/">Volver al inicio</a>
    </div>`;
  return wrap;
}
