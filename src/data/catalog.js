/**
 * catalog.js — Catálogo de personalización, estado por defecto y motor de precios.
 *
 * Cada control declara el recurso del que depende:
 *   requires.material  -> nombre de material real del modelo (se verifica al cargar).
 *   requires.geometry  -> se resuelve de forma procedural sobre el modelo real.
 *   requires.anchor    -> nodo ANCHOR_<slot> en el GLB.
 */

/* Paleta de pintura con nombres de inspiración colombiana sutil. */
const PAINT_COLORS = [
  { name: 'Rojo Tunning', hex: '#D83A45' },
  { name: 'Negro Andino', hex: '#0B0D10' },
  { name: 'Plata Páramo', hex: '#C8CDD4' },
  { name: 'Blanco Cóndor', hex: '#F5F7FA' },
  { name: 'Oro Dorado', hex: '#C99A45' },
  { name: 'Azul Caribe', hex: '#1E5F8C' },
  { name: 'Verde Esmeralda', hex: '#0E7A5F' },
  { name: 'Grafito Urbano', hex: '#2A2E35' },
];

const RIM_COLORS = [
  { name: 'Plata', hex: '#C8CDD4' },
  { name: 'Negro mate', hex: '#1A1D22' },
  { name: 'Grafito', hex: '#3A3F47' },
  { name: 'Dorado', hex: '#C99A45' },
  { name: 'Bronce', hex: '#8C6B3F' },
];

const CALIPER_COLORS = [
  { name: 'Rojo', hex: '#D83A45' },
  { name: 'Dorado', hex: '#C99A45' },
  { name: 'Azul', hex: '#2F6DB5' },
  { name: 'Negro', hex: '#101216' },
];

/** Configuración por defecto (VehicleState base). */
export function defaultConfig() {
  return {
    paint: { color: '#D83A45', finish: 'solid' },
    rims: { design: 'pulido', size: 19, color: '#C8CDD4' },
    calipers: { painted: false, color: '#D83A45' },
    tint: { level: 0 }, // 0..5
    lights: { tinted: false },
    interior: { trim: 'estandar' },
    suspension: { drop: 0, lift: 0 }, // drop 0..4 · lift 0..3 (off-road)
    spoiler: { enabled: false, type: 'serie' },
    // Piezas de carrocería (GLB en public/models/parts) y opciones pendientes de recurso:
    extras: { bodykit: 'serie', hood: 'serie', mirrors: false,
      frontbumper: 'serie', lightbar: false, rack: false, snorkel: false, stripes: false, sharkfin: false },
  };
}

/**
 * Biblioteca de piezas 3D (convención TMC v1, ver docs/CONVENCION_MODELOS_3D.md).
 * Cada GLB trae nodos AT_<slot> que se montan en los ANCHOR_<slot> del vehículo;
 * `replaces` lista los PART_<slot> de fábrica que se ocultan al montarla.
 * El código coincide con piezas.codigo en la base de datos.
 */
