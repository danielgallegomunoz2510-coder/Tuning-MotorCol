/**
 * Header.js — Encabezado con logo, navegación y estado de sesión.
 */

import { el, clear, escapeHTML } from '../utils/helpers.js';
import { authManager } from '../auth/AuthManager.js';
import { openAuthModal } from './AuthModal.js';
import { requireAuth } from '../auth/ProtectedRoute.js';
import { navigate } from '../router.js';
import { toast } from './Toast.js';

const NAV = [
  { href: '#/', label: 'Inicio' },
  { href: '#/coleccion', label: 'Colección' },
  { href: '#/configurador', label: 'Personalizar', protected: true },
  { href: '#/contacto', label: 'Contacto' },
];

export function mountHeader() {
  const host = document.getElementById('app-header');

  const render = () => {
    clear(host);
    const user = authManager.getCurrentUser();

    const brand = el('a', { class: 'brand', href: '#/', 'aria-label': 'Tunning Motorcol, ir a inicio' }, [
      el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, 'T'),
      el('span', { class: 'brand__text' }, [
        el('strong', {}, 'TUNNING'),
        el('span', { class: 'brand__co' }, 'MOTORCOL'),
      ]),
    ]);

    const currentHash = location.hash || '#/';
    const navLinks = NAV.map((item) => {
      const active = currentHash === item.href || (item.href !== '#/' && currentHash.startsWith(item.href));
      const link = el('a', {
        class: `nav-link${active ? ' is-active' : ''}`,
        href: item.href,
        'aria-current': active ? 'page' : null,
      }, item.label);
      if (item.protected) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (requireAuth({ onSuccess: () => navigate('#/configurador') })) navigate('#/configurador');
        });
      }
      return link;
    });

    const nav = el('nav', { class: 'main-nav', 'aria-label': 'Navegación principal' }, navLinks);

    let actions;
    if (user) {
      const menuBtn = el('button', {
        class: 'user-chip',
        'aria-haspopup': 'true',
        'aria-expanded': 'false',
      }, [
        el('span', { class: 'user-chip__avatar', 'aria-hidden': 'true' }, initials(user.fullName)),
        el('span', { class: 'user-chip__name' }, firstName(user.fullName)),
        el('span', { class: 'user-chip__caret', 'aria-hidden': 'true' }, '▾'),
      ]);
      const menu = el('div', { class: 'user-menu', role: 'menu', hidden: true }, [
        menuItem('Mi perfil', () => navigate('#/perfil')),
        menuItem('Mis configuraciones', () => navigate('#/perfil')),
        menuItem('Mis solicitudes', () => navigate('#/solicitudes')),
        el('hr', { class: 'user-menu__sep' }),
        menuItem('Cerrar sesión', async () => {
          await authManager.logout();
          toast('Sesión cerrada.', { type: 'info' });
          navigate('#/');
        }),
      ]);
      const wrap = el('div', { class: 'user-wrap' }, [menuBtn, menu]);
      const toggle = (open) => {
        menu.hidden = !open;
        menuBtn.setAttribute('aria-expanded', String(open));
      };
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(menu.hidden);
      });
      document.addEventListener('click', () => toggle(false));
      menu.addEventListener('click', () => toggle(false));
      actions = wrap;
    } else {
      actions = el('div', { class: 'header-actions' }, [
        el('button', { class: 'btn btn--ghost btn--sm', onclick: () => openAuthModal({ tab: 'login' }) }, 'Iniciar sesión'),
        el('button', { class: 'btn btn--primary btn--sm', onclick: () => openAuthModal({ tab: 'register' }) }, 'Registrarse'),
      ]);
    }

    // Botón de menú móvil
    const burger = el('button', { class: 'burger', 'aria-label': 'Abrir menú', 'aria-expanded': 'false' }, [
      el('span'), el('span'), el('span'),
    ]);
    burger.addEventListener('click', () => {
      const open = host.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.append(actions);
    nav.addEventListener('click', () => host.classList.remove('is-open'));

    host.append(
      el('div', { class: 'header-inner' }, [brand, nav, burger])
    );
  };

  render();
  authManager.onChange(render);
  window.addEventListener('hashchange', render);
}

function menuItem(label, onClick) {
  return el('button', { class: 'user-menu__item', role: 'menuitem', onclick: onClick }, label);
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return escapeHTML(((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U');
}
function firstName(name) {
  return escapeHTML(String(name || 'Usuario').trim().split(/\s+/)[0]);
}
