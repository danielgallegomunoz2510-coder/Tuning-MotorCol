/**
 * VehicleParts.js — Analiza el modelo cargado y expone sus PIEZAS REALES.
 *
 * Los modelos asignan materiales con nombre (Paint, Wheel1A, GlassMtl,
 * CaliperAZone, LightA, InteriorColour*). Agrupamos mallas por material para
 * editar piezas reales y, para operaciones geométricas (tamaño de rin,
 * suspensión), agrupamos por proximidad las 4 ruedas.
 */

import * as THREE from 'three';

/** Materiales que NUNCA deben entrar en el grupo de ruedas. */
const NON_WHEEL_MATERIALS = new Set(['Paint', 'GlassMtl', 'GlassRed', 'GlassAmber', 'GlassLightBlue']);

export class VehicleParts {
  constructor(root, model) {
    this.root = root;        // THREE.Group raíz
    this.model = model;      // THREE.Group del GLTF (cuerpo tras extraer ruedas)
    this.materialsByName = new Map();   // name -> material (primer instancia)
    this.materialSetsByName = new Map();// name -> Set<material>
    this.meshesByMaterial = new Map();  // name -> Mesh[]
    this.wheels = [];                   // [{ group, center:THREE.Vector3, radius }]
    this.bodyBaseY = model.position.y;

    this.anchors = new Map();   // slot -> Object3D  (nodos ANCHOR_<slot>)
    this.slots = new Map();     // slot -> Object3D  (nodos PART_<slot>)

    this._index();
    this._indexNamedNodes();
    if (!this._useNamedWheels()) this._buildWheelGroups();
  }

  /**
   * Convención TMC v1 (ver docs/CONVENCION_MODELOS_3D.md): si el GLB trae nodos
   * PART_<slot>, ANCHOR_<slot> y WHEEL_<FL|FR|RL|RR>, se usan directamente.
   */
  _indexNamedNodes() {
    this.model.traverse((obj) => {
      if (obj.name.startsWith('ANCHOR_')) this.anchors.set(obj.name.slice(7), obj);
      else if (obj.name.startsWith('PART_')) this.slots.set(obj.name.slice(5), obj);
    });
  }

  getAnchor(slot) { return this.anchors.get(slot) || null; }
  getPart(slot) { return this.slots.get(slot) || null; }

