/**
 * MaterialManager.js — Aplica cambios sobre los MATERIALES REALES del modelo.
 * Guarda los valores originales para poder restaurarlos (p. ej. al desactivar
 * polarizado o luces ahumadas).
 */

import * as THREE from 'three';
import { hexToInt } from '../utils/helpers.js';

export class MaterialManager {
  /** @param {import('./VehicleParts.js').VehicleParts} parts */
  constructor(parts) {
    this.parts = parts;
    this._originals = new WeakMap();
    // Captura originales de los materiales que vamos a modificar.
    for (const name of ['Paint', 'Wheel1A', 'CaliperAZone', 'GlassMtl', 'GlassRed', 'GlassAmber', 'GlassLightBlue', 'GlassLightClear', 'LightA', 'InteriorColour1A', 'InteriorColour2A', 'InteriorA']) {
      for (const m of parts.getMaterials(name)) this._snapshot(m);
    }
    try { this._upgradePaint(); } catch { /* si un GLB no trae Paint, se sigue con el material original */ }
  }

  /** Laca ligera (clearcoat) solo en pintura: se ve más a “coche” sin postproceso. */
  _upgradePaint() {
    const meshes = this.parts.meshesByMaterial.get('Paint') || [];
    const swapped = new Map();
    for (const mesh of meshes) {
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const next = list.map((m) => {
        if (!m || m.name !== 'Paint' || m.isMeshPhysicalMaterial) return m;
        if (swapped.has(m)) return swapped.get(m);
        const p = new THREE.MeshPhysicalMaterial({
          color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
          map: m.map || null,
          normalMap: m.normalMap || null,
          roughnessMap: m.roughnessMap || null,
          metalnessMap: m.metalnessMap || null,
          aoMap: m.aoMap || null,
          roughness: m.roughness ?? 0.4,
          metalness: m.metalness ?? 0.2,
          envMapIntensity: m.envMapIntensity ?? 1.15,
          transparent: m.transparent === true,
          opacity: m.opacity ?? 1,
          side: m.side,
          clearcoat: 0.8,
          clearcoatRoughness: 0.14,
        });
        p.name = 'Paint';
        swapped.set(m, p);
        this._snapshot(p);
        return p;
      });
      mesh.material = Array.isArray(mesh.material) ? next : next[0];
    }
    for (const [oldM, neu] of swapped) {
      const set = this.parts.materialSetsByName.get('Paint');
      if (set) {
        set.delete(oldM);
        set.add(neu);
      }
      if (this.parts.materialsByName.get('Paint') === oldM) {
        this.parts.materialsByName.set('Paint', neu);
      }
    }
  }

  _snapshot(m) {
    if (!m || this._originals.has(m)) return;
    this._originals.set(m, {
      color: m.color ? m.color.clone() : null,
      emissive: m.emissive ? m.emissive.clone() : null,
      emissiveIntensity: m.emissiveIntensity ?? 1,
      roughness: m.roughness ?? 0.5,
      metalness: m.metalness ?? 0.5,
      opacity: m.opacity ?? 1,
      transparent: m.transparent ?? false,
      envMapIntensity: m.envMapIntensity ?? 1,
    });
  }

  _forEach(name, fn) {
    for (const m of this.parts.getMaterials(name)) fn(m);
  }

  /* ---------- Pintura ---------- */

  setPaintColor(hex) {
    this._forEach('Paint', (m) => {
      m.color?.setHex(hexToInt(hex));
      m.needsUpdate = true;
    });
  }

  setPaintFinish(finish) {
    const presets = {
      solid: { metalness: 0.18, roughness: 0.38, envMapIntensity: 1.15, clearcoat: 0.9, clearcoatRoughness: 0.12 },
      metallic: { metalness: 0.92, roughness: 0.18, envMapIntensity: 1.55, clearcoat: 1, clearcoatRoughness: 0.08 },
      matte: { metalness: 0.05, roughness: 0.78, envMapIntensity: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.55 },
    };
    const p = presets[finish] || presets.solid;
    this._forEach('Paint', (m) => {
      m.metalness = p.metalness;
      m.roughness = p.roughness;
      m.envMapIntensity = p.envMapIntensity;
      if ('clearcoat' in m) {
        m.clearcoat = p.clearcoat;
        m.clearcoatRoughness = p.clearcoatRoughness;
      }
      m.needsUpdate = true;
    });
  }

