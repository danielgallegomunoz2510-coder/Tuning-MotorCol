/**
 * SceneManager.js — Orquesta renderer, escena y bucle de animación.
 * Compone CameraManager, LightingManager y EnvironmentManager.
 */

import * as THREE from 'three';
import { CameraManager } from './CameraManager.js';
import { LightingManager } from './LightingManager.js';
import { EnvironmentManager } from './EnvironmentManager.js';

export class SceneManager {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.classList.add('three-canvas');
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.camera = new CameraManager(this.renderer, container);
    this.lighting = new LightingManager(this.scene);
    this.environment = new EnvironmentManager(this.scene, this.renderer);

    this._running = false;
    this._onResize = this._handleResize.bind(this);
    this._ro = new ResizeObserver(this._onResize);
    this._ro.observe(container);
    window.addEventListener('resize', this._onResize);

    this._animate = this._animate.bind(this);
  }

  add(obj) { this.scene.add(obj); }
  remove(obj) { this.scene.remove(obj); }

  start() {
    if (this._running) return;
    this._running = true;
    this.renderer.setAnimationLoop(this._animate);
  }

  stop() {
    this._running = false;
    this.renderer.setAnimationLoop(null);
  }

  _animate() {
    const dt = this.clock.getDelta();
    this.camera.update(dt);
    this.renderer.render(this.scene, this.camera.camera);
  }

  _handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.resize(w, h);
  }

  dispose() {
    this.stop();
    this._ro.disconnect();
    window.removeEventListener('resize', this._onResize);
    this.camera.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