  /** Usa los nodos WHEEL_* del GLB (pivote ya en el centro de cada rueda). */
  _useNamedWheels() {
    const nodes = ['FL', 'FR', 'RL', 'RR'].map((p) => this.model.getObjectByName('WHEEL_' + p)).filter(Boolean);
    if (nodes.length !== 4) return false;
    this.root.updateMatrixWorld(true);
    for (const node of nodes) {
      const box = new THREE.Box3().setFromObject(node);
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.y, size.z, size.x) / 2 || 0.33;
      // Se cuelga del root (como en el modo legado) para que la suspensión
      // baje solo la carrocería y no las ruedas.
      this.root.attach(node);
      this.wheels.push({ group: node, center: node.position.clone(), radius, baseY: node.position.y, slot: node.name });
    }
    return true;
  }

  /** Indexa materiales y mallas por nombre de material. */
  _index() {
    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (!m || !m.name) continue;
        if (!this.materialsByName.has(m.name)) this.materialsByName.set(m.name, m);
        if (!this.materialSetsByName.has(m.name)) this.materialSetsByName.set(m.name, new Set());
        this.materialSetsByName.get(m.name).add(m);
        if (!this.meshesByMaterial.has(m.name)) this.meshesByMaterial.set(m.name, []);
        this.meshesByMaterial.get(m.name).push(obj);
      }
    });
  }

  /** ¿El material existe realmente en el modelo? */
  hasMaterial(name) {
    return this.materialsByName.has(name);
  }

  getMaterials(name) {
    return this.materialSetsByName.get(name) || new Set();
  }

  availableMaterialNames() {
    return new Set(this.materialsByName.keys());
  }

  /**
   * Agrupa las mallas de cada rueda por proximidad usando los centros de los
   * meshes con material 'Wheel1A'. Crea 4 grupos pivotados en el centro de
   * cada rueda para poder escalarlas (tamaño de rin) sin romper el modelo.
   */
  _buildWheelGroups() {
    const rimMeshes = this.meshesByMaterial.get('Wheel1A') || [];
    if (!rimMeshes.length) return;

    this.root.updateMatrixWorld(true);

    // Centro del modelo en XZ para clasificar por cuadrantes.
    const modelBox = new THREE.Box3().setFromObject(this.model);
    const modelCenter = modelBox.getCenter(new THREE.Vector3());

    // 4 cuadrantes: FL, FR, RL, RR según signos de (x - cx) y (z - cz).
    const quadrants = { ff: [], fb: [], bf: [], bb: [] };
    const centerOf = (mesh) => new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());

    for (const mesh of rimMeshes) {
      const c = centerOf(mesh);
      const key = (c.x >= modelCenter.x ? 'f' : 'b') + (c.z >= modelCenter.z ? 'f' : 'b');
      quadrants[key].push(c);
    }

    const wheelCenters = [];
    for (const key of Object.keys(quadrants)) {
      const pts = quadrants[key];
      if (!pts.length) continue;
      const avg = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
      wheelCenters.push(avg);
    }
    if (wheelCenters.length < 2) return; // no se pudo resolver; se omite agrupado

    // Radio aproximado de rueda a partir del bbox de un rim.
    const rimBox = new THREE.Box3().setFromObject(rimMeshes[0]);
    const rimSize = rimBox.getSize(new THREE.Vector3());
    const radius = Math.max(rimSize.x, rimSize.y, rimSize.z) * 0.9 || 0.35;

    // Para cada centro, crear grupo pivote y mover las mallas cercanas.
    for (const center of wheelCenters) {
      const group = new THREE.Group();
      group.position.copy(center);
      this.root.add(group);

      // Reunir candidatos (todos los meshes del cuerpo) y mover los cercanos.
      const toMove = [];
      this.model.traverse((obj) => {
        if (!obj.isMesh) return;
        const matName = obj.material?.name;
        if (matName && NON_WHEEL_MATERIALS.has(matName)) return; // no tocar carrocería/cristales
        const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
        const dxz = Math.hypot(c.x - center.x, c.z - center.z);
        if (dxz <= radius * 1.25 && c.y <= center.y + radius * 1.1) toMove.push(obj);
      });
      for (const mesh of toMove) group.attach(mesh); // preserva transform mundial

      this.wheels.push({ group, center: center.clone(), radius, baseY: group.position.y });
    }
  }

  /**
   * Escala las ruedas (tamaño de rin) manteniéndolas apoyadas en el piso.
   * @param {number} factor  Ej: 1.0 (19"), 1.03 (20"), 1.07 (22").
   */
  setWheelScale(factor) {
    for (const w of this.wheels) {
      w.group.scale.setScalar(factor);
      // Compensa para que la base de la rueda siga tocando el piso.
      w.group.position.y = w.baseY + (factor - 1) * w.radius + (this._partLift || 0);
    }
    this._factor = factor;
  }

  /** Eleva ruedas y carrocería (llantas de mayor diámetro montadas como pieza). */
  setPartLift(lift) {
    this._partLift = lift;
    this.setWheelScale(this._factor ?? 1);
    this.setRideDrop(this._drop ?? 0);
  }

  /**
   * Punto de vista del conductor (LHD, lado +X según TMC v1) para la cámara
   * en primera persona.
   * @returns {{ position: THREE.Vector3, target: THREE.Vector3 }}
   */
  getDriverEye() {
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let found = false;
    const interiorNode = this.getPart('interior');
    if (interiorNode) {
      box.setFromObject(interiorNode);
      found = Number.isFinite(box.min.x);
    }
    if (!found) {
      box.makeEmpty();
      for (const [name, meshes] of this.meshesByMaterial) {
        if (!/interior/i.test(name)) continue;
        for (const mesh of meshes) {
          box.expandByObject(mesh);
          found = true;
        }
      }
    }
    if (!found) {
      const b = new THREE.Box3().setFromObject(this.model);
      const s = b.getSize(new THREE.Vector3());
      const c = b.getCenter(new THREE.Vector3());
      const position = new THREE.Vector3(c.x + s.x * 0.18, b.min.y + s.y * 0.56, c.z + s.z * 0.06);
      const target = position.clone().add(new THREE.Vector3(0, -0.1, Math.max(1.4, s.z * 0.4)));
      return { position, target };
    }
    const s = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const position = new THREE.Vector3(
      c.x + Math.min(0.42, s.x * 0.22),
      box.min.y + Math.max(0.48, Math.min(s.y * 0.62, s.y - 0.18)),
      c.z + s.z * 0.04,
    );
    const target = position.clone().add(new THREE.Vector3(-0.04, -0.12, Math.max(1.15, s.z * 0.42)));
    return { position, target };
  }

  /**
   * Baja/sube la carrocería respecto a las ruedas (suspensión).
   * @param {number} drop  Metros a bajar (0..~0.12).
   */
  setRideDrop(drop) {
    this._drop = drop;
    this.model.position.y = this.bodyBaseY - drop + (this._partLift || 0);
  }
}