  /* ---------- Rines ---------- */

  setRimColor(hex) {
    this._forEach('Wheel1A', (m) => {
      m.color?.setHex(hexToInt(hex));
      m.needsUpdate = true;
    });
  }

  setRimDesign(design) {
    // 'pulido' = brillante metálico; 'turbofan' = mate oscuro.
    const p = design === 'turbofan'
      ? { metalness: 0.4, roughness: 0.7 }
      : { metalness: 1.0, roughness: 0.2 };
    this._forEach('Wheel1A', (m) => {
      m.metalness = p.metalness;
      m.roughness = p.roughness;
      m.envMapIntensity = design === 'turbofan' ? 0.7 : 1.35;
      m.needsUpdate = true;
    });
  }

  /* ---------- Frenos (pinzas) ---------- */

  setCaliper(painted, hex) {
    this._forEach('CaliperAZone', (m) => {
      const orig = this._originals.get(m);
      if (painted) {
        m.color?.setHex(hexToInt(hex));
        if (m.emissive) { m.emissive.setHex(hexToInt(hex)); m.emissiveIntensity = 0.12; }
        m.metalness = 0.5;
        m.roughness = 0.35;
      } else if (orig) {
        m.color?.copy(orig.color || new THREE.Color(0x222222));
        if (m.emissive && orig.emissive) m.emissive.copy(orig.emissive);
        m.emissiveIntensity = orig.emissiveIntensity;
        m.metalness = orig.metalness;
        m.roughness = orig.roughness;
      }
      m.needsUpdate = true;
    });
  }

  /* ---------- Polarizado (cristales) ---------- */

  setTint(level) {
    const names = ['GlassMtl', 'GlassLightBlue'];
    const t = Math.max(0, Math.min(5, level)) / 5; // 0..1
    for (const name of names) {
      this._forEach(name, (m) => {
        const orig = this._originals.get(m) || {};
        if (level <= 0) {
          if (orig.color) m.color.copy(orig.color);
          m.opacity = orig.opacity ?? 1;
          m.transparent = orig.transparent ?? false;
        } else {
          // Oscurece el cristal mezclando hacia negro y reduce opacidad.
          const base = (orig.color || new THREE.Color(0x222222)).clone();
          base.lerp(new THREE.Color(0x000000), 0.7 * t);
          m.color.copy(base);
          m.transparent = true;
          m.opacity = THREE.MathUtils.lerp(orig.opacity ?? 0.6, 0.92, t);
        }
        m.needsUpdate = true;
      });
    }
  }

  /* ---------- Luces ---------- */

  setLightsTinted(tinted) {
    this._forEach('LightA', (m) => {
      const orig = this._originals.get(m) || {};
      if (tinted) {
        m.color?.lerpColors(orig.color || new THREE.Color(0x888888), new THREE.Color(0x101216), 0.75);
        if (m.emissive) m.emissiveIntensity = (orig.emissiveIntensity ?? 1) * 0.3;
        m.roughness = 0.5;
      } else {
        if (orig.color) m.color?.copy(orig.color);
        if (m.emissive) m.emissiveIntensity = orig.emissiveIntensity ?? 1;
        m.roughness = orig.roughness ?? 0.5;
      }
      m.needsUpdate = true;
    });
    // Cristal de faros (BRZ): se ahuma tiñendo el vidrio.
    this._forEach('GlassLightClear', (m) => {
      const orig = this._originals.get(m) || {};
      if (tinted) m.color?.setHex(0x22252b);
      else if (orig.color) m.color?.copy(orig.color);
      m.needsUpdate = true;
    });
  }

  /* ---------- Interior ---------- */

  setInteriorColor(hex) {
    for (const name of ['InteriorColour1A', 'InteriorColour2A']) {
      this._forEach(name, (m) => {
        m.color?.setHex(hexToInt(hex));
        m.needsUpdate = true;
      });
    }
  }
}
