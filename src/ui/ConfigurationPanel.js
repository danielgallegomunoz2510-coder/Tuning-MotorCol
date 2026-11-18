/**
 * ConfigurationPanel.js — Vista del configurador 3D (ruta protegida).
 * Integra la escena (VehicleConfigurator), el estado (VehicleState), el panel
 * de controles (PartSelector), el resumen (SummaryPanel) y las acciones
 * (guardar, restablecer, deshacer/rehacer, descargar JSON, cotizar).
 */

import { el, clear, deepClone } from '../utils/helpers.js';
import { CATALOG, isCompatible } from '../data/catalog.js';
import { VEHICLES, getVehicle } from '../data/vehicles.js';
import { VehicleState } from '../vehicle/VehicleState.js';
import { VehicleConfigurator } from '../vehicle/VehicleConfigurator.js';
import { PartSelector } from './PartSelector.js';
import { SummaryPanel } from './SummaryPanel.js';
import { authManager } from '../auth/AuthManager.js';
import { navigate } from '../router.js';
import { toast } from './Toast.js';
import { computePrice } from '../data/catalog.js';
import { buildConfigObject, downloadJSON, configFilename } from '../utils/exportConfig.js';
import { createRequest } from './Requests.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { openAuthModal } from './AuthModal.js';

/**
 * @param {object} params  { id }
 */