export const PART_LIBRARY = {
  rim_cinco:       { url: 'models/parts/rim-cinco.glb',        slot: 'rims',    replaces: [] },
  rim_multirayo:   { url: 'models/parts/rim-multirayo.glb',    slot: 'rims',    replaces: [] },
  rim_malla:       { url: 'models/parts/rim-malla.glb',        slot: 'rims',    replaces: [] },
  spoiler_lip:     { url: 'models/parts/spoiler-lip.glb',      slot: 'spoiler', replaces: ['spoiler'] },
  spoiler_ducktail:{ url: 'models/parts/spoiler-ducktail.glb', slot: 'spoiler', replaces: ['spoiler'] },
  spoiler_gt:      { url: 'models/parts/spoiler-gt.glb',       slot: 'spoiler', replaces: ['spoiler'] },
  bodykit_street:  { url: 'models/parts/bodykit-street.glb',   slot: 'bodykit', replaces: [] },
  bodykit_track:   { url: 'models/parts/bodykit-track.glb',    slot: 'bodykit', replaces: ['bumper_front', 'bumper_rear'] },
  hood_vented:     { url: 'models/parts/hood-vented.glb',      slot: 'hood',    replaces: ['hood'] },
  mirrors_aero:    { url: 'models/parts/mirrors-aero.glb',     slot: 'mirrors', replaces: ['mirrors'] },
  // Ford F-150 Raptor · off-road / Dakar
  rim_beadlock:    { url: 'models/parts/rim-beadlock-raptor.glb',   slot: 'rims',        replaces: [], hideTire: true, lift: 0.032 },
  bumper_winch:    { url: 'models/parts/bumper-winch-raptor.glb',   slot: 'frontbumper', replaces: ['bumper_front'] },
  lightbar_led:    { url: 'models/parts/lightbar-raptor.glb',       slot: 'lightbar',    replaces: [] },
  rack_spare:      { url: 'models/parts/rack-spare-raptor.glb',     slot: 'rack',        replaces: [] },
  snorkel:         { url: 'models/parts/snorkel-raptor.glb',        slot: 'snorkel',     replaces: [] },
  bodykit_dakar:   { url: 'models/parts/bodykit-dakar-raptor.glb',  slot: 'bodykit',     replaces: [] },
  // Ford Mustang GT · estilo americano
  rim_torque:      { url: 'models/parts/rim-torque-mustang.glb',    slot: 'rims',    replaces: [] },
  rim_deepdish:    { url: 'models/parts/rim-deepdish-mustang.glb',  slot: 'rims',    replaces: [] },
  hood_scoop:      { url: 'models/parts/hood-scoop-mustang.glb',    slot: 'hood',    replaces: ['hood'] },
  hood_shaker:     { url: 'models/parts/hood-shaker-mustang.glb',   slot: 'hood',    replaces: ['hood'] },
  spoiler_mducktail:{ url: 'models/parts/spoiler-ducktail-mustang.glb', slot: 'spoiler', replaces: ['spoiler'] },
  spoiler_dragwing:{ url: 'models/parts/spoiler-dragwing-mustang.glb', slot: 'spoiler', replaces: ['spoiler'] },
  bodykit_muscle:  { url: 'models/parts/bodykit-muscle-mustang.glb', slot: 'bodykit', replaces: [] },
  stripes_rally:   { url: 'models/parts/stripes-mustang.glb',       slot: 'stripes', replaces: [] },
  // Lamborghini Huracán · GT3
  rim_centerlock:  { url: 'models/parts/rim-centerlock-huracan.glb', slot: 'rims',    replaces: [] },
  spoiler_gt3:     { url: 'models/parts/spoiler-gt3-huracan.glb',    slot: 'spoiler', replaces: [] },
  hood_gt3:        { url: 'models/parts/hood-gt3-huracan.glb',       slot: 'hood',    replaces: ['hood'] },
  bodykit_gt3:     { url: 'models/parts/bodykit-gt3-huracan.glb',    slot: 'bodykit', replaces: [] },
  sharkfin:        { url: 'models/parts/sharkfin-huracan.glb',       slot: 'sharkfin', replaces: [] },
};

/** ¿La opción/control es compatible con el vehículo? (`vehicles` ausente = todos). */
export function isCompatible(item, vehicleId) {
  return !item?.vehicles || !vehicleId || item.vehicles.includes(vehicleId);
}

/**
 * Completa una configuración con los valores por defecto y migra formatos
 * anteriores (spoiler.enabled, extras booleanos).
 */
export function normalizeConfig(cfg) {
  const base = defaultConfig();
  if (!cfg || typeof cfg !== 'object') return base;
  const out = { ...base };
  for (const k of Object.keys(base)) {
    out[k] = (base[k] && typeof base[k] === 'object') ? { ...base[k], ...(cfg[k] || {}) } : (cfg[k] ?? base[k]);
  }
  if (!cfg.spoiler?.type) out.spoiler.type = cfg.spoiler?.enabled ? 'gt' : 'serie';
  out.spoiler.enabled = out.spoiler.type !== 'serie';
  if (typeof out.extras.bodykit === 'boolean') out.extras.bodykit = out.extras.bodykit ? 'street' : 'serie';
  if (typeof out.extras.hood === 'boolean') out.extras.hood = out.extras.hood ? 'vented' : 'serie';
  delete out.extras.bumper; delete out.extras.skirts;
  out.suspension.lift = Number(out.suspension.lift) || 0;
  return out;
}

