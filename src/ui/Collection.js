/**
 * Collection.js — Vista de colección (pública) con búsqueda y filtros,
 * y vista de detalle de vehículo.
 */

import { el, clear, debounce } from '../utils/helpers.js';
import { VEHICLES, CATEGORIES, MANUFACTURERS, getVehicle } from '../data/vehicles.js';
import { formatCOP } from '../utils/currency.js';
import { requireAuth } from '../auth/ProtectedRoute.js';
import { navigate } from '../router.js';

export function Collection() {
  const view = el('section', { class: 'view collection' });

  const initialQ = new URLSearchParams((location.hash.split('?')[1]) || '').get('q') || '';
  const state = { q: initialQ, category: CATEGORIES[0], manufacturer: MANUFACTURERS[0] };

  const search = el('input', {
    type: 'search', class: 'field__input', id: 'col-search',
    placeholder: 'Nombre o fabricante', 'aria-label': 'Buscar modelo',
    value: initialQ,
  });
  const category = el('select', { class: 'field__input', id: 'col-cat', 'aria-label': 'Categoría' },
    CATEGORIES.map((c) => el('option', { value: c }, c)));
  const manufacturer = el('select', { class: 'field__input', id: 'col-man', 'aria-label': 'Fabricante' },
    MANUFACTURERS.map((m) => el('option', { value: m }, m)));

  const grid = el('div', { class: 'card-grid' });

  const apply = () => {
    const q = state.q.trim().toLowerCase();
    const list = VEHICLES.filter((v) => {
      const matchQ = !q || `${v.name} ${v.manufacturer} ${v.category}`.toLowerCase().includes(q);
      const matchCat = state.category === CATEGORIES[0] || v.category === state.category;
      const matchMan = state.manufacturer === MANUFACTURERS[0] || v.manufacturer === state.manufacturer;
      return matchQ && matchCat && matchMan;
    });
    clear(grid);
    if (!list.length) {
      grid.appendChild(el('p', { class: 'muted' }, 'No encontramos vehículos con esos filtros.'));
    } else {
      list.forEach((v) => grid.appendChild(collectionCard(v)));
    }
  };

  search.addEventListener('input', debounce((e) => { state.q = e.target.value; apply(); }, 150));
  category.addEventListener('change', (e) => { state.category = e.target.value; apply(); });
  manufacturer.addEventListener('change', (e) => { state.manufacturer = e.target.value; apply(); });

  view.append(
    el('div', { class: 'view__head' }, [
      el('h1', {}, 'Nuestra flota élite'),
      el('p', { class: 'muted' }, 'Elige un modelo y personalízalo en 3D: pintura, rines, kits e interior.'),
    ]),
    el('div', { class: 'filters' }, [
      labeled('Buscar modelo', search),
      labeled('Categoría', category),
      labeled('Fabricante', manufacturer),
    ]),
    grid
  );
  apply();
  return view;
}

function collectionCard(v) {
  return el('article', { class: 'vehicle-card' }, [
    el('a', { class: 'vehicle-card__media', href: `#/vehiculo/${v.id}`, 'aria-label': `Ver ${v.name}` }, [
      el('img', { src: v.thumbnail, alt: v.name, loading: 'lazy' }),
      v.model.placeholder ? el('span', { class: 'badge badge--muted' }, 'Modelo ilustrativo') : el('span', { class: 'badge' }, '3D disponible'),
    ]),
    el('div', { class: 'vehicle-card__body' }, [
      el('p', { class: 'vehicle-card__tag' }, v.tagline),
      el('h3', {}, v.name),
      el('p', { class: 'vehicle-card__desc' }, v.description),
      el('p', { class: 'vehicle-card__price' }, `Desde ${formatCOP(v.basePrice)}`),
    ]),
    el('div', { class: 'vehicle-card__foot' }, [
      el('a', { class: 'btn btn--outline btn--sm', href: `#/vehiculo/${v.id}` }, 'Detalles'),
      el('button', { class: 'btn btn--primary btn--sm', onclick: () => personalize(v.id) }, 'Ver y personalizar'),
    ]),
  ]);
}

export function VehicleDetail(id) {
  const v = getVehicle(id);
  const view = el('section', { class: 'view detail' });
  if (!v) {
    view.append(el('div', { class: 'empty-state' }, [
      el('h1', {}, 'Vehículo no encontrado'),
      el('a', { class: 'btn btn--primary', href: '#/coleccion' }, 'Volver a la colección'),
    ]));
    return view;
  }

  view.append(
    el('a', { class: 'back-link', href: '#/coleccion' }, '← Volver a la colección'),
    el('div', { class: 'detail__grid' }, [
      el('div', { class: 'detail__media' }, [
        el('img', { src: v.thumbnail, alt: v.name }),
        v.model.placeholder
          ? el('p', { class: 'note' }, 'Nota: este vehículo usa un modelo 3D ilustrativo (placeholder).')
          : null,
      ]),
      el('div', { class: 'detail__info' }, [
        el('p', { class: 'vehicle-card__tag' }, v.tagline),
        el('h1', {}, v.name),
        el('p', {}, v.description),
        el('p', { class: 'detail__price' }, `Desde ${formatCOP(v.basePrice)}`),
        el('ul', { class: 'spec-list' }, Object.entries(v.specs).map(([k, val]) =>
          el('li', {}, [el('span', { class: 'spec-list__k' }, labelForSpec(k)), el('span', {}, val)]))),
        el('div', { class: 'detail__cta' }, [
          el('button', { class: 'btn btn--primary btn--lg', onclick: () => personalize(v.id) }, 'Personalizar en 3D'),
        ]),
      ]),
    ])
  );
  return view;
}

function personalize(id) {
  const go = () => navigate(`#/configurador/${id}`);
  if (requireAuth({ onSuccess: go })) go();
}

function labeled(label, input) {
  const id = input.id || input.getAttribute('id');
  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', for: id }, label),
    input,
  ]);
}
function labelForSpec(k) {
  return ({ motor: 'Motor', potencia: 'Potencia', traccion: 'Tracción', '0-100': '0-100 km/h' }[k]) || k;
}