export function ConfigurationPanel(params) {
  const user = authManager.getCurrentUser();
  // Guardia: sin sesión no se monta la escena (antes lanzaba TypeError en user.email).
  if (!user) {
    openAuthModal({ tab: 'login', message: 'Inicia sesión para personalizar tu vehículo.', onSuccess: () => navigate(location.hash) });
    return el('section', { class: 'view view--center' }, [
      el('div', { class: 'empty-state' }, [
        el('h1', {}, 'Inicia sesión para continuar'),
        el('p', {}, 'Tu configuración se guarda en tu cuenta.'),
        el('a', { class: 'btn btn--primary', href: '#/coleccion' }, 'Ver colección'),
      ]),
    ]);
  }
  const vehicle = getVehicle(params.id) || VEHICLES[0];

  // ¿Abrir una configuración guardada? (#/configurador/:id?cfg=ID)
  const query = new URLSearchParams((location.hash.split('?')[1]) || '');
  const savedId = query.get('cfg');
  const autosaveKey = `apexCurrent:${user.email}:${vehicle.id}`;

  const initialConfig = readJSON(autosaveKey, null);
  const state = new VehicleState(vehicle.id, initialConfig);

  // Si se abre una configuración guardada (?cfg=ID), se carga desde Supabase
  // y se aplica al estado de forma reactiva.
  if (savedId) {
    VehicleState.list()
      .then((list) => {
        const found = list.find((c) => c.id === savedId);
        if (found) state.replace(found.config);
      })
      .catch(() => { /* se mantiene la configuración por defecto */ });
  }

  /* ---------- Layout ---------- */
  const canvasHost = el('div', { class: 'stage__canvas' });

  const loading = el('div', { class: 'stage__overlay', role: 'status', 'aria-live': 'polite' }, [
    el('div', { class: 'loader' }, [
      el('div', { class: 'loader__ring', 'aria-hidden': 'true' }),
      el('p', { class: 'loader__text' }, 'Cargando vehículo y garaje…'),
      el('div', { class: 'loader__bar' }, el('span', { class: 'loader__fill' })),
    ]),
  ]);

  const topbar = el('div', { class: 'stage__topbar' }, [
    el('button', { class: 'btn btn--ghost btn--sm', onclick: () => navigate('#/coleccion') }, '← Volver al catálogo'),
    el('div', { class: 'stage__title' }, [
      el('strong', {}, `Configura tu ${vehicle.name}`),
      vehicle.model.placeholder ? el('span', { class: 'badge badge--muted' }, 'Modelo ilustrativo') : null,
    ]),
  ]);

  const undoBtn = toolBtn('↶', 'Deshacer', () => state.undo());
  const redoBtn = toolBtn('↷', 'Rehacer', () => state.redo());
  const resetBtn = toolBtn('⟲', 'Restablecer', () => {
    state.reset();
    toast('Configuración restablecida.', { type: 'info' });
  });
  const rotateBtn = toolBtn('◐', 'Girar automáticamente', () => {
    const on = rotateBtn.classList.toggle('is-active');
    configurator.setAutoRotate(on);
  });
  const viewBtn = toolBtn('⤢', 'Reencuadrar cámara', () => {
    configurator.resetView();
    if (configurator.viewMode === 'interior') {
      heightSlider.value = '0';
      lateralSlider.value = '0';
      depthSlider.value = '0';
    }
  });
  const exteriorBtn = toolBtn('◎', 'Vista exterior', () => setViewMode('exterior'));
  const interiorBtn = toolBtn('◉', 'Vista interior (primera persona)', () => setViewMode('interior'));
  exteriorBtn.classList.add('is-active');
  interiorBtn.disabled = true;

  const viewHint = el('p', { class: 'stage__hint is-hidden' }, 'Interior · arrastra para mirar · barras para alto, izquierda/derecha y adelante/atrás · Esc sale');

  const heightSlider = el('input', {
    class: 'cam-slider cam-slider--vert',
    type: 'range', min: '-28', max: '38', value: '0', step: '1',
    'aria-label': 'Altura de la cámara interior',
    title: 'Alto',
  });
  const lateralSlider = el('input', {
    class: 'cam-slider cam-slider--horiz',
    type: 'range', min: '-48', max: '48', value: '0', step: '1',
    'aria-label': 'Posición izquierda a derecha',
    title: 'Izquierda / derecha',
  });
  const depthSlider = el('input', {
    class: 'cam-slider cam-slider--vert',
    type: 'range', min: '-38', max: '45', value: '0', step: '1',
    'aria-label': 'Posición adelante y atrás',
    title: 'Adelante / atrás',
  });
  const interiorRig = el('div', { class: 'interior-rig is-hidden' }, [
    el('div', { class: 'interior-rig__vert' }, [
      el('span', { class: 'interior-rig__label' }, 'Alto'),
      heightSlider,
    ]),
    el('div', { class: 'interior-rig__vert interior-rig__vert--right' }, [
      el('span', { class: 'interior-rig__label' }, 'Adel.'),
      depthSlider,
      el('span', { class: 'interior-rig__label' }, 'Atrás'),
    ]),
    el('div', { class: 'interior-rig__horiz' }, [
      el('span', { class: 'interior-rig__label' }, 'Izq.'),
      lateralSlider,
      el('span', { class: 'interior-rig__label' }, 'Der.'),
    ]),
  ]);

  const historyBar = el('div', { class: 'stage__tools' }, [
    undoBtn, redoBtn, resetBtn, rotateBtn, viewBtn, exteriorBtn, interiorBtn,
  ]);

  // Botón para ocultar/mostrar el panel de personalización.
  const panelToggle = el('button', {
    class: 'panel-toggle',
    'aria-expanded': 'true',
    'aria-controls': 'config-panel',
    title: 'Ocultar panel',
  }, [el('span', { class: 'panel-toggle__icon', 'aria-hidden': 'true' }, '▸'),
      el('span', { class: 'panel-toggle__text' }, 'Ocultar')]);

  const stage = el('div', { class: 'stage' }, [canvasHost, topbar, historyBar, interiorRig, viewHint, panelToggle, loading]);

  /* ---------- Panel lateral ---------- */
  const groupsWrap = el('div', { class: 'config-groups' });
  const summaryHost = el('div', { class: 'config-summary' });
  const actions = el('div', { class: 'config-actions' }, [
    el('button', { class: 'btn btn--outline btn--block', onclick: onSave }, '💾 Guardar configuración'),
    el('button', { class: 'btn btn--outline btn--block', onclick: onDownload }, '⬇ Descargar JSON'),
    el('button', { class: 'btn btn--primary btn--block', onclick: onQuote }, '✉ Solicitar cotización'),
  ]);

  const panel = el('aside', { class: 'config-panel', id: 'config-panel', 'aria-label': 'Panel de personalización' }, [
    el('div', { class: 'config-panel__head' }, [
      el('h1', {}, 'Personalización'),
    ]),
    groupsWrap,
    el('h2', { class: 'config-panel__sep' }, 'Resumen'),
    summaryHost,
    actions,
  ]);

  const root = el('section', { class: 'view configurator' }, [stage, panel]);

  /* ---------- Ocultar / mostrar el panel ---------- */
  const PANEL_KEY = 'tmc-panel-collapsed';
  function setPanelCollapsed(collapsed) {
    root.classList.toggle('is-panel-collapsed', collapsed);
    panelToggle.setAttribute('aria-expanded', String(!collapsed));
    panelToggle.title = collapsed ? 'Mostrar panel' : 'Ocultar panel';
    panelToggle.querySelector('.panel-toggle__icon').textContent = collapsed ? '◂' : '▸';
    panelToggle.querySelector('.panel-toggle__text').textContent = collapsed ? 'Opciones' : 'Ocultar';
    try { localStorage.setItem(PANEL_KEY, collapsed ? '1' : '0'); } catch { /* no-op */ }
  }
  panelToggle.addEventListener('click', () => {
    setPanelCollapsed(!root.classList.contains('is-panel-collapsed'));
  });
  // Restaura el estado previo.
  let savedCollapsed = false;
  try { savedCollapsed = localStorage.getItem(PANEL_KEY) === '1'; } catch { /* no-op */ }
  setPanelCollapsed(savedCollapsed);

  function resetInteriorSliders() {
    heightSlider.value = '0';
    lateralSlider.value = '0';
    depthSlider.value = '0';
  }

  function applyInteriorSliders() {
    configurator.setInteriorOffset({
      height: Number(heightSlider.value) / 100,
      lateral: -Number(lateralSlider.value) / 100,
      depth: Number(depthSlider.value) / 100,
    });
  }

  heightSlider.addEventListener('input', applyInteriorSliders);
  lateralSlider.addEventListener('input', applyInteriorSliders);
  depthSlider.addEventListener('input', applyInteriorSliders);

  function setViewMode(mode) {
    configurator.setViewMode(mode);
    const interior = mode === 'interior';
    exteriorBtn.classList.toggle('is-active', !interior);
    interiorBtn.classList.toggle('is-active', interior);
    rotateBtn.disabled = interior;
    interiorRig.classList.toggle('is-hidden', !interior);
    if (interior) {
      rotateBtn.classList.remove('is-active');
      viewHint.classList.remove('is-hidden');
      resetInteriorSliders();
    } else {
      viewHint.classList.add('is-hidden');
    }
  }

  /* ---------- Lógica ---------- */
  const configurator = new VehicleConfigurator(canvasHost, vehicle);
  let controlEls = [];
  let summaryEl = null;
  let disposed = false;

  const fill = loading.querySelector('.loader__fill');
  const loaderText = loading.querySelector('.loader__text');

  configurator
    .load({
      onProgress: (p) => {
        if (p < 0) { fill.style.width = '100%'; fill.classList.add('is-indeterminate'); }
        else { fill.classList.remove('is-indeterminate'); fill.style.width = `${Math.round(p * 100)}%`; }
      },
    })
    .then(({ availability }) => {
      if (disposed) return;
      buildControls(availability.materials);
      summaryEl = SummaryPanel(vehicle, state);
      summaryHost.appendChild(summaryEl);
      configurator.apply(state.config);
      refreshAll();
      interiorBtn.disabled = false;
      loading.classList.add('is-hidden');
      loaderText.textContent = 'Listo';
    })
    .catch((err) => {
      if (disposed) return;
      console.error('[TMC] Error al cargar el modelo:', err);
      showError(err);
    });

  // Aplica cambios del estado al modelo 3D + UI.
  const offChange = state.onChange(() => {
    configurator.apply(state.config);
    refreshAll();
    writeJSON(autosaveKey, state.config); // autosave de la configuración en curso
  });

  // Historial (habilitar/deshabilitar undo/redo).
  state.addEventListener('historychange', (e) => {
    undoBtn.disabled = !e.detail.canUndo;
    redoBtn.disabled = !e.detail.canRedo;
  });
  undoBtn.disabled = true;
  redoBtn.disabled = true;

  // Atajos de teclado para deshacer/rehacer.
  const onKey = (e) => {
    if (e.key === 'Escape' && configurator.viewMode === 'interior') {
      e.preventDefault();
      setViewMode('exterior');
      return;
    }
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); state.undo(); }
    else if ((e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey)) { e.preventDefault(); state.redo(); }
  };
  document.addEventListener('keydown', onKey);

  function buildControls(materials) {
    clear(groupsWrap);
    controlEls = [];
    for (const group of CATALOG) {
      const details = el('details', { class: 'cfg-group', open: true }, [
        el('summary', { class: 'cfg-group__summary' }, group.title),
      ]);
      const inner = el('div', { class: 'cfg-group__body' });
      let shown = 0;
      for (const raw of group.controls) {
        // Compatibilidad por vehículo: se ocultan controles/opciones de otros modelos.
        if (!isCompatible(raw, vehicle.id)) continue;
        const control = Array.isArray(raw.options)
          ? { ...raw, options: raw.options.filter((o) => isCompatible(o, vehicle.id)) }
          : raw;
        if (control.options && control.options.length < 2 && control.kind !== 'palette') continue;
        shown++;
        const node = PartSelector(control, state, materials);
        controlEls.push(node);
        inner.appendChild(node);
      }
      details.appendChild(inner);
      if (shown) groupsWrap.appendChild(details);
    }
  }

  function refreshAll() {
    controlEls.forEach((c) => c._refresh && c._refresh());
  }

  /* ---------- Acciones ---------- */
  function onSave() {
    openPromptModal({
      title: 'Guardar configuración',
      label: 'Nombre de la configuración',
      placeholder: `Mi ${vehicle.name}`,
      confirm: 'Guardar',
      onConfirm: async (name) => {
        try {
          const price = computePrice(vehicle, state.config);
          await state.save(name, { vehicleName: vehicle.name, total: price.total });
          toast('Configuración guardada en tu perfil.', { type: 'success' });
        } catch {
          toast('No se pudo guardar la configuración.', { type: 'error' });
        }
      },
    });
  }

  function onDownload() {
    const obj = buildConfigObject(vehicle, state.config, user);
    downloadJSON(obj, configFilename(vehicle));
    toast('Descargando configuración (JSON).', { type: 'info' });
  }

  function onQuote() {
    openPromptModal({
      title: 'Solicitar cotización',
      label: 'Mensaje para el fabricante (opcional)',
      placeholder: 'Consultar disponibilidad y entrega…',
      confirm: 'Enviar al fabricante',
      multiline: true,
      optional: true,
      onConfirm: async (message) => {
        const obj = buildConfigObject(vehicle, state.config, user);
        try {
          const req = await createRequest(user, { vehicle, configObject: obj, message });
          toast(`Solicitud ${req.code} enviada. Queda pendiente de revisión.`, { type: 'success', timeout: 4500 });
          navigate('#/solicitudes');
        } catch {
          toast('No se pudo enviar la solicitud. Intenta de nuevo.', { type: 'error' });
        }
      },
    });
  }

  function showError(err) {
    clear(loading);
    loading.classList.remove('is-hidden');
    loading.appendChild(el('div', { class: 'stage-error' }, [
      el('h2', {}, 'No se pudo cargar el modelo 3D'),
      el('p', { class: 'muted' }, `Verifica que el archivo «${vehicle.model.url}» exista en /public y que tu navegador sea compatible con WebGL.`),
      el('p', { class: 'muted small' }, String(err?.message || err || 'Error desconocido')),
      el('div', { class: 'row-gap' }, [
        el('button', { class: 'btn btn--primary', onclick: () => location.reload() }, 'Reintentar'),
        el('a', { class: 'btn btn--ghost', href: '#/coleccion' }, 'Volver al catálogo'),
      ]),
    ]));
  }

  const cleanup = () => {
    disposed = true;
    offChange?.();
    document.removeEventListener('keydown', onKey);
    configurator.dispose();
  };

  return { element: root, cleanup };
}

