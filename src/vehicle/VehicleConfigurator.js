/**
 * VehicleConfigurator.js — Integra escena + carga GLTF + piezas + materiales.
 * Aplica una configuración (VehicleState.config) sobre el modelo 3D real.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Decodificador Draco local (public/draco): los GLB TMC v1 van comprimidos.
let _draco = null;
function makeLoader() {
  const l = new GLTFLoader();
  if (!_draco) { _draco = new DRACOLoader(); _draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`); }
  l.setDRACOLoader(_draco);
  return l;
}
import { SceneManager } from '../scene/SceneManager.js';
import { VehicleParts } from './VehicleParts.js';
import { MaterialManager } from './MaterialManager.js';
import { findOption, PART_LIBRARY, selectedParts } from '../data/catalog.js';

const RIM_SCALE = { 19: 1.0, 20: 1.035, 22: 1.07 };
const DROP_PER_LEVEL = 0.03; // metros por nivel de suspensión
const LIFT_PER_LEVEL = 0.04; // metros por nivel de levante (off-road)

export class VehicleConfigurator {
  /**
   * @param {HTMLElement} container
   * @param {object} vehicle  Entrada del catálogo de vehículos.
   */
  constructor(container, vehicle) {
    this.container = container;
    this.vehicle = vehicle;
    this.scene = new SceneManager(container);
    this.root = new THREE.Group();
    this.root.name = 'VehicleRoot';
    this.scene.add(this.root);
    this.parts = null;
    this.materials = null;
    this.spoiler = null;
    this._disposed = false;
    this._loader = makeLoader();
    this._partCache = new Map();   // url -> Promise<gltf>
    this._mounted = {};            // slot -> { code, nodes:[], hidden:[] }
    this._wanted = {};             // slot -> code solicitado (evita carreras async)
  }

  /**
   * Carga el modelo. Llama onProgress(0..1). Devuelve promesa que resuelve
   * cuando el modelo está listo, o rechaza ante error.
   */
  load({ onProgress } = {}) {
    const garageReady = this.scene.environment.ready.catch(() => null);
    return new Promise((resolve, reject) => {
      const loader = makeLoader();
      loader.load(
        this.vehicle.model.url,
        (gltf) => {
          if (this._disposed) return;
          garageReady.then(() => {
            if (this._disposed) return;
            try {
              this.model = gltf.scene;
              this.root.add(this.model);
              this._normalize();
              this.scene.add(this.root);
              this.root.updateMatrixWorld(true);
              this.parts = new VehicleParts(this.root, this.model);
              this.materials = new MaterialManager(this.parts);
              this._buildSpoiler();
              const cam = this.scene.camera;
              const inner = this.scene.environment.innerBounds || this.scene.environment.bounds;
              if (inner) {
                cam.setBounds(inner);
                const span = inner.getSize(new THREE.Vector3());
                const wallLimit = Math.min(span.x, span.z) * 0.32;
                cam.controls.maxDistance = THREE.MathUtils.clamp(Math.min(6.4, wallLimit), 3.6, 6.4);
              }
              this.resetView();
              this.scene.start();
              resolve({ availability: this.getAvailability() });
            } catch (err) {
              reject(err);
            }
          }).catch(reject);
        },
        (ev) => {
          if (ev.lengthComputable && onProgress) onProgress(ev.loaded / ev.total);
          else if (onProgress) onProgress(-1); // indeterminado
        },
        (err) => reject(err)
      );
    });
  }

  /** Centra el modelo, lo apoya en el piso y lo escala a un tamaño estándar. */
  _normalize() {
    this.model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const lengthAxis = size.x >= size.z ? size.x : size.z;
    // Convención TMC v1: el modelo ya viene en metros reales (no se reescala).
    let tmc = false;
    this.model.traverse((o) => { if (o.userData?.tmc_convention) tmc = true; });
    this.isTMC = tmc;
    const targetLength = 4.3;
    const scale = tmc ? 1 : (lengthAxis > 0 ? targetLength / lengthAxis : 1);
    this.model.scale.setScalar(scale);

    this.model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    this.model.position.x -= center.x;
    this.model.position.z -= center.z;
    this.model.position.y -= box.min.y;

    this.model.updateMatrixWorld(true);
    this._box = new THREE.Box3().setFromObject(this.model);
    this._size = this._box.getSize(new THREE.Vector3());
    this._lengthAxis = this._size.x >= this._size.z ? 'x' : 'z';
  }

  /** Construye un spoiler GT PROVISIONAL (sustituible por spoiler-gt.glb). */
  _buildSpoiler() {
    const s = this._size;
    const width = (this._lengthAxis === 'x' ? s.z : s.x) * 0.82;
    const lengthHalf = (this._lengthAxis === 'x' ? s.x : s.z) / 2;
    const height = s.y;

    const group = new THREE.Group();
    group.name = 'SpoilerGT';

    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.4, flatShading: true });
    const standMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1.0, roughness: 0.35, flatShading: true });

    // Perfil tipo airfoil simplificado (extrusión) + endplates + pedestales.
    // flatShading evita el aspecto de "plástico derretido" del shade smooth sin aristas.
    const wing = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, 0.36), wingMat);
    wing.castShadow = true;
    // leve ángulo de ataque
    wing.rotation.x = THREE.MathUtils.degToRad(-6);
    group.add(wing);
    // Gurney flap
    const gurney = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 0.018, 0.01), wingMat);
    gurney.position.set(0, 0.03, -0.18);
    gurney.castShadow = true;
    group.add(gurney);

    for (const dir of [-1, 1]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.22, 0.48), wingMat);
      plate.position.set(dir * width / 2, 0.01, 0);
      plate.castShadow = true;
      group.add(plate);
      // pedestal aluminio
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.22, 0.06), standMat);
      stand.position.set(dir * width * 0.30, -0.14, 0.02);
      stand.castShadow = true;
      group.add(stand);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.08), standMat);
      foot.position.set(dir * width * 0.30, -0.25, 0.02);
      group.add(foot);
    }

    // Posiciona el ala en la parte trasera, a la altura del techo.
    const deckY = this._box.min.y + height * 0.82;
    if (this._lengthAxis === 'x') {
      group.position.set(this._box.min.x + lengthHalf * 0.12, deckY, 0);
      group.rotation.y = Math.PI / 2;
    } else {
      group.position.set(0, deckY, this._box.min.z + lengthHalf * 0.12);
    }

    group.visible = false;
    this.model.add(group);
    this.spoiler = group;

    // Convención TMC v1: si el modelo trae ANCHOR_spoiler, el ala se monta ahí
    // y reemplaza al alerón de serie (PART_spoiler).
    // Con ANCHOR_spoiler el ala GT real llega como GLB (spoiler-gt.glb).
    this.hasAnchors = (this.parts?.anchors.size || 0) > 0;
  }

  /** Ala GT procedural: solo para modelos sin anclajes (convención legada). */
  setSpoiler(enabled) {
    if (this.spoiler) this.spoiler.visible = !!enabled && !this.hasAnchors;
  }

  /* ---------- Piezas GLB intercambiables (convención TMC v1) ---------- */

  _loadPart(url) {
    if (!this._partCache.has(url)) {
      this._partCache.set(url, new Promise((res, rej) => this._loader.load(url, res, undefined, rej)));
    }
    return this._partCache.get(url);
  }

  /** Sincroniza las piezas montadas con la configuración. */
  _syncParts(config) {
    if (!this.hasAnchors) return;
    const wanted = selectedParts(config, this.vehicle.id);
    for (const [slot, code] of Object.entries(wanted)) {
      const cur = this._mounted[slot]?.code || null;
      if (cur === code && this._wanted[slot] === code) continue;
      this._wanted[slot] = code;
      if (cur === code) continue;
      this._unmount(slot);
      if (code) this._mount(slot, code).catch((err) => console.warn(`[APEX] Pieza ${code} no disponible:`, err));
    }
  }

  _unmount(slot) {
    const m = this._mounted[slot];
    if (!m) return;
    m.nodes.forEach((n) => n.parent?.remove(n));
    m.hidden.forEach((n) => { n.visible = true; });
    delete this._mounted[slot];
    this._updateLift();
  }

  async _mount(slot, code) {
    const def = PART_LIBRARY[code];
    if (!def) return;
    const gltf = await this._loadPart(def.url);
    if (this._disposed || this._wanted[slot] !== code) return;
    this._unmount(slot);
    const src = gltf.scene;
    const shared = {
      Paint: [...this.parts.getMaterials('Paint')][0],
      Wheel1A: [...this.parts.getMaterials('Wheel1A')][0],
    };
    const prep = (node) => {
      node.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        const name = o.material?.name;
        if (shared[name]) o.material = shared[name]; // la pieza hereda pintura / color de rin
      });
      return node;
    };
    const mounted = { code, nodes: [], hidden: [] };
    const ats = [];
    src.traverse((o) => { if (o.name.startsWith('AT_')) ats.push(o); });
    for (const at of ats) {
      const target = at.name.slice(3);
      if (target === 'wheel' || target === 'wheel_front' || target === 'wheel_rear') {
        for (const w of this.parts.wheels) {
          const front = /^WHEEL_F/.test(w.slot || '');
          if ((target === 'wheel_front' && !front) || (target === 'wheel_rear' && front)) continue;
          const clone = prep(at.clone(true));
          clone.position.set(0, 0, 0);
          if (/R$/.test(w.slot || '')) clone.rotation.y = Math.PI; // cara exterior hacia -X
          w.group.add(clone);
          mounted.nodes.push(clone);
          const stock = w.group.getObjectByName(`${w.slot}_rim`);
          if (stock) { stock.visible = false; mounted.hidden.push(stock); }
          if (def.hideTire) {
            const tire = w.group.getObjectByName(`${w.slot}_tire`);
            if (tire) { tire.visible = false; mounted.hidden.push(tire); }
          }
        }
        continue;
      }
      const anchor = this.parts.getAnchor(target);
      if (!anchor) continue;
      const clone = prep(at.clone(true));
      clone.position.set(0, 0, 0);
      anchor.add(clone);
      mounted.nodes.push(clone);
    }
    for (const r of def.replaces || []) {
      const part = this.parts.getPart(r);
      if (part && part.visible) { part.visible = false; mounted.hidden.push(part); }
    }
    mounted.lift = def.lift || 0;
    this._mounted[slot] = mounted;
    this._updateLift();
  }

  /** Altura extra por llantas más grandes (p. ej. AT de la Raptor). */
  _updateLift() {
    if (!this.parts) return;
    const lift = Object.values(this._mounted).reduce((a, m) => a + (m.lift || 0), 0);
    this.parts.setPartLift(lift);
  }

  /** Aplica una configuración completa al modelo 3D. */
  apply(config) {
    if (!this.materials || !this.parts) return;
    const m = this.materials;
    m.setPaintColor(config.paint.color);
    m.setPaintFinish(config.paint.finish);
    m.setRimColor(config.rims.color);
    m.setRimDesign(config.rims.design);
    this.parts.setWheelScale(RIM_SCALE[config.rims.size] ?? 1);
    m.setCaliper(config.calipers.painted, config.calipers.color);
    m.setTint(config.tint.level);
    m.setLightsTinted(config.lights.tinted);
    const trim = findOption('interior.trim', config.interior.trim);
    m.setInteriorColor(trim?.color || '#16181d');
    this.parts.setRideDrop(config.suspension.drop * DROP_PER_LEVEL - (config.suspension.lift || 0) * LIFT_PER_LEVEL);
    this.setSpoiler(config.spoiler.type ? config.spoiler.type !== 'serie' : config.spoiler.enabled);
    this._syncParts(config);
  }

  /**
   * Determina qué controles pueden funcionar según los recursos presentes.
   * @returns {{materials:Set<string>}}
   */
  getAvailability() {
    const set = this.parts ? new Set(this.parts.availableMaterialNames()) : new Set();
    // Los anclajes se publican como 'anchor:<slot>' para habilitar piezas GLB.
    if (this.parts) for (const k of this.parts.anchors.keys()) set.add(`anchor:${k}`);
    return { materials: set };
  }

  setAutoRotate(v) {
    this.scene.camera.autoRotate = v;
  }

  get viewMode() {
    return this.scene.camera.mode;
  }

  setInteriorOffset(offset) {
    this.scene.camera.setInteriorOffset(offset);
  }

  getInteriorOffset() {
    return this.scene.camera.getInteriorOffset();
  }

  setViewMode(mode) {
    if (mode === 'interior') {
      this.setAutoRotate(false);
      const eye = this.parts ? this.parts.getDriverEye() : {
        position: new THREE.Vector3(0.38, 1.12, 0.12),
        target: new THREE.Vector3(0.3, 1.0, 1.6),
      };
      this.scene.camera.setInteriorView(eye.position, eye.target);
      return;
    }
    this.scene.camera.setExteriorView();
    this.resetView();
  }

  resetView() {
    if (this.scene.camera.mode === 'interior') {
      this.setViewMode('interior');
      return;
    }
    const len = this._size ? Math.max(this._size.x, this._size.z) : 4.3;
    const h = this._size ? this._size.y : 1.3;
    this.scene.camera.frame(5.6 * (len / 4.3), 1.9 * Math.max(1, h / 1.3));
    this.scene.camera.setTarget(0, this._size ? Math.max(0.6, this._size.y * 0.45) : 0.6, 0);
  }

  dispose() {
    this._disposed = true;
    this.scene.dispose();
  }
}
