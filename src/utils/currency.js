/**
 * currency.js — Formato de moneda colombiana (COP).
 */

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formatea un número como pesos colombianos. Ej: 185000000 -> "$ 185.000.000" */
export function formatCOP(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  return COP.format(n);
}
