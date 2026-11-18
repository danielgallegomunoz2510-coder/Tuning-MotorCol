/**
 * dataService.js — Acceso a datos en Supabase (configuraciones y solicitudes).
 * Todas las consultas quedan protegidas por RLS: cada usuario solo ve y
 * modifica sus propias filas.
 */

import { supabase } from './client.js';

import { CATALOG, PART_LIBRARY, getPath, findOption } from '../data/catalog.js';

/*
 * Esquema: supabase/schema.sql (11 tablas). Las escrituras de configuraciones
 * y solicitudes pasan por funciones seguras (RPC) que validan la sesión, la
 * compatibilidad pieza–vehículo y registran el historial de estados.
 */

const ESTADOS = { 1: 'pendiente', 2: 'revision', 3: 'ajustes', 4: 'confirmada' };

/* ---------------- Configuraciones ---------------- */

/** Traduce la configuración del visor a filas de configuracion_detalles. */
function buildDetails(config) {
  const out = [];
  for (const g of CATALOG) for (const c of g.controls) {
    const value = getPath(config, c.path);
    if (value === undefined) continue;
    const opt = c.options ? findOption(c.id, value) : null;
    if (opt?.part) { out.push({ codigo: opt.part, valor: { value }, precio: opt.price || 0 }); continue; }
    if (c.id === 'mirrors' && value) { out.push({ codigo: 'mirrors_aero', valor: { value }, precio: c.price || 0 }); continue; }
    if (c.kind === 'toggle' && !value) continue;
    out.push({ codigo: c.id, valor: { value }, precio: opt ? (opt.price || 0) : (c.kind === 'toggle' ? (c.price || 0) : 0) });
  }
  return out;
}

const CONFIG_SELECT = 'id_configuracion, nombre, precio_total, estado, config_snapshot, creado_en, vehiculos(codigo, nombre)';

export async function listConfigs() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('configuraciones')
    .select(CONFIG_SELECT)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapConfigRow);
}

export async function saveConfig({ vehicleId, name, config, total }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay sesión activa.');
  const { data: id, error } = await supabase.rpc('guardar_configuracion', {
    p_vehiculo_codigo: vehicleId,
    p_nombre: name,
    p_config: config,
    p_precio_total: total,
    p_detalles: buildDetails(config),
  });
  if (error) throw error;
  const { data, error: e2 } = await supabase.from('configuraciones').select(CONFIG_SELECT).eq('id_configuracion', id).single();
  if (e2) throw e2;
  return mapConfigRow(data);
}

export async function removeConfig(id) {
  const { error } = await supabase.from('configuraciones').delete().eq('id_configuracion', id);
  if (error) throw error;
}

function mapConfigRow(row) {
  return {
    id: row.id_configuracion,
    name: row.nombre,
    vehicleId: row.vehiculos?.codigo,
    vehicleName: row.vehiculos?.nombre,
    config: row.config_snapshot,
    total: Number(row.precio_total),
    status: row.estado,
    savedAt: row.creado_en,
  };
}

/* ---------------- Solicitudes de cotización ---------------- */

export async function listRequestRows() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('v_mis_solicitudes')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequestRow);
}

/**
 * Crea la solicitud: guarda primero la configuración (snapshot + detalles) y
 * luego llama a crear_solicitud, que asigna el código AM-000001 de forma atómica.
 */
export async function createRequestRow({ vehicle, configObject, message }) {
  const saved = await saveConfig({
    vehicleId: vehicle.id,
    name: `Solicitud ${vehicle.name}`,
    config: configObject.configuration,
    total: configObject.pricing.total,
  });
  const { data, error } = await supabase.rpc('crear_solicitud', {
    p_id_configuracion: saved.id,
    p_mensaje: message || '',
  });
  if (error) throw error;
  return {
    id: data.id_solicitud, code: data.codigo, vehicleId: vehicle.id, vehicleName: vehicle.name,
    total: Number(data.total_cotizado), message: data.mensaje_cliente, status: 'pendiente',
    createdAt: data.creado_en, payload: configObject,
  };
}

export async function removeRequestRow(id) {
  const { error } = await supabase.from('solicitudes_cotizacion').delete().eq('id_solicitud', id);
  if (error) throw error;
}

function mapRequestRow(row) {
  return {
    id: row.id_solicitud,
    code: row.codigo,
    vehicleId: row.vehiculo_codigo,
    vehicleName: row.vehiculo_nombre,
    total: Number(row.total_cotizado),
    message: row.mensaje_cliente,
    reply: row.respuesta_fabricante,
    status: ESTADOS[row.id_estado_solicitud] || 'pendiente',
    createdAt: row.creado_en,
    payload: { app: 'Tunning Motorcol', vehicle: { id: row.vehiculo_codigo, name: row.vehiculo_nombre }, configuration: row.config_snapshot, pricing: { total: Number(row.total_cotizado) } },
  };
}
