/**
 * main.js — Punto de entrada. Monta el encabezado, registra las rutas y
 * arranca el enrutador por hash. Protege las rutas que requieren sesión.
 */

import './style.css';

import { el } from './utils/helpers.js';
import { mountHeader } from './ui/Header.js';
import { mountFooter } from './ui/Footer.js';
import { addRoute, startRouter, navigate } from './router.js';
import { HomePage } from './ui/HomePage.js';
import { Collection, VehicleDetail } from './ui/Collection.js';
import { ConfigurationPanel } from './ui/ConfigurationPanel.js';
import { Profile } from './ui/Profile.js';
import { Requests } from './ui/Requests.js';
import { authManager } from './auth/AuthManager.js';
import { getCurrentUser, requireAuth } from './auth/ProtectedRoute.js';
import { TermsPage } from './ui/TermsPage.js';

/* Restaura la sesión de Supabase (si existe) antes de montar la interfaz. */
/* Se espera (máx. 4 s) para que las rutas protegidas vean la sesión real y
   no un espejo obsoleto de localStorage. */
const authReady = Promise.race([
  authManager.init().catch(() => null),
  new Promise((r) => setTimeout(r, 4000)),
]);

mountHeader();
mountFooter();

/**
 * Envuelve un handler para exigir sesión. Si no hay usuario, abre el modal de
 * autenticación y muestra una vista bloqueada.
 */
function protect(handler) {
  return (params) => {
    if (getCurrentUser()) return handler(params);
    requireAuth({ onSuccess: () => navigate(location.hash || '#/') });
    return LockedView();
  };
}

/* ---------- Rutas ---------- */
addRoute('#/', () => HomePage());
addRoute('#/coleccion', () => Collection());
addRoute('#/vehiculo/:id', (p) => VehicleDetail(p.id));
addRoute('#/contacto', () => ContactView());
addRoute('#/terminos', () => TermsPage());

addRoute('#/configurador', protect(() => ConfigurationPanel({ id: 'brz' })), { keepScroll: true });
addRoute('#/configurador/:id', protect((p) => ConfigurationPanel(p)), { keepScroll: true });

addRoute('#/perfil', protect(() => Profile()));
addRoute('#/solicitudes', protect(() => Requests()));

const PROTECTED = /^#\/(configurador|perfil|solicitudes)/;
authReady.then(() => {
  startRouter(document.getElementById('contenido-principal'));
  // Al cerrar sesión dentro de una ruta protegida se vuelve al inicio.
  authManager.onChange((e) => {
    if (!e.detail && PROTECTED.test(location.hash)) navigate('#/');
  });
});

/* ---------- Vistas auxiliares ---------- */

function LockedView() {
  return el('section', { class: 'view view--center' }, [
    el('div', { class: 'empty-state' }, [
      el('div', { class: 'empty-state__icon', 'aria-hidden': 'true' }, '🔒'),
      el('h1', {}, 'Contenido para usuarios registrados'),
      el('p', {}, 'Crea una cuenta o inicia sesión para comenzar a personalizar tu vehículo.'),
      el('a', { class: 'btn btn--primary', href: '#/coleccion' }, 'Ver colección'),
    ]),
  ]);
}

function ContactView() {
  return el('section', { class: 'view contact' }, [
    el('div', { class: 'view__head' }, [
      el('h1', {}, 'Contacto'),
      el('p', { class: 'muted' }, 'Información general de Tunning Motorcol.'),
    ]),
    el('div', { class: 'contact__grid' }, [
      contactCard('Ventas y cotizaciones', 'Envía tu configuración desde el configurador para recibir una cotización personalizada.'),
      contactCard('Showroom', 'Carrera 7 # 72-10, Bogotá D.C., Colombia. Lunes a sábado, 9:00 a 19:00.'),
      contactCard('Atención al cliente', 'hola@tunningmotorcol.co · +57 601 123 4567'),
    ]),
  ]);
}

function contactCard(title, text) {
  return el('div', { class: 'panel' }, [el('h2', {}, title), el('p', { class: 'muted' }, text)]);
}
