

import { el } from '../utils/helpers.js';
import { authManager } from './AuthManager.js';

export function createLoginForm({ onSuccess, onSwitchToRegister } = {}) {
  const errorBox = el('p', { class: 'form__error', role: 'alert', 'aria-live': 'assertive', hidden: true });
  const infoBox = el('p', { class: 'form__info', 'aria-live': 'polite', hidden: true });

  const email = el('input', { id: 'login-email', name: 'email', type: 'email', required: true, autocomplete: 'email', class: 'field__input', placeholder: 'tucorreo@dominio.com' });
  const password = el('input', { id: 'login-password', name: 'password', type: 'password', required: true, autocomplete: 'current-password', class: 'field__input', placeholder: 'Tu contraseña' });
  const remember = el('input', { id: 'login-remember', name: 'remember', type: 'checkbox', checked: true });

  const forgot = el('button', { type: 'button', class: 'btn btn--link btn--inline' }, '¿Olvidaste tu contraseña?');
  forgot.addEventListener('click', async () => {
    errorBox.hidden = true;
    const res = await authManager.requestPasswordReset(email.value);
    infoBox.hidden = false;
    infoBox.textContent = res.message;
  });

  const submitBtn = el('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Iniciar sesión');
  const switchBtn = el('button', { type: 'button', class: 'btn btn--link' }, '¿No tienes cuenta? Crear cuenta');
  if (onSwitchToRegister) switchBtn.addEventListener('click', onSwitchToRegister);

  const form = el('form', { class: 'auth-form', novalidate: true }, [
    errorBox,
    infoBox,
    el('div', { class: 'field' }, [
      el('label', { for: 'login-email', class: 'field__label' }, 'Correo electrónico'),
      email,
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'login-password', class: 'field__label' }, 'Contraseña'),
      password,
    ]),
    el('div', { class: 'row-between' }, [
      el('label', { class: 'check-row' }, [remember, el('span', {}, 'Recordarme')]),
      forgot,
    ]),
    submitBtn,
    switchBtn,
  ]);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    infoBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión…';
    let res;
    try {
      res = await authManager.login({ email: email.value, password: password.value, remember: remember.checked });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar sesión';
    }
    if (res.ok) {
      onSuccess?.(res.user);
    } else {
      errorBox.hidden = false;
      errorBox.textContent = res.error;
      password.focus();
      password.select();
    }
  });

  return form;
}
