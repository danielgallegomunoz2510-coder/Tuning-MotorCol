/**
 * client.js — Cliente único de Supabase para Tunning Motorcol.
 *
 * La URL y la clave PUBLICABLE (anon) son seguras para el navegador: el acceso
 * real a los datos lo controlan las políticas RLS definidas en
 * `supabase/schema.sql`. Puedes sobrescribirlas con variables de entorno de
 * Vite (archivo `.env`): VITE_SUPABASE_URL y VITE_SUPABASE_KEY.
 */

import { createClient } from '@supabase/supabase-js';

const CLOUD_URL = 'https://fldpzahayuoskjkbumzb.supabase.co';
const SUPABASE_KEY =
  import.meta.env?.VITE_SUPABASE_KEY || 'sb_publishable_FEHNb1isiavrD2OFhffu7g_T8MoiW3F';

/**
 * En `npm run dev` las llamadas van a `/supabase-api` (proxy de Vite) para
 * evitar que el navegador bloquee el fetch cruzado a supabase.co.
 * En producción se usa la URL directa, o VITE_SUPABASE_URL si está definida.
 */
function resolveSupabaseUrl() {
  if (import.meta.env?.VITE_SUPABASE_URL) return import.meta.env.VITE_SUPABASE_URL;
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/supabase-api`;
  }
  return CLOUD_URL;
}

export const supabase = createClient(resolveSupabaseUrl(), SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'tuningmotorcol-auth',
  },
});

/** Traduce errores de Supabase a mensajes en español para la interfaz. */
export function translateAuthError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  if (msg.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.';
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
    return 'Este correo ya está registrado.';
  }
  if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
    return 'No se pudo contactar el servidor de cuentas (Supabase). Prueba recargar con npm run dev, desactivar bloqueadores o revisar que el proyecto no esté pausado.';
  }
  if (msg.includes('database error saving new user') || msg.includes('schema cache') || msg.includes('could not find the table')) {
    return 'Auth responde, pero falta cargar supabase/schema.sql en el SQL Editor del proyecto (tabla perfiles).';
  }
  return error?.message || 'Ocurrió un error inesperado.';
}
