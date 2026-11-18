/**
 * VehicleState.js — Estado de configuración con historial (deshacer/rehacer),
 * persistencia por usuario y notificación de cambios.
 */

import { defaultConfig, normalizeConfig, getPath, setPath } from '../data/catalog.js';
import { deepClone, deepEqual } from '../utils/helpers.js';
import { listConfigs, saveConfig, removeConfig } from '../supabase/dataService.js';

export class VehicleState extends EventTarget {
  /**
   * @param {string} vehicleId
   * @param {object|null} initial  Configuración inicial (si se abre una guardada).
   */
  constructor(vehicleId, initial = null) {
    super();
    this.vehicleId = vehicleId;
    this._config = normalizeConfig(initial ? deepClone(initial) : null);
    this._past = [];
    this._future = [];
    this._maxHistory = 60;
  }

  get config() {
    return this._config;
  }

  get(path) {
    return getPath(this._config, path);
  }

  canUndo() { return this._past.length > 0; }
  canRedo() { return this._future.length > 0; }

  /**
   * Cambia un valor por ruta y registra el estado anterior en el historial.
   * @param {string[]} path
   * @param {*} value
   */
  set(path, value, { record = true } = {}) {
    let next = setPath(this._config, path, value);
    if (path[0] === 'spoiler') next.spoiler.enabled = next.spoiler.type !== 'serie';
    if (deepEqual(next, this._config)) return;
    if (record) {
      this._past.push(deepClone(this._config));
      if (this._past.length > this._maxHistory) this._past.shift();
      this._future = [];
    }
    this._config = next;
    this._emit('change', { path, value });
  }

  /** Reemplaza toda la configuración (registra historial). */
  replace(config, { record = true } = {}) {
    if (record) {
      this._past.push(deepClone(this._config));
      this._future = [];
    }
    this._config = normalizeConfig(deepClone(config));
    this._emit('change', { path: null, value: null, replaced: true });
  }

  undo() {
    if (!this.canUndo()) return;
    this._future.push(deepClone(this._config));
    this._config = this._past.pop();
    this._emit('change', { undo: true });
  }

  redo() {
    if (!this.canRedo()) return;
    this._past.push(deepClone(this._config));
    this._config = this._future.pop();
    this._emit('change', { redo: true });
  }

  reset() {
    this.replace(defaultConfig());
    this._emit('reset', {});
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
    if (type !== 'historychange') {
      this.dispatchEvent(new CustomEvent('historychange', {
        detail: { canUndo: this.canUndo(), canRedo: this.canRedo() },
      }));
    }
  }

  onChange(handler) {
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }

  /* ---------- persistencia en Supabase ---------- */

  /** Guarda la configuración actual con un nombre en Supabase. */
  async save(name, { vehicleName, total } = {}) {
    return saveConfig({
      vehicleId: this.vehicleId,
      vehicleName,
      name: name || `Configuración ${new Date().toLocaleDateString('es-CO')}`,
      config: deepClone(this._config),
      total: total ?? 0,
    });
  }

  /** Lista las configuraciones guardadas del usuario autenticado. */
  static async list() {
    return listConfigs();
  }

  /** Elimina una configuración por id. */
  static async remove(id) {
    await removeConfig(id);
  }
}
