/**
 * Footer.js — Pie de créditos con flecha para ocultar o mostrar.
 */

import { el } from '../utils/helpers.js';

const KEY = 'tmc-footer-collapsed';

export function mountFooter() {
  const footer = document.querySelector('.app-footer');
  if (!footer) return;
  const inner = footer.querySelector('.app-footer__inner');
  if (inner && !inner.id) inner.id = 'app-footer-inner';

  const btn = el('button', {
    type: 'button',
    class: 'footer-toggle',
    'aria-controls': 'app-footer-inner',
  }, [
    el('span', { class: 'footer-toggle__icon', 'aria-hidden': 'true' }, '▾'),
    el('span', { class: 'footer-toggle__text' }, 'Ocultar'),
  ]);
  footer.prepend(btn);

  function setCollapsed(collapsed) {
    footer.classList.toggle('is-collapsed', collapsed);
    document.body.classList.toggle('is-footer-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.title = collapsed ? 'Mostrar créditos' : 'Ocultar créditos';
    btn.querySelector('.footer-toggle__icon').textContent = collapsed ? '▴' : '▾';
    btn.querySelector('.footer-toggle__text').textContent = collapsed ? 'Créditos' : 'Ocultar';
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch { /* no-op */ }
  }

  let saved = false;
  try { saved = localStorage.getItem(KEY) === '1'; } catch { /* no-op */ }
  setCollapsed(saved);
  btn.addEventListener('click', () => {
    setCollapsed(!footer.classList.contains('is-collapsed'));
  });
}
