/**
 * storage.js — Envoltorio seguro sobre localStorage.
 * Centraliza las claves usadas por la aplicación y maneja errores
 * (modo privado, cuota excedida, JSON corrupto) sin romper la app.
 */

export const KEYS = Object.freeze({
  // Espejo local del usuario autenticado (la sesión real vive en Supabase).
  CURRENT_USER: 'apexCurrentUser',
});

function available() {
  try {
    const k = '__apex_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const HAS_LS = available();

/** Lee y parsea JSON. Devuelve `fallback` ante error o ausencia. */
export function readJSON(key, fallback = null) {
  if (!HAS_LS) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Serializa y guarda JSON. Devuelve true/false según éxito. */
export function writeJSON(key, value) {
  if (!HAS_LS) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  if (!HAS_LS) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

export const storageAvailable = HAS_LS;