/** Devuelve el código de pieza (PART_LIBRARY) que corresponde a cada slot. */
export function selectedParts(cfg, vehicleId) {
  const out = {};
  for (const group of CATALOG) {
    for (const ctrl of group.controls) {
      if (!isCompatible(ctrl, vehicleId)) continue;
      const val = getPath(cfg, ctrl.path);
      if (Array.isArray(ctrl.options)) {
        for (const o of ctrl.options) {
          if (o.part && PART_LIBRARY[o.part]) out[PART_LIBRARY[o.part].slot] ??= null;
        }
        const opt = ctrl.options.find((o) => o.value === val);
        if (opt?.part && isCompatible(opt, vehicleId)) out[PART_LIBRARY[opt.part].slot] = opt.part;
      } else if (ctrl.part && PART_LIBRARY[ctrl.part]) {
        out[PART_LIBRARY[ctrl.part].slot] = val ? ctrl.part : null;
      }
    }
  }
  return out;
}

/**
 * CATALOG — grupos de controles para el panel de configuración.
 * kind: 'palette' | 'segmented' | 'range' | 'toggle' | 'select'
 */
export const CATALOG = [
  {
    id: 'pintura',
    title: 'Pintura y acabado',
    controls: [
      {
        id: 'paint.color',
        label: 'Color de carrocería',
        kind: 'palette',
        palette: PAINT_COLORS,
        allowCustom: true,
        path: ['paint', 'color'],
        requires: { material: 'Paint' },
      },
      {
        id: 'paint.finish',
        label: 'Tipo de pintura',
        kind: 'segmented',
        path: ['paint', 'finish'],
        requires: { material: 'Paint' },
        options: [
          { value: 'solid', label: 'Sólida', price: 0 },
          { value: 'metallic', label: 'Metalizada', price: 4_500_000 },
          { value: 'matte', label: 'Mate', price: 6_500_000 },
        ],
      },
    ],
  },
  {
    id: 'ruedas',
    title: 'Rines',
    controls: [
      {
        id: 'rims.design',
        label: 'Diseño de rin',
        kind: 'select',
        path: ['rims', 'design'],
        requires: { material: 'Wheel1A' },
        options: [
          { value: 'pulido', label: 'De serie · pulido', price: 0 },
          { value: 'turbofan', label: 'De serie · turbofan mate', price: 2_200_000 },
          { value: 'cinco', label: 'Forjado 5 radios cóncavo', price: 3_900_000, part: 'rim_cinco', vehicles: ['brz'], requires: { anchor: 'wheel_FL' } },
          { value: 'multirayo', label: 'Multirayo direccional (20)', price: 4_600_000, part: 'rim_multirayo', vehicles: ['brz'], requires: { anchor: 'wheel_FL' } },
          { value: 'malla', label: 'Malla cruzada competición', price: 5_200_000, part: 'rim_malla', vehicles: ['brz'], requires: { anchor: 'wheel_FL' } },
          { value: 'beadlock', label: 'Beadlock todoterreno + llanta AT 35"', price: 9_800_000, part: 'rim_beadlock', vehicles: ['raptor'] },
          { value: 'torque', label: 'Torque-thrust clásico (muscle)', price: 4_400_000, part: 'rim_torque', vehicles: ['mustang'] },
          { value: 'deepdish', label: 'Deep-dish cromado', price: 5_100_000, part: 'rim_deepdish', vehicles: ['mustang'] },
          { value: 'centerlock', label: 'Center-lock GT3 (tuerca central)', price: 7_900_000, part: 'rim_centerlock', vehicles: ['huracan'] },
        ],
      },
      {
        id: 'rims.size',
        label: 'Tamaño de rin',
        kind: 'segmented',
        path: ['rims', 'size'],
        requires: { geometry: true, material: 'Wheel1A' },
        options: [
          { value: 19, label: '19"', price: 0 },
          { value: 20, label: '20"', price: 3_500_000 },
          { value: 22, label: '22"', price: 6_800_000 },
        ],
      },
      {
        id: 'rims.color',
        label: 'Color de rin',
        kind: 'palette',
        palette: RIM_COLORS,
        allowCustom: true,
        path: ['rims', 'color'],
        requires: { material: 'Wheel1A' },
      },
    ],
  },
  {
    id: 'frenos',
    title: 'Frenos',
    controls: [
      {
        id: 'calipers.painted',
        label: 'Pinzas de freno pintadas',
        kind: 'toggle',
        path: ['calipers', 'painted'],
        price: 1_500_000,
        requires: { material: 'CaliperAZone' },
      },
      {
        id: 'calipers.color',
        label: 'Color de pinzas',
        kind: 'palette',
        palette: CALIPER_COLORS,
        allowCustom: false,
        path: ['calipers', 'color'],
        requires: { material: 'CaliperAZone' },
        enabledWhen: (s) => s.calipers.painted,
      },
    ],
  },
  {
    id: 'cristales',
    title: 'Cristales y luces',
    controls: [
      {
        id: 'tint.level',
        label: 'Polarizado',
        kind: 'range',
        path: ['tint', 'level'],
        min: 0,
        max: 5,
        step: 1,
        unitPrice: 700_000,
        labels: ['Sin polarizar', 'Claro', 'Medio', 'Fuerte', 'Muy oscuro', 'Limusina'],
        requires: { material: 'GlassMtl' },
      },
      {
        id: 'lights.tinted',
        label: 'Luces ahumadas (dark)',
        kind: 'toggle',
        path: ['lights', 'tinted'],
        price: 1_800_000,
        requires: { material: 'LightA' },
      },
    ],
  },
  {
    id: 'postura',
    title: 'Suspensión y aerodinámica',
    controls: [
      {
        id: 'suspension.drop',
        label: 'Suspensión (altura)',
        kind: 'range',
        path: ['suspension', 'drop'],
        min: 0,
        max: 4,
        step: 1,
        unitPrice: 800_000,
        flatPrice: 3_200_000, // kit de coilovers si drop > 0
        labels: ['De fábrica', 'Leve', 'Deportiva', 'Baja', 'Extrema'],
        requires: { geometry: true },
        vehicles: ['brz', 'mustang', 'huracan'],
      },
      {
        id: 'suspension.lift',
        label: 'Levante de suspensión (off-road)',
        kind: 'range',
        path: ['suspension', 'lift'],
        min: 0,
        max: 3,
        step: 1,
        unitPrice: 1_900_000,
        flatPrice: 4_500_000,
        labels: ['De fábrica', '2"', '3"', '4" (Dakar)'],
        requires: { geometry: true },
        vehicles: ['raptor'],
      },
      {
        id: 'spoiler.type',
        label: 'Alerón',
        kind: 'segmented',
        vehicles: ['brz', 'mustang', 'huracan'],
        path: ['spoiler', 'type'],
        requires: { geometry: true },
        options: [
          { value: 'serie', label: 'De serie', price: 0 },
          { value: 'lip', label: 'Lip carbono', price: 1_900_000, part: 'spoiler_lip', vehicles: ['brz'], requires: { anchor: 'spoiler' } },
          { value: 'ducktail', label: 'Ducktail', price: 3_800_000, part: 'spoiler_ducktail', vehicles: ['brz'], requires: { anchor: 'spoiler' } },
          { value: 'gt', label: 'Ala GT', price: 5_400_000, part: 'spoiler_gt', vehicles: ['brz'] },
          { value: 'mducktail', label: 'Ducktail muscle', price: 3_600_000, part: 'spoiler_mducktail', vehicles: ['mustang'] },
          { value: 'dragwing', label: 'Ala drag alta', price: 4_900_000, part: 'spoiler_dragwing', vehicles: ['mustang'] },
          { value: 'gt3', label: 'Ala GT3 cuello de cisne', price: 11_500_000, part: 'spoiler_gt3', vehicles: ['huracan'] },
        ],
      },
    ],
  },
  {
    id: 'interior',
    title: 'Interior',
    controls: [
      {
        id: 'interior.trim',
        label: 'Tapizado',
        kind: 'select',
        path: ['interior', 'trim'],
        requires: { material: 'InteriorColour1A' },
        options: [
          { value: 'estandar', label: 'Estándar (tela técnica)', price: 0, color: '#16181d' },
          { value: 'cuero-negro', label: 'Cuero premium negro', price: 8_500_000, color: '#0d0e11' },
          { value: 'cuero-rojo', label: 'Cuero rojo deportivo', price: 9_500_000, color: '#5a1418' },
          { value: 'cuero-cognac', label: 'Cuero cognac', price: 9_000_000, color: '#6b4423' },
        ],
      },
    ],
  },
  {
    id: 'carroceria',
    title: 'Carrocería y estilo',
    controls: [
      {
        id: 'extras.bodykit',
        label: 'Kit de carrocería',
        kind: 'segmented',
        path: ['extras', 'bodykit'],
        requires: { anchor: 'bumper_front' },
        options: [
          { value: 'serie', label: 'De serie', price: 0 },
          { value: 'street', label: 'Street (lip, faldones, difusor)', price: 8_500_000, part: 'bodykit_street', vehicles: ['brz'] },
          { value: 'track', label: 'Track (parachoques + aero)', price: 14_500_000, part: 'bodykit_track', vehicles: ['brz'] },
          { value: 'dakar', label: 'Dakar (guardabarros, skid plate, estribos)', price: 12_500_000, part: 'bodykit_dakar', vehicles: ['raptor'] },
          { value: 'muscle', label: 'Muscle (splitter, flares, difusor, escape ×4)', price: 11_800_000, part: 'bodykit_muscle', vehicles: ['mustang'] },
          { value: 'gt3', label: 'GT3 widebody (splitter, canards, difusor)', price: 24_000_000, part: 'bodykit_gt3', vehicles: ['huracan'] },
        ],
      },
      {
        id: 'extras.hood',
        label: 'Capó',
        kind: 'segmented',
        path: ['extras', 'hood'],
        requires: { anchor: 'hood' },
        options: [
          { value: 'serie', label: 'De serie', price: 0 },
          { value: 'vented', label: 'Carbono con tomas de aire', price: 7_800_000, part: 'hood_vented', vehicles: ['brz'] },
          { value: 'scoop', label: 'Con toma de aire (scoop)', price: 5_200_000, part: 'hood_scoop', vehicles: ['mustang'] },
          { value: 'shaker', label: 'Shaker', price: 6_900_000, part: 'hood_shaker', vehicles: ['mustang'] },
          { value: 'gt3', label: 'GT3 con extractores', price: 9_500_000, part: 'hood_gt3', vehicles: ['huracan'] },
        ],
      },
      {
        id: 'mirrors',
        label: 'Espejos aerodinámicos',
        kind: 'toggle',
        path: ['extras', 'mirrors'],
        price: 2_100_000,
        part: 'mirrors_aero',
        vehicles: ['brz'],
        requires: { anchor: 'mirror_L' },
      },
      {
        id: 'extras.frontbumper', label: 'Parachoques delantero', kind: 'segmented', path: ['extras', 'frontbumper'], vehicles: ['raptor'],
        requires: { anchor: 'bumper_front' },
        options: [
          { value: 'serie', label: 'De serie', price: 0 },
          { value: 'winch', label: 'Acero con winche', price: 8_900_000, part: 'bumper_winch' },
        ],
      },
      { id: 'lightbar', label: 'Barra LED de techo', kind: 'toggle', path: ['extras', 'lightbar'], price: 2_800_000, part: 'lightbar_led', vehicles: ['raptor'], requires: { anchor: 'roof' } },
      { id: 'rack', label: 'Rack de platón con llanta de repuesto', kind: 'toggle', path: ['extras', 'rack'], price: 6_400_000, part: 'rack_spare', vehicles: ['raptor'], requires: { anchor: 'body' } },
      { id: 'snorkel', label: 'Snorkel', kind: 'toggle', path: ['extras', 'snorkel'], price: 2_300_000, part: 'snorkel', vehicles: ['raptor'], requires: { anchor: 'body' } },
      { id: 'stripes', label: 'Franjas rally (racing stripes)', kind: 'toggle', path: ['extras', 'stripes'], price: 2_600_000, part: 'stripes_rally', vehicles: ['mustang'], requires: { anchor: 'body' } },
      { id: 'sharkfin', label: 'Aleta de tiburón (shark fin)', kind: 'toggle', path: ['extras', 'sharkfin'], price: 3_400_000, part: 'sharkfin', vehicles: ['huracan'], requires: { anchor: 'body' } },
    ],
  },
];

