/**
 * HomePage.js — Página principal (pública), estilo marketplace automotriz claro.
 */

import { el } from '../utils/helpers.js';
import { VEHICLES } from '../data/vehicles.js';
import { authManager } from '../auth/AuthManager.js';
import { openAuthModal } from './AuthModal.js';
import { requireAuth } from '../auth/ProtectedRoute.js';
import { navigate } from '../router.js';
import { formatCOP } from '../utils/currency.js';

export function HomePage() {
  const view = el('section', { class: 'view home' });

  const goPersonalize = () => {
    if (requireAuth({ onSuccess: () => navigate('#/configurador') })) navigate('#/configurador');
  };

  const hero = el('div', { class: 'hero-card' }, [
    el('div', { class: 'hero-card__grid' }, [
      el('div', { class: 'hero__content' }, [
        el('p', { class: 'eyebrow' }, 'TUNNING MOTORCOL'),
        el('h1', { class: 'hero__title' }, [
          'El auto perfecto te está ',
          el('span', { class: 'text-accent' }, 'esperando'),
        ]),
        el('p', { class: 'hero__lead' },
          'Explora la flota, elige color y piezas, y arma tu configuración en 3D. Personaliza tu vehículo. Diseña tu estilo.'),
        el('div', { class: 'hero__cta' }, [
          el('a', { class: 'btn btn--primary btn--lg', href: '#/coleccion' }, 'Ver flota'),
          el('button', { class: 'btn btn--ghost-dark btn--lg', onclick: goPersonalize }, 'Personalizar'),
        ]),
        authManager.isAuthenticated() ? null : el('div', { class: 'hero__cta hero__cta--sub' }, [
          el('button', { class: 'btn btn--link btn--on-dark', onclick: () => openAuthModal({ tab: 'register' }) }, 'Crear cuenta'),
          el('span', { class: 'dot' }, '·'),
          el('button', { class: 'btn btn--link btn--on-dark', onclick: () => openAuthModal({ tab: 'login' }) }, 'Iniciar sesión'),
        ]),
      ]),
      el('div', { class: 'hero__art', 'aria-hidden': 'true' }, [
        el('img', { src: VEHICLES[0].thumbnail, alt: '', class: 'hero__car' }),
        el('button', {
          class: 'hero__play',
          type: 'button',
          title: 'Personalizar en 3D',
          onclick: goPersonalize,
        }, '▶'),
      ]),
    ]),
    el('form', {
      class: 'hero-search',
      onsubmit: (e) => {
        e.preventDefault();
        const q = new FormData(e.target).get('q')?.toString().trim() || '';
        navigate(q ? `#/coleccion?q=${encodeURIComponent(q)}` : '#/coleccion');
      },
    }, [
      searchField('Buscar modelo', 'q', 'search', 'BRZ, Raptor, Mustang…'),
      el('button', { class: 'btn btn--primary hero-search__btn', type: 'submit' }, 'Buscar'),
    ]),
  ]);

  const brands = el('div', { class: 'brand-row', 'aria-label': 'Fabricantes' }, [
    brandMark('Subaru'), brandMark('Ford'), brandMark('Lamborghini'),
  ]);

  const why = el('section', { class: 'section section--why' }, [
    el('h2', { class: 'section__title section__title--center' }, '¿Por qué Tunning Motorcol?'),
    el('div', { class: 'why-grid' }, [
      whyCard('01', 'Flota a tu medida', 'Deportivos, muscle cars y todoterreno listos para personalizar pieza por pieza.'),
      whyCard('02', 'Precio en COP', 'Ves el total en pesos colombianos mientras eliges pintura, rines y kits.'),
      whyCard('03', '3D en tiempo real', 'Gira el auto, entra al interior y revisa cada cambio antes de cotizar.'),
    ]),
  ]);

  const how = el('section', { class: 'section section--how' }, [
    el('p', { class: 'eyebrow eyebrow--dark' }, 'Proceso'),
    el('h2', { class: 'section__title' }, [
      'Empieza ', el('span', { class: 'text-accent' }, 'en 3 pasos'),
    ]),
    el('div', { class: 'steps-row' }, [
      step('1', 'Elige tu auto', 'Filtra la flota y entra al modelo que quieres personalizar.'),
      step('2', 'Configura en 3D', 'Pintura, rines, alerón, kits y vista interior del habitáculo.'),
      step('3', 'Solicita cotización', 'Guarda tu diseño y envíalo al fabricante en un clic.'),
    ]),
  ]);

  const featured = el('section', { class: 'section' }, [
    el('div', { class: 'section__head' }, [
      el('h2', { class: 'section__title' }, 'Nuestra flota élite'),
      el('a', { class: 'btn btn--link', href: '#/coleccion' }, 'Ver todos →'),
    ]),
    el('div', { class: 'card-grid' }, VEHICLES.map((v) => featuredCard(v))),
  ]);

  view.append(hero, brands, why, how, featured);
  return view;
}

function searchField(label, id, type, placeholder = '') {
  return el('label', { class: 'hero-search__field' }, [
    el('span', {}, label),
    el('input', { id, name: id, type, class: 'hero-search__input', placeholder }),
  ]);
}

function brandMark(name) {
  return el('span', { class: 'brand-mark' }, name);
}

function whyCard(n, title, text) {
  return el('div', { class: 'why-card' }, [
    el('span', { class: 'why-card__icon', 'aria-hidden': 'true' }, n),
    el('h3', {}, title),
    el('p', {}, text),
  ]);
}

function featuredCard(v) {
  return el('article', { class: 'vehicle-card' }, [
    el('div', { class: 'vehicle-card__media' }, [
      el('img', { src: v.thumbnail, alt: v.name, loading: 'lazy' }),
      v.model.placeholder ? el('span', { class: 'badge badge--muted' }, 'Modelo ilustrativo') : el('span', { class: 'badge' }, '3D'),
    ]),
    el('div', { class: 'vehicle-card__body' }, [
      el('p', { class: 'vehicle-card__tag' }, v.tagline),
      el('h3', {}, v.name),
      el('p', { class: 'vehicle-card__price' }, `Desde ${formatCOP(v.basePrice)}`),
    ]),
    el('div', { class: 'vehicle-card__foot' }, [
      el('a', { class: 'btn btn--outline btn--sm', href: `#/vehiculo/${v.id}` }, 'Detalles'),
      el('button', {
        class: 'btn btn--primary btn--sm',
        onclick: () => {
          const go = () => navigate(`#/configurador/${v.id}`);
          if (requireAuth({ onSuccess: go })) go();
        },
      }, 'Personalizar'),
    ]),
  ]);
}

function step(n, title, text) {
  return el('div', { class: 'step' }, [
    el('span', { class: 'step__num' }, n),
    el('h3', {}, title),
    el('p', {}, text),
  ]);
}
