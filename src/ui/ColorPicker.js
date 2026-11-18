/**
 * ColorPicker.js — Selector de color con muestras predefinidas y color libre.
 */

import { el } from '../utils/helpers.js';

/**
 * @param {object} opts
 * @param {Array<{name,hex}>} opts.palette
 * @param {string} opts.value         Color actual (#RRGGBB).
 * @param {boolean} [opts.allowCustom]
 * @param {Function} opts.onChange    (hex) => void
 * @param {boolean} [opts.disabled]
 */
export function ColorPicker({ palette = [], value = '#ffffff', allowCustom = true, onChange, disabled = false, idBase = 'color' }) {
  const swatches = palette.map((c) => {
    const btn = el('button', {
      type: 'button',
      class: 'swatch',
      title: `${c.name} (${c.hex})`,
      'aria-label': c.name,
      'aria-pressed': String(sameHex(c.hex, value)),
      disabled,
      style: `--sw:${c.hex}`,
    });
    btn.addEventListener('click', () => select(c.hex));
    return btn;
  });

  const custom = el('input', {
    type: 'color',
    class: 'swatch-custom',
    value: toInputHex(value),
    'aria-label': 'Color personalizado',
    disabled: disabled || !allowCustom,
  });
  custom.addEventListener('input', (e) => select(e.target.value));

  const wrap = el('div', { class: 'color-picker' }, [
    el('div', { class: 'swatches' }, swatches),
    allowCustom ? el('label', { class: 'swatch-custom-wrap' }, [custom, el('span', { class: 'swatch-custom__hint' }, 'Personalizado')]) : null,
  ]);

  function select(hex) {
    if (disabled) return;
    onChange?.(hex);
  }

  // Permite refrescar el estado "seleccionado" desde fuera.
  wrap.update = (newValue) => {
    for (let i = 0; i < swatches.length; i++) {
      swatches[i].setAttribute('aria-pressed', String(sameHex(palette[i].hex, newValue)));
    }
    if (allowCustom) custom.value = toInputHex(newValue);
  };

  return wrap;
}

function sameHex(a, b) {
  return String(a).toLowerCase() === String(b).toLowerCase();
}
function toInputHex(hex) {
  const h = String(hex || '#000000');
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h : '#000000';
}
