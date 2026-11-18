/**
 * AuthManager.js — Autenticación y sesión con Supabase Auth.
 *
 * Mantiene un "espejo" del usuario actual en localStorage (clave
 * apexCurrentUser) para que la protección de rutas (requireAuth) pueda
 * consultarse de forma síncrona, mientras que el estado real vive en Supabase.
 */

import { supabase, translateAuthError } from '../supabase/client.js';
import { KEYS, readJSON, writeJSON, removeKey, storageAvailable } from '../utils/storage.js';
import {
  isValidEmail, isValidColombianPhone, normalizeColombianPhone, isValidPassword,
} from '../utils/helpers.js';

class AuthManager extends EventTarget {
  constructor() {
    super();
    this._current = readJSON(KEYS.CURRENT_USER, null);
    this._ready = false;
  }

  get storageAvailable() {
    return storageAvailable;
  }

  /** Inicializa la sesión y escucha cambios de autenticación. */
  async init() {
    try {
      const { data } = await supabase.auth.getSession();
      this._apply(data?.session || null, { silent: true });
    } catch {
      /* sin conexión: conserva el espejo si existe */
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      this._apply(session || null);
    });
    this._ready = true;
    return this._current;
  }

  isAuthenticated() {
    return !!this._current;
  }

  getCurrentUser() {
    return this._current;
  }

  /**
   * Registra un usuario con Supabase Auth. Valida en el cliente y envía los
   * datos del perfil como metadatos (el trigger handle_new_user crea el perfil).
   * @returns {Promise<{ok:boolean, errors?:object, user?:object, needsConfirmation?:boolean}>}
   */
  async register(data) {
    const errors = {};
    const fullName = String(data.fullName || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = String(data.phone || '').trim();
    const city = String(data.city || '').trim();
    const department = String(data.department || '').trim();
    const password = String(data.password || '');
    const confirm = String(data.confirm || '');

    if (!fullName) errors.fullName = 'Ingresa tu nombre completo.';
    if (!email) errors.email = 'Ingresa tu correo.';
    else if (!isValidEmail(email)) errors.email = 'El correo no es válido.';
    if (!phone) errors.phone = 'Ingresa tu número celular.';
    else if (!isValidColombianPhone(phone)) errors.phone = 'Celular colombiano no válido. Ej: +57 300 123 4567.';
    if (!city) errors.city = 'Selecciona tu ciudad.';
    if (!department) errors.department = 'Selecciona tu departamento.';
    if (!isValidPassword(password)) errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirm) errors.confirm = 'Las contraseñas no coinciden.';
    if (!data.acceptTerms) errors.acceptTerms = 'Debes aceptar los términos y condiciones.';
    if (Object.keys(errors).length) return { ok: false, errors };

    try {
      const { data: res, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: fullName,
            celular: normalizeColombianPhone(phone),
            ciudad: city,
            departamento: department,
            autorizacion_comercial: !!data.marketing,
          },
          emailRedirectTo: `${location.origin}${location.pathname}`,
        },
      });
      if (error) return { ok: false, errors: { general: translateAuthError(error) } };

      if (res.session) {
        this._apply(res.session);
        return { ok: true, user: this._current };
      }
      // Sin sesión inmediata: el proyecto exige confirmación por correo.
      return { ok: true, needsConfirmation: true, email };
    } catch (err) {
      return { ok: false, errors: { general: translateAuthError(err) } };
    }
  }

  /** Inicia sesión. @returns {Promise<{ok:boolean, error?:string, user?:object}>} */
  async login({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || '').trim().toLowerCase(),
        password: String(password || ''),
      });
      if (error) return { ok: false, error: translateAuthError(error) };
      this._apply(data.session);
      return { ok: true, user: this._current };
    } catch (err) {
      return { ok: false, error: translateAuthError(err) };
    }
  }

  async logout() {
    try { await supabase.auth.signOut(); } catch { /* no-op */ }
    this._apply(null);
  }

  /** Actualiza datos del perfil del usuario actual (tabla perfiles + metadatos). */
  async updateProfile(patch) {
    if (!this._current) return { ok: false };
    try {
      const { error: dbError } = await supabase.from('perfiles').update({
        nombre_completo: patch.fullName ?? this._current.fullName,
        celular: patch.phone ?? this._current.phone,
        ciudad: patch.city ?? this._current.city,
        departamento: patch.department ?? this._current.department,
        autorizacion_comercial: patch.marketing ?? this._current.marketing,
      }).eq('id_perfil', this._current.id);
      if (dbError) return { ok: false, error: translateAuthError(dbError) };
      await supabase.auth.updateUser({ data: {
        nombre_completo: patch.fullName ?? this._current.fullName,
        celular: patch.phone ?? this._current.phone,
        ciudad: patch.city ?? this._current.city,
        departamento: patch.department ?? this._current.department,
        autorizacion_comercial: patch.marketing ?? this._current.marketing,
      } });
      this._current = { ...this._current, ...patch };
      writeJSON(KEYS.CURRENT_USER, this._current);
      this.dispatchEvent(new CustomEvent('change', { detail: this._current }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: translateAuthError(err) };
    }
  }

  /** Envía el correo de recuperación de contraseña. */
  async requestPasswordReset(email) {
    const e = String(email || '').trim().toLowerCase();
    if (!isValidEmail(e)) {
      return { ok: false, message: 'Escribe un correo válido para recuperar tu contraseña.' };
    }
    try {
      await supabase.auth.resetPasswordForEmail(e, { redirectTo: `${location.origin}${location.pathname}` });
    } catch { /* se responde igual para no revelar si el correo existe */ }
    return { ok: true, message: 'Si el correo existe, enviaremos instrucciones para restablecer la contraseña.' };
  }

  /** Construye el usuario público a partir de la sesión de Supabase. */
  _userFromSession(session) {
    const u = session?.user;
    if (!u) return null;
    const m = u.user_metadata || {};
    return {
      id: u.id,
      email: u.email,
      fullName: m.nombre_completo || m.full_name || u.email,
      phone: m.celular || '',
      city: m.ciudad || '',
      department: m.departamento || '',
      marketing: !!m.autorizacion_comercial,
      createdAt: u.created_at,
    };
  }

  _apply(session, { silent = false } = {}) {
    const user = this._userFromSession(session);
    this._current = user;
    if (user) writeJSON(KEYS.CURRENT_USER, user);
    else removeKey(KEYS.CURRENT_USER);
    if (!silent) this.dispatchEvent(new CustomEvent('change', { detail: user }));
  }

  onChange(handler) {
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }
}

/** Instancia única compartida. */
export const authManager = new AuthManager();
