/**
 * vehicles.js — Catálogo de vehículos (TUNING_MOTORCOL).
 *
 * Todos los vehículos usan modelos 3D reales con la convención TMC v1
 * (ver docs/CONVENCION_MODELOS_3D.md): nodos ANCHOR_<slot> para montar piezas.
 *
 * Para añadir un modelo: coloca el .glb en public/models/<id>/ y registra
 * aquí su entrada (model.url, specs, thumbnail).
 */

export const VEHICLES = [
  {
    id: 'brz',
    name: 'Subaru BRZ',
    tagline: 'Deportivo · Tuning completo (convención TMC v1)',
    category: 'Deportivo',
    manufacturer: 'Subaru',
    description:
      'Coupé deportivo de tracción trasera. Modelo preparado con piezas intercambiables ' +
      '(alerón, parachoques, capó, espejos, ruedas) y puntos de anclaje.',
    basePrice: 145_000_000,
    specs: { motor: '2.0 Bóxer', potencia: '200 hp', traccion: 'Trasera', '0-100': '7.6 s' },
    model: {
      url: 'models/brz/brz.glb',
      placeholder: false,
      credit: '2013 Subaru BRZ — Ddiaz Design (CC BY-NC-SA 4.0)',
    },
    thumbnail: 'thumbnails/brz.jpg',
    accent: '#1E5F8C',
  },
  {
    id: 'raptor',
    name: 'Ford F-150 Raptor',
    tagline: 'Pickup · Todoterreno / Dakar (convención TMC v1)',
    category: 'Pickup',
    manufacturer: 'Ford',
    description:
      'Pickup de alto desempeño todoterreno. Rines beadlock con llantas AT, levante de suspensión, ' +
      'parachoques con winche, barra LED, rack de platón con llanta de repuesto, snorkel y kit Dakar.',
    basePrice: 390_000_000,
    specs: { motor: '3.5 V6 EcoBoost', potencia: '450 hp', traccion: '4x4', '0-100': '5.8 s' },
    model: { url: 'models/raptor/raptor.glb', placeholder: false,
      credit: '2017 Ford F-150 Raptor — Ddiaz Design (CC BY-NC-SA 4.0)' },
    thumbnail: 'thumbnails/raptor.jpg',
    accent: '#1F4E8C',
  },
  {
    id: 'mustang',
    name: 'Ford Mustang GT',
    tagline: 'Muscle car · Estilo americano (convención TMC v1)',
    category: 'Deportivo',
    manufacturer: 'Ford',
    description:
      'Muscle car V8. Rines torque-thrust y deep-dish, capó con toma o shaker, ducktail o ala drag, ' +
      'kit muscle con escape cuádruple y franjas rally.',
    basePrice: 330_000_000,
    specs: { motor: '5.0 V8 Coyote', potencia: '480 hp', traccion: 'Trasera', '0-100': '4.3 s' },
    model: { url: 'models/mustang/mustang.glb', placeholder: false,
      credit: '2024 Ford Mustang GT — Ddiaz Design (CC BY-NC-SA 4.0)' },
    thumbnail: 'thumbnails/mustang.jpg',
    accent: '#B22234',
  },
  {
    id: 'huracan',
    name: 'Lamborghini Huracán',
    tagline: 'Superdeportivo · Kit GT3 de competición (convención TMC v1)',
    category: 'Deportivo',
    manufacturer: 'Lamborghini',
    description:
      'Superdeportivo V10. Ala cuello de cisne, kit GT3 widebody con splitter y canards, ' +
      'capó ventilado, aleta de tiburón y rines center-lock.',
    basePrice: 1_250_000_000,
    specs: { motor: '5.2 V10', potencia: '640 hp', traccion: 'AWD', '0-100': '2.9 s' },
    model: { url: 'models/huracan/huracan.glb', placeholder: false,
      credit: 'Lamborghini Huracán — Outlaw Games (CC BY-NC 4.0)' },
    thumbnail: 'thumbnails/huracan.jpg',
    accent: '#D9A400',
  },
];

export const CATEGORIES = ['Todos los vehículos', 'Deportivo', 'Pickup'];
export const MANUFACTURERS = ['Todos los fabricantes', 'Subaru', 'Ford', 'Lamborghini'];

export function getVehicle(id) {
  return VEHICLES.find((v) => v.id === id) || null;
}
