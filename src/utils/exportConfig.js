/**
 * exportConfig.js — Construye y descarga la configuración en JSON.
 */

import { computePrice } from '../data/catalog.js';

/** Construye el objeto JSON de la configuración (apto para enviar/descargar). */
export function buildConfigObject(vehicle, config, user = null) {
  const price = computePrice(vehicle, config);
  return {
    app: 'Tunning Motorcol',
    version: 1,
    generatedAt: new Date().toISOString(),
    vehicle: { id: vehicle.id, name: vehicle.name, category: vehicle.category, basePrice: vehicle.basePrice },
    customer: user ? { fullName: user.fullName, email: user.email, city: user.city, department: user.department, phone: user.phone } : null,
    configuration: config,
    pricing: { currency: 'COP', base: price.base, items: price.items, total: price.total },
  };
}

/** Descarga un objeto como archivo JSON. */
export function downloadJSON(obj, filename = 'tmc-config.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Nombre de archivo seguro a partir del vehículo. */
export function configFilename(vehicle) {
  const slug = String(vehicle?.name || 'vehiculo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `tmc-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
}
