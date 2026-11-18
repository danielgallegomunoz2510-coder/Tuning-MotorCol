/**
 * helpers.js — Utilidades generales de DOM, validación y varios.
 */

import { CIUDADES_POR_DEPARTAMENTO } from '../data/colombia.js';

/** Crea un elemento con atributos y/o hijos de forma concisa. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'for') node.htmlFor = v;
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/** Vacía un contenedor DOM. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Genera un id corto y único. */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Clona profundo (JSON-safe). */
export function deepClone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

/** Comparación profunda JSON-safe. */
export function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Debounce simple. */
export function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- Validaciones (registro Colombia) ---------- */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/**
 * Valida un celular colombiano.
 * Acepta: "+57 300 123 4567", "300 123 4567", "3001234567", con espacios/guiones.
 * Regla: 10 dígitos que empiezan por 3 (opcionalmente precedidos por 57 o +57).
 */
export function isValidColombianPhone(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const local = digits.startsWith('57') && digits.length === 12 ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local);
}

/** Normaliza el celular a formato "+57 3XX XXX XXXX". */
export function normalizeColombianPhone(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const local = digits.startsWith('57') && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^3\d{9}$/.test(local)) return String(phone || '').trim();
  return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** Fuerza de contraseña básica: mínimo 6 caracteres. */
export function isValidPassword(pw) {
  return typeof pw === 'string' && pw.length >= 6;
}

/** Escapa HTML para inserción segura en textos. */
export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/** Convierte "#RRGGBB" a entero 0xRRGGBB. */
export function hexToInt(hex) {
  return parseInt(String(hex).replace('#', ''), 16) || 0;
}

/** Fecha legible en español. */
export function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export const DEPARTAMENTOS = Object.keys(CIUDADES_POR_DEPARTAMENTO);

export function ciudadesDe(departamento) {
  return CIUDADES_POR_DEPARTAMENTO[departamento] || [];
}

/** Rellena un <select> conservando el valor si sigue siendo válido. */
export function fillSelect(select, items, { placeholder = 'Selecciona…', selected = '', disabled = false } = {}) {
  const keep = selected && items.includes(selected) ? selected : '';
  select.replaceChildren();
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  select.append(ph);
  for (const v of items) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === keep) opt.selected = true;
    select.append(opt);
  }
  select.disabled = disabled;
  if (keep) select.value = keep;
}
