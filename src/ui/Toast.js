/**
 * Toast.js — Notificaciones efímeras accesibles.
 */

import { el } from '../utils/helpers.js';

function root() {
  return document.getElementById('toast-root');
}

/**
 * Muestra un toast.
 * @param {string} message
 * @param {object} [opts] { type: 'info'|'success'|'error'|'warning', timeout }
 */
export function toast(message, { type = 'info', timeout = 3600 } = {}) {
  const container = root();
  if (!container) return;

  const node = el('div', {
    class: `toast toast--${type}`,
    role: type === 'error' ? 'alert' : 'status',
  }, [
    el('span', { class: 'toast__icon', 'aria-hidden': 'true' }, iconFor(type)),
    el('span', { class: 'toast__msg' }, message),
    el('button', {
      class: 'toast__close',
      'aria-label': 'Cerrar notificación',
      onclick: () => dismiss(node),
    }, '×'),
  ]);

  container.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));

  if (timeout > 0) {
    setTimeout(() => dismiss(node), timeout);
  }
  return node;
}

function dismiss(node) {
  node.classList.remove('is-visible');
  node.addEventListener('transitionend', () => node.remove(), { once: true });
  // Respaldo por si no hay transición:
  setTimeout(() => node.remove(), 400);
}

function iconFor(type) {
  return { success: '✓', error: '!', warning: '△', info: 'i' }[type] || 'i';
}
