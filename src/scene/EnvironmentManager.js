/**
 * EnvironmentManager.js — Garaje 3D (parking elevator) + mapa de entorno para reflejos.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const GARAGE_URL = `${import.meta.env.BASE_URL}models/garage/scene.gltf`;
const TARGET_HEIGHT = 5.2;

export class EnvironmentManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.garage = null;
    this.bounds = null;
    this.group = new THREE.Group();
    this.group.name = 'Environment';
    scene.add(this.group);

    scene.background = new THREE.Color(0x12151a);
    scene.fog = new THREE.Fog(0x12151a, 22, 48);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    this.envTexture = this.pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = this.envTexture;

    this.ready = this._loadGarage();
  }

  async _loadGarage() {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(GARAGE_URL);
      this.garage = gltf.scene;
      this.garage.name = 'Garage';
      this.garage.traverse((o) => {
        if (o.isCamera || o.isLight) o.visible = false;
        if (/CINEMA_4D|Editor/i.test(o.name || '')) o.visible = false;
        if (o.isMesh) {
          o.castShadow = false;
          o.receiveShadow = true;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (!m) continue;
            m.envMapIntensity = 0.35;
            if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      });

      this._placeGarage();
      this.group.add(this.garage);
      this._addContactShadow();
    } catch (err) {
      console.warn('[TMC] No se pudo cargar el garaje; se usa el piso de showroom.', err);
      this._fallbackFloor();
    }
    return this.bounds;
  }

  _placeGarage() {
    this.garage.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(this.garage);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0.05 && size.y < TARGET_HEIGHT) {
      this.garage.scale.multiplyScalar(TARGET_HEIGHT / size.y);
      this.garage.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(this.garage);
    }

    const pad = this._pickPad();
    const padBox = pad || box;
    const padCenter = padBox.getCenter(new THREE.Vector3());
    this.garage.position.x -= padCenter.x;
    this.garage.position.z -= padCenter.z;
    this.garage.position.y -= padBox.max.y;
    this.garage.updateMatrixWorld(true);

    this.bounds = new THREE.Box3().setFromObject(this.garage);
    // Margen interior para la cámara (evita incrustarse en muros/techo).
    this.innerBounds = this.bounds.clone().expandByScalar(-0.45);
  }

  /** Elige la losa más grande y baja (plaza de aparcamiento). */
  _pickPad() {
    let best = null;
    let bestScore = 0;
    this.garage.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      const b = new THREE.Box3().setFromObject(o);
      const s = b.getSize(new THREE.Vector3());
      const area = s.x * s.z;
      if (area < 8) return;
      const flat = s.y < Math.max(s.x, s.z) * 0.35;
      if (!flat && !/floor/i.test(o.name || '')) return;
      const score = area + (/floor/i.test(o.name || '') ? 40 : 0) - b.min.y;
      if (score > bestScore) {
        bestScore = score;
        best = b.clone();
      }
    });
    return best;
  }

  _addContactShadow() {
    const contact = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.012;
    contact.name = 'ContactShadow';
    this.group.add(contact);
  }

  _fallbackFloor() {
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.35,
      metalness: 0.6,
      envMapIntensity: 0.8,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-8, 0, -8),
      new THREE.Vector3(8, 6, 8),
    );
    this.innerBounds = this.bounds.clone();
  }

  dispose() {
    this.scene.remove(this.group);
    this.garage?.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          m?.map?.dispose?.();
          m?.normalMap?.dispose?.();
          m?.metalnessMap?.dispose?.();
          m?.roughnessMap?.dispose?.();
          m?.emissiveMap?.dispose?.();
          m?.dispose?.();
        }
      }
    });
    this.envTexture?.dispose?.();
    this.pmrem?.dispose?.();
    this.scene.environment = null;
  }
}
