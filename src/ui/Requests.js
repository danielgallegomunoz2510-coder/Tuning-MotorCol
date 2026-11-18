/**
 * Requests.js — Solicitudes de cotización (crear, listar, ver, descargar).
 * Persistencia por usuario en Supabase.
 */

import { el, clear, formatDate, escapeHTML } from '../utils/helpers.js';
import { formatCOP } from '../utils/currency.js';
import { downloadJSON, configFilename } from '../utils/exportConfig.js';
import { navigate } from '../router.js';
import { toast } from './Toast.js';
import { listRequestRows, createRequestRow, removeRequestRow } from '../supabase/dataService.js';

const STATUSES = {
  pendiente: { label: 'Pendiente de revisión', cls: 'is-pending' },
  revision: { label: 'En revisión', cls: 'is-review' },
  ajustes: { label: 'Requiere ajustes', cls: 'is-adjust' },
  confirmada: { label: 'Confirmada', cls: 'is-confirmed' },
};

/** Crea una solicitud de cotización en Supabase. */
export function createRequest(user, { vehicle, configObject, message }) {
  return createRequestRow({ vehicle, configObject, message });
}

export function Requests() {
  const view = el('section', { class: 'view requests' });
  view.append(el('div', { class: 'view__head' }, [
    el('h1', {}, 'Mis solicitudes'),
    el('p', { class: 'muted' }, 'Seguimiento de las cotizaciones enviadas al fabricante.'),
  ]));

  const listWrap = el('div', { class: 'request-list' });
  view.append(listWrap);

  const render = async () => {
    clear(listWrap);
    listWrap.appendChild(el('p', { class: 'muted' }, 'Cargando solicitudes…'));
    let items = [];
    try {
      items = await listRequestRows();
    } catch {
      clear(listWrap);
      listWrap.appendChild(el('p', { class: 'form__error' }, 'No se pudieron cargar las solicitudes.'));
      return;
    }
    clear(listWrap);
    if (!items.length) {
      listWrap.appendChild(el('div', { class: 'empty-state' }, [
        el('p', {}, 'Aún no has enviado solicitudes.'),
        el('a', { class: 'btn btn--primary', href: '#/coleccion' }, 'Explorar colección'),
      ]));
      return;
    }
    items.forEach((r) => listWrap.appendChild(requestCard(r, render)));
  };

  render();
  return view;
}

function requestCard(r, onChange) {
  const st = STATUSES[r.status] || STATUSES.pendiente;
  return el('article', { class: 'request-card' }, [
    el('div', { class: 'request-card__top' }, [
      el('div', {}, [
        el('h3', {}, `${r.code} · ${r.vehicleName}`),
        el('p', { class: 'muted' }, `Enviada el ${formatDate(r.createdAt)}`),
      ]),
      el('span', { class: `status ${st.cls}` }, st.label),
    ]),
    el('p', { class: 'request-card__total' }, `Total estimado: ${formatCOP(r.total)}`),
    r.message ? el('p', { class: 'request-card__msg' }, `“${r.message}”`) : null,
    r.reply ? el('p', { class: 'request-card__msg' }, `Respuesta del fabricante: ${r.reply}`) : null,
    el('div', { class: 'request-card__actions' }, [
      el('button', { class: 'btn btn--outline btn--sm', onclick: () => downloadJSON(r.payload, configFilename({ name: r.vehicleName })) }, 'Descargar JSON'),
      el('button', { class: 'btn btn--ghost btn--sm', onclick: () => navigate(`#/configurador/${r.vehicleId}`) }, 'Reabrir en configurador'),
      el('button', {
        class: 'btn btn--danger btn--sm',
        onclick: async () => {
          try {
            await removeRequestRow(r.id);
            toast('Solicitud eliminada.', { type: 'info' });
            onChange();
          } catch {
            toast('No se pudo eliminar la solicitud.', { type: 'error' });
          }
        },
      }, 'Eliminar'),
    ]),
  ]);
}
