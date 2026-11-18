/**
 * Profile.js — Mi perfil: datos personales (tabla perfiles) y
 * configuraciones guardadas (tabla configuraciones, vía dataService).
 */
import { el, clear, DEPARTAMENTOS, ciudadesDe, fillSelect, isValidColombianPhone, normalizeColombianPhone } from '../utils/helpers.js';
import { authManager } from '../auth/AuthManager.js';
import { VehicleState } from '../vehicle/VehicleState.js';
import { navigate } from '../router.js';
import { toast } from './Toast.js';
import { formatCOP } from '../utils/currency.js';

const STATUS_LABEL = { borrador: 'Borrador', guardada: 'Guardada', enviada: 'Enviada a cotización' };

export function Profile() {
  const user = authManager.getCurrentUser();
  if (!user) return el('section', { class: 'view' }, el('p', { class: 'muted' }, 'Inicia sesión para ver tu perfil.'));

  const view = el('section', { class: 'view profile' });
  view.append(el('div', { class: 'view__head' }, [
    el('h1', {}, 'Mi perfil'),
    el('p', { class: 'muted' }, `${user.email} · cliente desde ${fmtDate(user.createdAt)}`),
  ]));

  view.append(profileForm(user));

  const list = el('div', { class: 'request-list' });
  view.append(el('h2', { class: 'profile__title' }, 'Mis configuraciones guardadas'), list);
  loadConfigs(list);
  return view;
}

function field(id, label, input) {
  const hint = el('span', { class: 'field__hint', id: `${id}-err` });
  return { hint, wrap: el('div', { class: 'field' }, [el('label', { class: 'field__label', for: id }, label), input, hint]) };
}

function profileForm(user) {
  const inp = (id, value, type = 'text') => el('input', { id, name: id, type, class: 'field__input', value: value || '' });
  const sel = (id) => el('select', { id, name: id, class: 'field__input' });

  const fullName = field('pf-name', 'Nombre completo', inp('pf-name', user.fullName));
  const phone = field('pf-phone', 'Celular', inp('pf-phone', user.phone, 'tel'));
  const depSel = sel('pf-dep');
  const citySel = sel('pf-city');
  fillSelect(depSel, DEPARTAMENTOS, { selected: user.department || '' });
  fillSelect(citySel, ciudadesDe(user.department), {
    placeholder: user.department ? 'Selecciona…' : 'Primero elige un departamento',
    selected: user.city || '',
    disabled: !user.department,
  });
  depSel.addEventListener('change', () => {
    fillSelect(citySel, ciudadesDe(depSel.value), {
      placeholder: depSel.value ? 'Selecciona…' : 'Primero elige un departamento',
      selected: citySel.value,
      disabled: !depSel.value,
    });
  });
  const city = field('pf-city', 'Ciudad', citySel);
  const dep = field('pf-dep', 'Departamento', depSel);
  const mk = el('input', { type: 'checkbox', id: 'pf-mk', checked: !!user.marketing });
  const btn = el('button', { type: 'submit', class: 'btn btn--primary' }, 'Guardar cambios');

  const form = el('form', { class: 'auth-form profile__form', novalidate: true }, [
    el('div', { class: 'grid-2' }, [fullName.wrap, phone.wrap]),
    el('div', { class: 'grid-2' }, [city.wrap, dep.wrap]),
    el('label', { class: 'check-row' }, [mk, el('span', {}, 'Autorizo recibir información comercial.')]),
    btn,
  ]);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    fullName.hint.textContent = ''; phone.hint.textContent = '';
    const name = form.querySelector('#pf-name').value.trim();
    const tel = form.querySelector('#pf-phone').value.trim();
    if (!name) { fullName.hint.textContent = 'Ingresa tu nombre.'; return; }
    if (tel && !isValidColombianPhone(tel)) { phone.hint.textContent = 'Celular colombiano no válido.'; return; }
    btn.disabled = true;
    const res = await authManager.updateProfile({
      fullName: name,
      phone: tel ? normalizeColombianPhone(tel) : '',
      city: form.querySelector('#pf-city').value,
      department: form.querySelector('#pf-dep').value,
      marketing: mk.checked,
    });
    btn.disabled = false;
    toast(res.ok ? 'Perfil actualizado.' : (res.error || 'No se pudo actualizar el perfil.'), { type: res.ok ? 'success' : 'error' });
  });
  return form;
}

async function loadConfigs(list) {
  clear(list);
  list.append(el('p', { class: 'muted' }, 'Cargando configuraciones…'));
  let rows = [];
  try { rows = await VehicleState.list(); } catch {
    clear(list);
    list.append(el('p', { class: 'form__error' }, 'No se pudieron cargar tus configuraciones.'));
    return;
  }
  clear(list);
  if (!rows.length) {
    list.append(el('div', { class: 'empty-state' }, [
      el('p', {}, 'Aún no has guardado configuraciones.'),
      el('a', { class: 'btn btn--primary', href: '#/coleccion' }, 'Configurar un vehículo'),
    ]));
    return;
  }
  for (const r of rows) {
    list.append(el('article', { class: 'request-card' }, [
      el('div', { class: 'request-card__top' }, [
        el('div', {}, [
          el('h3', {}, `${r.name} · ${r.vehicleName || r.vehicleId}`),
          el('p', { class: 'muted' }, `Guardada el ${fmtDate(r.savedAt)}`),
        ]),
        el('span', { class: 'status is-review' }, STATUS_LABEL[r.status] || 'Guardada'),
      ]),
      el('p', { class: 'request-card__total' }, `Total: ${formatCOP(r.total)}`),
      el('div', { class: 'request-card__actions' }, [
        el('button', { class: 'btn btn--outline btn--sm', onclick: () => navigate(`#/configurador/${r.vehicleId}?cfg=${r.id}`) }, 'Abrir en configurador'),
        r.status === 'enviada' ? null : el('button', {
          class: 'btn btn--danger btn--sm',
          onclick: async () => {
            try { await VehicleState.remove(r.id); toast('Configuración eliminada.', { type: 'info' }); loadConfigs(list); }
            catch { toast('No se pudo eliminar.', { type: 'error' }); }
          },
        }, 'Eliminar'),
      ]),
    ]));
  }
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return '—'; }
}
