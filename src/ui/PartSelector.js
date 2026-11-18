/**
 * PartSelector.js — Renderiza un control del catálogo enlazado al VehicleState.
 * Soporta: palette, segmented, toggle, range, select.
 * Deshabilita y explica los controles cuyo recurso no está disponible.
 */

import { el, uid } from '../utils/helpers.js';
import { getPath } from '../data/catalog.js';
import { formatCOP } from '../utils/currency.js';
import { ColorPicker } from './ColorPicker.js';

/**
 * @param {object} control  Definición del control (catalog.js).
 * @param {VehicleState} state
 * @param {Set<string>} availableMaterials
 */
export function PartSelector(control, state, availableMaterials) {
  const { availability, reason } = resolveAvailability(control, availableMaterials);
  const id = `ctrl-${control.id.replace(/\W+/g, '-')}-${uid('x')}`;

  const header = el('div', { class: 'control__head' }, [
    el('label', { class: 'control__label', for: id }, control.label),
    priceHint(control),
  ]);

  const body = el('div', { class: 'control__body' });
  const control_wrap = el('div', { class: `control${availability ? '' : ' is-disabled'}` }, [header, body]);

  if (!availability) {
    control_wrap.appendChild(el('p', { class: 'control__missing', role: 'note' }, reason));
  }

  const disabled = !availability;
  const current = () => getPath(state.config, control.path);

  let refresh = () => {};

  switch (control.kind) {
    case 'palette': {
      const picker = ColorPicker({
        palette: control.palette,
        value: current(),
        allowCustom: control.allowCustom !== false,
        disabled,
        idBase: id,
        onChange: (hex) => state.set(control.path, hex),
      });
      body.appendChild(picker);
      refresh = () => picker.update(current());
      break;
    }
    case 'segmented': {
      const group = el('div', { class: 'segmented', role: 'group', 'aria-label': control.label });
      const buttons = control.options.map((opt) => {
        const optOff = !optionAvailable(opt, availableMaterials);
        const btn = el('button', {
          type: 'button', class: 'segmented__btn', disabled: disabled || optOff,
          title: optOff ? 'No compatible con este modelo' : null,
          dataset: optOff ? { optOff: '1' } : null,
          'aria-pressed': String(current() === opt.value),
        }, [el('span', {}, opt.label), opt.price ? el('span', { class: 'segmented__price' }, `+${formatCOP(opt.price)}`) : null]);
        btn.addEventListener('click', () => state.set(control.path, opt.value));
        return { btn, value: opt.value };
      });
      buttons.forEach((b) => group.appendChild(b.btn));
      body.appendChild(group);
      refresh = () => buttons.forEach((b) => b.btn.setAttribute('aria-pressed', String(current() === b.value)));
      break;
    }
    case 'select': {
      const sel = el('select', { id, class: 'field__input', disabled },
        control.options.map((opt) => el('option', { value: String(opt.value), disabled: !optionAvailable(opt, availableMaterials) },
          opt.price ? `${opt.label}  (+${formatCOP(opt.price)})` : opt.label)));
      sel.value = String(current());
      sel.addEventListener('change', (e) => {
        const raw = e.target.value;
        const opt = control.options.find((o) => String(o.value) === raw);
        state.set(control.path, opt ? opt.value : raw);
      });
      body.appendChild(sel);
      refresh = () => { sel.value = String(current()); };
      break;
    }
    case 'toggle': {
      const input = el('input', { id, type: 'checkbox', class: 'switch__input', disabled });
      input.checked = !!current();
      input.addEventListener('change', (e) => state.set(control.path, e.target.checked));
      const sw = el('label', { class: 'switch', for: id }, [
        input,
        el('span', { class: 'switch__track', 'aria-hidden': 'true' }, el('span', { class: 'switch__thumb' })),
        el('span', { class: 'switch__text' }, control.price ? `+${formatCOP(control.price)}` : 'Incluido'),
      ]);
      body.appendChild(sw);
      if (control.note && availability) body.appendChild(el('p', { class: 'control__note' }, control.note));
      refresh = () => { input.checked = !!current(); };
      break;
    }
    case 'range': {
      const output = el('output', { class: 'range__value' });
      const input = el('input', {
        id, type: 'range', class: 'range__input', disabled,
        min: control.min, max: control.max, step: control.step,
        'aria-describedby': `${id}-out`,
      });
      input.value = String(current());
      output.id = `${id}-out`;
      const setLabel = () => {
        const v = Number(input.value);
        const txt = control.labels?.[v] ?? String(v);
        output.textContent = txt;
      };
      input.addEventListener('input', (e) => { state.set(control.path, Number(e.target.value)); });
      body.appendChild(el('div', { class: 'range' }, [input, output]));
      refresh = () => { input.value = String(current()); setLabel(); };
      setLabel();
      break;
    }
    default:
      body.appendChild(el('p', { class: 'muted' }, 'Control no soportado.'));
  }

  // Habilitación condicional (p. ej. color de pinzas solo si están pintadas).
  const applyConditional = () => {
    if (typeof control.enabledWhen === 'function') {
      const on = control.enabledWhen(state.config) && availability;
      control_wrap.classList.toggle('is-conditional-off', !on);
      body.querySelectorAll('input, select, button').forEach((n) => { n.disabled = !on || n.dataset.optOff === '1'; });
    }
  };

  control_wrap._refresh = () => { refresh(); applyConditional(); };
  applyConditional();

  return control_wrap;
}

/** Determina si el control puede operar según materiales/recursos presentes. */
function resolveAvailability(control, availableMaterials) {
  const req = control.requires || {};
  if (req.anchor && availableMaterials && !availableMaterials.has(`anchor:${req.anchor}`)) {
    return {
      availability: false,
      reason: 'Este modelo aún no tiene puntos de anclaje (ANCHOR_*) para montar esta pieza.',
    };
  }
  if (req.material && availableMaterials && !availableMaterials.has(req.material)) {
    return {
      availability: false,
      reason: `El modelo actual no incluye el material «${req.material}», por lo que esta opción está deshabilitada.`,
    };
  }
  return { availability: true, reason: '' };
}

function priceHint(control) {
  if (control.kind === 'toggle' && control.price) {
    return el('span', { class: 'control__price' }, `+${formatCOP(control.price)}`);
  }
  if (control.kind === 'range' && control.unitPrice) {
    return el('span', { class: 'control__price' }, `+${formatCOP(control.unitPrice)}/nivel`);
  }
  return null;
}

/** Una opción puede exigir un anclaje propio (p. ej. rines GLB). */
function optionAvailable(opt, availableMaterials) {
  const a = opt.requires?.anchor;
  return !a || !availableMaterials || availableMaterials.has(`anchor:${a}`);
}