/* ---------- utilidades locales ---------- */

function toolBtn(icon, label, onClick) {
  return el('button', { class: 'tool-btn', 'aria-label': label, title: label, onclick: onClick }, icon);
}

/** Modal simple de entrada de texto (guardar / cotizar). */
function openPromptModal({ title, label, placeholder = '', confirm = 'Aceptar', multiline = false, optional = false, onConfirm }) {
  const root = document.getElementById('modal-root');
  const last = document.activeElement;
  const backdrop = el('div', { class: 'modal-backdrop' });
  const input = multiline
    ? el('textarea', { class: 'field__input', rows: 3, placeholder })
    : el('input', { class: 'field__input', type: 'text', placeholder });
  const titleId = 'prompt-title';
  const panel = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
    el('div', { class: 'modal__header' }, [el('h2', { id: titleId, class: 'modal__title' }, title)]),
    el('div', { class: 'modal__body' }, [
      el('label', { class: 'field__label' }, label),
      input,
    ]),
    el('div', { class: 'modal__footer' }, [
      el('button', { class: 'btn btn--ghost', onclick: () => destroy() }, 'Cancelar'),
      el('button', { class: 'btn btn--primary', onclick: () => submit() }, confirm),
    ]),
  ]);

  function submit() {
    const val = input.value.trim();
    if (!optional && !val) { input.focus(); input.setAttribute('aria-invalid', 'true'); return; }
    destroy();
    onConfirm?.(val);
  }
  function destroy() {
    document.removeEventListener('keydown', onKey, true);
    backdrop.remove(); panel.remove();
    document.body.classList.remove('is-modal-open');
    last?.focus?.();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); destroy(); }
    else if (e.key === 'Enter' && !multiline) { e.preventDefault(); submit(); }
  }
  backdrop.addEventListener('click', destroy);
  document.addEventListener('keydown', onKey, true);
  root.append(backdrop, panel);
  document.body.classList.add('is-modal-open');
  setTimeout(() => input.focus(), 30);
}
