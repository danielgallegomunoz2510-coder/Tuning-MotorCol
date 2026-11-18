/**
 * ProtectedRoute.js — Protección de rutas que requieren sesión.
 *
 * Implementa el patrón pedido en el enunciado:
 *   verifica apexCurrentUser en localStorage; si no existe, muestra el modal
 *   de autenticación con el mensaje de acceso restringido.
 */

import { authManager } from './AuthManager.js';
import { openAuthModal } from '../ui/AuthModal.js';

const LOGIN_REQUIRED_MESSAGE =
  'Crea una cuenta o inicia sesión para comenzar a personalizar tu vehículo.';

/**
 * Devuelve el usuario actual. Fuente única: AuthManager (que mantiene el
 * espejo apexCurrentUser en localStorage sincronizado con Supabase).
 */
export function getCurrentUser() {
  return authManager.getCurrentUser();
}

/**
 * requireAuth — verifica la sesión antes de permitir el acceso.
 * @param {object} [opts]
 * @param {Function} [opts.onSuccess] Se ejecuta si el usuario se autentica en el modal.
 * @returns {boolean} true si ya hay sesión; false si se mostró el modal.
 */
export function requireAuth({ onSuccess, message = LOGIN_REQUIRED_MESSAGE } = {}) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showLoginRequiredModal({ message, onSuccess });
    return false;
  }
  return true;
}

function showLoginRequiredModal({ message = LOGIN_REQUIRED_MESSAGE, onSuccess } = {}) {
  openAuthModal({ tab: 'register', message, onSuccess });
}
