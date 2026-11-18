/**
 * CameraManager.js — Cámara en perspectiva + OrbitControls (exterior)
 * y vista en primera persona del habitáculo (interior).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const EXTERIOR_FOV = 45;
const INTERIOR_FOV = 72;
const LOOK_SENS = 0.0048;

export class CameraManager {
  constructor(renderer, container) {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;

    this._dom = renderer.domElement;
    this.camera = new THREE.PerspectiveCamera(EXTERIOR_FOV, w / h, 0.08, 80);
    this.camera.position.set(4.0, 1.7, 5.0);

    this.controls = new OrbitControls(this.camera, this._dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.85;
    this.controls.enablePan = false;
    // Límite corto: el vehículo se queda en el garaje, no se “pierde” al alejar.
    this.controls.minDistance = 3.1;
    this.controls.maxDistance = 6.4;
    this.controls.minPolarAngle = 0.28;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.target.set(0, 0.65, 0);
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.update();

    this.mode = 'exterior';
    this._autoRotate = false;
    this._bounds = null;
    this._eye = new THREE.Vector3();
    this._baseEye = new THREE.Vector3();
    this._heightOff = 0;
    this._lateralOff = 0;
    this._depthOff = 0;
    this._yaw = 0;
    this._pitch = -0.08;
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._bindLook();
  }

  /** Caja del garaje (mundo) para no atravesar paredes al orbitar. */
  setBounds(box) {
    this._bounds = box ? box.clone() : null;
  }

  setTarget(x, y, z) {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  frame(distance = 5.0, height = 1.7) {
    const d = THREE.MathUtils.clamp(distance, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.set(d * 0.68, height, d * 0.9);
    this.controls.update();
    this._clampExterior();
  }

  set autoRotate(v) {
    this._autoRotate = v && this.mode === 'exterior';
    this.controls.autoRotate = this._autoRotate;
    this.controls.autoRotateSpeed = 0.6;
  }

  setExteriorView() {
    this.mode = 'exterior';
    this.camera.fov = EXTERIOR_FOV;
    this.camera.near = 0.08;
    this.camera.updateProjectionMatrix();
    this.controls.enabled = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
  }

  /**
   * Coloca la cámara en el asiento del conductor. El arrastre gira la mirada
   * (primera persona) sin desplazar la posición.
   * @param {THREE.Vector3} eye
   * @param {THREE.Vector3} lookAt
   */
  setInteriorView(eye, lookAt) {
    this.mode = 'interior';
    this.controls.autoRotate = false;
    this.controls.enabled = false;
    this._baseEye.copy(eye);
    this._heightOff = 0;
    this._lateralOff = 0;
    this._depthOff = 0;
    this._eye.copy(eye);
    const dir = lookAt.clone().sub(eye);
    const horiz = Math.hypot(dir.x, dir.z) || 1;
    this._yaw = Math.atan2(dir.x, dir.z);
    this._pitch = Math.atan2(dir.y, horiz);
    this._pitch = THREE.MathUtils.clamp(this._pitch, -0.55, 0.62);
    this.camera.fov = INTERIOR_FOV;
    this.camera.near = 0.04;
    this.camera.updateProjectionMatrix();
    this._applyInterior();
  }

  /** Desplazamiento en metros desde el asiento: alto (Y), lateral (X, + izquierda) y profundidad (Z, + adelante). */
  setInteriorOffset({ height, lateral, depth } = {}) {
    if (height != null) this._heightOff = THREE.MathUtils.clamp(height, -0.28, 0.38);
    if (lateral != null) this._lateralOff = THREE.MathUtils.clamp(lateral, -0.48, 0.48);
    if (depth != null) this._depthOff = THREE.MathUtils.clamp(depth, -0.38, 0.45);
    this._applyInterior();
  }

  getInteriorOffset() {
    return { height: this._heightOff, lateral: this._lateralOff, depth: this._depthOff };
  }

  update() {
    if (this.mode === 'interior') {
      this._applyInterior();
      return;
    }
    this.controls.update();
    this._clampExterior();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this._unbindLook();
    this.controls.dispose();
  }

  _applyInterior() {
    this._eye.copy(this._baseEye);
    this._eye.y += this._heightOff;
    this._eye.x += this._lateralOff;
    this._eye.z += this._depthOff;
    const cp = Math.cos(this._pitch);
    const dir = new THREE.Vector3(
      Math.sin(this._yaw) * cp,
      Math.sin(this._pitch),
      Math.cos(this._yaw) * cp,
    );
    this.camera.position.copy(this._eye);
    this.camera.lookAt(this._eye.x + dir.x, this._eye.y + dir.y, this._eye.z + dir.z);
    this.camera.updateMatrixWorld();
  }

  _clampExterior() {
    if (!this._bounds) return;
    const p = this.camera.position;
    const b = this._bounds;
    const m = 0.55;
    p.x = THREE.MathUtils.clamp(p.x, b.min.x + m, b.max.x - m);
    p.y = THREE.MathUtils.clamp(p.y, Math.max(0.4, b.min.y + 0.35), b.max.y - m);
    p.z = THREE.MathUtils.clamp(p.z, b.min.z + m, b.max.z - m);
    const t = this.controls.target;
    t.x = THREE.MathUtils.clamp(t.x, b.min.x + 1, b.max.x - 1);
    t.z = THREE.MathUtils.clamp(t.z, b.min.z + 1, b.max.z - 1);
  }

  _bindLook() {
    const el = this._dom;
    this._onDown = (e) => {
      if (this.mode !== 'interior' || e.button !== 0) return;
      this._dragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch { /* no-op */ }
    };
    this._onMove = (e) => {
      if (!this._dragging || this.mode !== 'interior') return;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this._yaw -= dx * LOOK_SENS;
      this._pitch -= dy * LOOK_SENS;
      this._pitch = THREE.MathUtils.clamp(this._pitch, -0.55, 0.62);
      this._applyInterior();
    };
    this._onUp = () => { this._dragging = false; };
    el.addEventListener('pointerdown', this._onDown);
    el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp);
    el.addEventListener('pointercancel', this._onUp);
    el.addEventListener('lostpointercapture', this._onUp);
  }

  _unbindLook() {
    const el = this._dom;
    el.removeEventListener('pointerdown', this._onDown);
    el.removeEventListener('pointermove', this._onMove);
    el.removeEventListener('pointerup', this._onUp);
    el.removeEventListener('pointercancel', this._onUp);
    el.removeEventListener('lostpointercapture', this._onUp);
  }
}
