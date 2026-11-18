/**
 * Register.js — Formulario de registro (crear cuenta).
 * Devuelve un <form> listo para insertar en un modal o vista.
 */

import { el, DEPARTAMENTOS, ciudadesDe, fillSelect } from '../utils/helpers.js';
import { authManager } from './AuthManager.js';

export function createRegisterForm({ onSuccess, onSwitchToLogin } = {}) {
  const errorBox = el('p', { class: 'form__error', role: 'alert', 'aria-live': 'assertive', hidden: true });

  const field = (opts) => {
    const { id, label, type = 'text', required = true, placeholder = '', autocomplete } = opts;
    const input = el('input', {
      id,
      name: id,
      type,
      required,
      placeholder,
      autocomplete,
      class: 'field__input',
      'aria-describedby': `${id}-err`,
    });
    const err = el('span', { id: `${id}-err`, class: 'field__hint', 'aria-live': 'polite' });
    const wrap = el('div', { class: 'field' }, [
      el('label', { for: id, class: 'field__label' }, [label, required ? el('span', { class: 'req', text: ' *' }) : '']),
      input,
      err,
    ]);
    return { wrap, input, err };
  };

  const selectField = (id, label) => {
    const select = el('select', { id, name: id, required: true, class: 'field__input' });
    const err = el('span', { id: `${id}-err`, class: 'field__hint' });
    const wrap = el('div', { class: 'field' }, [
      el('label', { for: id, class: 'field__label' }, [label, el('span', { class: 'req', text: ' *' })]),
      select, err,
    ]);
    return { wrap, input: select, err };
  };

  const fullName = field({ id: 'fullName', label: 'Nombre completo', autocomplete: 'name', placeholder: 'Ej: Ana María Restrepo' });
  const email = field({ id: 'email', label: 'Correo electrónico', type: 'email', autocomplete: 'email', placeholder: 'tucorreo@dominio.com' });
  const phone = field({ id: 'phone', label: 'Número celular (Colombia)', type: 'tel', autocomplete: 'tel', placeholder: '+57 300 123 4567' });
  const department = selectField('department', 'Departamento');
  const city = selectField('city', 'Ciudad');
  fillSelect(department.input, DEPARTAMENTOS, { placeholder: 'Selecciona…' });
  fillSelect(city.input, [], { placeholder: 'Primero elige un departamento', disabled: true });

  const syncCities = () => {
    const dep = department.input.value;
    const cities = ciudadesDe(dep);
    fillSelect(city.input, cities, {
      placeholder: dep ? 'Selecciona…' : 'Primero elige un departamento',
      selected: city.input.value,
      disabled: !dep,
    });
  };
  department.input.addEventListener('change', syncCities);
  const password = field({ id: 'password', label: 'Contraseña', type: 'password', autocomplete: 'new-password', placeholder: 'Mínimo 6 caracteres' });
  const confirm = field({ id: 'confirm', label: 'Confirmar contraseña', type: 'password', autocomplete: 'new-password' });

  const terms = el('input', { id: 'acceptTerms', name: 'acceptTerms', type: 'checkbox' });
  const termsUrl = (() => {
    const url = new URL(location.href);
    url.hash = '#/terminos';
    return url.href;
  })();
  const termsLink = el('a', {
    class: 'link-inline',
    href: termsUrl,
    target: '_blank',
    rel: 'noopener noreferrer',
  }, 'Leer más');
  const termsRow = el('div', { class: 'check-row' }, [
    terms,
    el('span', {}, [
      el('label', { for: 'acceptTerms' }, 'Acepto los términos y condiciones y la política de datos. '),
      termsLink,
    ]),
  ]);
  const termsErr = el('span', { id: 'acceptTerms-err', class: 'field__hint' });

  const marketing = el('input', { id: 'marketing', name: 'marketing', type: 'checkbox' });
  const marketingRow = el('label', { class: 'check-row' }, [marketing, el('span', {}, 'Autorizo recibir información comercial (opcional).')]);

  const infoBox = el('p', { class: 'form__info', 'aria-live': 'polite', hidden: true });
  const submitBtn = el('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Crear cuenta');
  const switchBtn = el('button', { type: 'button', class: 'btn btn--link' }, 'Ya tengo cuenta · Iniciar sesión');
  if (onSwitchToLogin) switchBtn.addEventListener('click', onSwitchToLogin);

  const form = el('form', { class: 'auth-form', novalidate: true, autocomplete: 'on' }, [
    errorBox,
    infoBox,
    el('div', { class: 'grid-2' }, [fullName.wrap, email.wrap]),
    el('div', { class: 'grid-2' }, [phone.wrap, department.wrap]),
    el('div', { class: 'grid-2' }, [city.wrap, el('div')]),
    el('div', { class: 'grid-2' }, [password.wrap, confirm.wrap]),
    termsRow, termsErr,
    marketingRow,
    submitBtn,
    switchBtn,
  ]);

  const fields = { fullName, email, phone, city, department, password, confirm };

  const clearErrors = () => {
    errorBox.hidden = true;
    errorBox.textContent = '';
    for (const f of Object.values(fields)) {
      f.err.textContent = '';
      f.input.setAttribute('aria-invalid', 'false');
    }
    termsErr.textContent = '';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    infoBox.hidden = true;
    const data = {
      fullName: fullName.input.value,
      email: email.input.value,
      phone: phone.input.value,
      city: city.input.value,
      department: department.input.value,
      password: password.input.value,
      confirm: confirm.input.value,
      acceptTerms: terms.checked,
      marketing: marketing.checked,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta…';
    let res;
    try {
      res = await authManager.register(data);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear cuenta';
    }

    if (res.ok && res.user) {
      onSuccess?.(res.user);
      return;
    }
    if (res.ok && res.needsConfirmation) {
      form.querySelectorAll('input, select').forEach((n) => { n.disabled = true; });
      infoBox.hidden = false;
      infoBox.textContent = 'Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.';
      return;
    }
    for (const [key, msg] of Object.entries(res.errors || {})) {
      if (key === 'general') {
        errorBox.hidden = false;
        errorBox.textContent = msg;
      } else if (key === 'acceptTerms') {
        termsErr.textContent = msg;
      } else if (fields[key]) {
        fields[key].err.textContent = msg;
        fields[key].input.setAttribute('aria-invalid', 'true');
      }
    }
    const firstErr = Object.keys(res.errors || {}).find((k) => fields[k]);
    if (firstErr) fields[firstErr].input.focus();
  });

  return form;
}