/* ---------- utilidades de estado ---------- */

export function getPath(obj, path) {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setPath(obj, path, value) {
  const clone = JSON.parse(JSON.stringify(obj));
  let o = clone;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  o[path[path.length - 1]] = value;
  return clone;
}

/* ---------- motor de precios ---------- */

/**
 * Calcula el desglose de precio a partir del vehículo base y la configuración.
 * Devuelve { base, items:[{label, amount}], total }.
 */
export function computePrice(vehicle, config) {
  const items = [];
  const vid = vehicle?.id;
  const base = vehicle?.basePrice ?? 0;

  // Acabado de pintura
  const finish = findOption('paint.finish', config.paint.finish);
  if (finish && finish.price) items.push({ label: `Pintura ${finish.label.toLowerCase()}`, amount: finish.price });

  // Rines: diseño + tamaño
  const design = findOption('rims.design', config.rims.design);
  if (design && design.price) items.push({ label: `Rines ${design.label}`, amount: design.price });
  const size = findOption('rims.size', config.rims.size);
  if (size && size.price) items.push({ label: `Rines de ${size.label}`, amount: size.price });

  // Frenos
  if (config.calipers.painted) items.push({ label: 'Pinzas de freno pintadas', amount: 1_500_000 });

  // Polarizado
  if (config.tint.level > 0) items.push({ label: `Polarizado (nivel ${config.tint.level})`, amount: config.tint.level * 700_000 });

  // Luces
  if (config.lights.tinted) items.push({ label: 'Luces ahumadas', amount: 1_800_000 });

  // Suspensión
  if (config.suspension.lift > 0 && vid === 'raptor') {
    items.push({ label: `Kit de levante (nivel ${config.suspension.lift})`, amount: 4_500_000 + config.suspension.lift * 1_900_000 });
  }
  if (config.suspension.drop > 0 && vid !== 'raptor') {
    items.push({ label: 'Kit de suspensión (coilovers)', amount: 3_200_000 + config.suspension.drop * 800_000 });
  }

  // Alerón
  const spoiler = findOption('spoiler.type', config.spoiler.type);
  if (spoiler && spoiler.price) items.push({ label: `Alerón ${spoiler.label}`, amount: spoiler.price });

  // Interior
  const trim = findOption('interior.trim', config.interior.trim);
  if (trim && trim.price) items.push({ label: trim.label, amount: trim.price });

  // Carrocería
  const kit = findOption('extras.bodykit', config.extras.bodykit);
  if (kit && kit.price) items.push({ label: `Body kit ${kit.label}`, amount: kit.price });
  const hood = findOption('extras.hood', config.extras.hood);
  if (hood && hood.price) items.push({ label: `Capó ${hood.label.toLowerCase()}`, amount: hood.price });
  const fb = findOption('extras.frontbumper', config.extras.frontbumper);
  if (vid === 'raptor' && fb && fb.price) items.push({ label: `Bumper ${fb.label.toLowerCase()}`, amount: fb.price });
  for (const id of ['lightbar', 'rack', 'snorkel', 'stripes', 'sharkfin']) {
    const c = findControl(id);
    if (c && config.extras[id] && isCompatible(c, vid)) items.push({ label: c.label, amount: c.price });
  }
  if (config.extras.mirrors && isCompatible(findControl('mirrors'), vid)) items.push({ label: 'Espejos aerodinámicos', amount: 2_100_000 });

  const total = items.reduce((sum, it) => sum + it.amount, base);
  return { base, items, total };
}

function findControl(controlId) {
  for (const g of CATALOG) for (const c of g.controls) if (c.id === controlId) return c;
  return null;
}

/** Busca una opción (value) dentro de un control del catálogo por su id. */
export function findOption(controlId, value) {
  for (const group of CATALOG) {
    for (const ctrl of group.controls) {
      if (ctrl.id === controlId && Array.isArray(ctrl.options)) {
        return ctrl.options.find((o) => o.value === value) || null;
      }
    }
  }
  return null;
}
