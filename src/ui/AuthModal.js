/**
 * AuthModal.js — Modal de autenticación con pestañas
 * «Crear cuenta», «Iniciar sesión» y botón «Volver».
 * Incluye trampa de foco, cierre con Escape y clic en el fondo.
 */

import { el, clear } from '../utils/helpers.js';
import { createLoginForm } from '../auth/Login.js';
import { createRegisterForm } from '../auth/Register.js';

let activeModal = null;

function closeAuthModal() {
  if (activeModal) activeModal.destroy();
}

/**
 * Abre el modal de autenticación.
 * @param {object} opts
 * @param {'login'|'register'} opts.tab  Pestaña inicial.
 * @param {string} [opts.message]        Mensaje contextual (p. ej. acceso restringido).
 * @param {Function} [opts.onSuccess]    Callback(user) tras autenticarse.
 */
export function openAuthModal({ tab = 'login', message = '', onSuccess } = {}) {
  closeAuthModal();
  const root = document.getElementById('modal-root');
  const lastFocused = document.activeElement;

  const titleId = 'auth-modal-title';
  const backdrop = el('div', { class: 'modal-backdrop' });
  const panel = el('div', {
    class: 'modal auth-modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
  });

  const title = el('h2', { id: titleId, class: 'modal__title' }, 'Accede a Tunning Motorcol');
  const closeBtn = el('button', { type: 'button', class: 'modal__close', 'aria-label': 'Cerrar' }, '×');

  const tabLogin = el('button', { type: 'button', class: 'tab', role: 'tab' }, 'Iniciar sesión');
  const tabRegister = el('button', { type: 'button', class: 'tab', role: 'tab' }, 'Crear cuenta');
  const tabs = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Autenticación' }, [tabLogin, tabRegister]);

  const messageBox = message
    ? el('p', { class: 'modal__message' }, message)
    : null;

  const body = el('div', { class: 'modal__body' });
  const backRow = el('div', { class: 'modal__footer' }, [
    el('button', { type: 'button', class: 'btn btn--ghost', onclick: () => destroy() }, 'Volver'),
  ]);

  panel.append(
    el('div', { class: 'modal__header' }, [title, closeBtn]),
    ...(messageBox ? [messageBox] : []),
    tabs,
    body,
    backRow
  );

  const handleSuccess = (user) => {
    destroy();
    onSuccess?.(user);
  };

  function render(which) {
    clear(body);
    const isLogin = which === 'login';
    tabLogin.classList.toggle('is-active', isLogin);
    tabRegister.classList.toggle('is-active', !isLogin);
    tabLogin.setAttribute('aria-selected', String(isLogin));
    tabRegister.setAttribute('aria-selected', String(!isLogin));
    const form = isLogin
      ? createLoginForm({ onSuccess: handleSuccess, onSwitchToRegister: () => render('register') })
      : createRegisterForm({ onSuccess: handleSuccess, onSwitchToLogin: () => render('login') });
    body.appendChild(form);
    const firstInput = form.querySelector('input, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 30);
  }

  tabLogin.addEventListener('click', () => render('login'));
  tabRegister.addEventListener('click', () => render('register'));
  closeBtn.addEventListener('click', () => destroy());
  backdrop.addEventListener('click', () => destroy());

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      destroy();
    } else if (e.key === 'Tab') {
      trapFocus(e, panel);
    }
  }
  document.addEventListener('keydown', onKey, true);

  function destroy() {
    document.removeEventListener('keydown', onKey, true);
    backdrop.remove();
    panel.remove();
    activeModal = null;
    document.body.classList.remove('is-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  root.append(backdrop, panel);
  document.body.classList.add('is-modal-open');
  render(tab);

  activeModal = { destroy };
  return { destroy };
}

/** Trampa de foco dentro del panel del modal. */
function trapFocus(e, panel) {
  const focusables = panel.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
