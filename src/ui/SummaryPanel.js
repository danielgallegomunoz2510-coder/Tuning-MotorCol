/**
 * SummaryPanel.js — Resumen de la configuración y desglose de precio (COP).
 */

import { el, clear } from '../utils/helpers.js';
import { formatCOP } from '../utils/currency.js';
import { computePrice, findOption } from '../data/catalog.js';

export function SummaryPanel(vehicle, state) {
  const root = el('div', { class: 'summary' });
  const list = el('ul', { class: 'summary__list' });
  const totalEl = el('div', { class: 'summary__total' });
  const chosen = el('ul', { class: 'summary__chosen' });

  root.append(
    el('h3', { class: 'summary__title' }, 'Tu configuración'),
    chosen,
    el('h4', { class: 'summary__subtitle' }, 'Desglose de precio'),
    list,
    totalEl
  );

  function render() {
    const cfg = state.config;
    const price = computePrice(vehicle, cfg);

    // Resumen legible de opciones elegidas
    clear(chosen);
    const items = describe(vehicle, cfg);
    items.forEach((t) => chosen.appendChild(el('li', {}, [
      el('span', { class: 'summary__k' }, t.k), el('span', { class: 'summary__v' }, t.v),
    ])));

    // Desglose de precio
    clear(list);
    list.appendChild(row('Precio base', price.base));
    price.items.forEach((it) => list.appendChild(row(it.label, it.amount)));

    clear(totalEl);
    totalEl.append(
      el('span', {}, 'Total estimado'),
      el('strong', {}, formatCOP(price.total)),
    );
  }

  state.onChange(render);
  render();
  root._render = render;
  return root;
}

function row(label, amount) {
  return el('li', { class: 'summary__row' }, [
    el('span', {}, label),
    el('span', { class: 'summary__amount' }, amount ? formatCOP(amount) : 'Incluido'),
  ]);
}

/** Describe en texto la configuración elegida. */
function describe(vehicle, cfg) {
  const out = [];
  out.push({ k: 'Vehículo', v: vehicle.name });
  out.push({ k: 'Color', v: cfg.paint.color.toUpperCase() });
  out.push({ k: 'Acabado', v: ({ solid: 'Sólido', metallic: 'Metalizado', matte: 'Mate' }[cfg.paint.finish]) });
  out.push({ k: 'Rines', v: `${findOption('rims.design', cfg.rims.design)?.label || cfg.rims.design} · ${cfg.rims.size}"` });
  out.push({ k: 'Color de rin', v: cfg.rims.color.toUpperCase() });
  if (cfg.calipers.painted) out.push({ k: 'Pinzas', v: cfg.calipers.color.toUpperCase() });
  out.push({ k: 'Polarizado', v: cfg.tint.level === 0 ? 'No' : `Nivel ${cfg.tint.level}` });
  if (cfg.lights.tinted) out.push({ k: 'Luces', v: 'Ahumadas' });
  out.push({ k: 'Suspensión', v: cfg.suspension.drop === 0 ? 'De fábrica' : `Nivel ${cfg.suspension.drop}` });
  if (cfg.spoiler.type && cfg.spoiler.type !== 'serie') out.push({ k: 'Alerón', v: findOption('spoiler.type', cfg.spoiler.type)?.label || cfg.spoiler.type });
  if (cfg.extras?.bodykit && cfg.extras.bodykit !== 'serie') out.push({ k: 'Kit de carrocería', v: findOption('extras.bodykit', cfg.extras.bodykit)?.label });
  if (cfg.extras?.hood && cfg.extras.hood !== 'serie') out.push({ k: 'Capó', v: findOption('extras.hood', cfg.extras.hood)?.label });
  if (cfg.extras?.mirrors) out.push({ k: 'Espejos', v: 'Aerodinámicos' });
  out.push({ k: 'Interior', v: findOption('interior.trim', cfg.interior.trim)?.label || cfg.interior.trim });
  return out;
}
