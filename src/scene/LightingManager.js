/**
 * LightingManager.js — Iluminación tipo showroom premium (oscuro).
 */

import * as THREE from 'three';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Lighting';

    this.ambient = new THREE.AmbientLight(0xc5ccd6, 0.32);
    this.hemi = new THREE.HemisphereLight(0xe8eef6, 0x2a261f, 0.55);

    this.key = new THREE.DirectionalLight(0xfff3e6, 2.05);
    this.key.position.set(4.5, 8.5, 5.5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 28;
    this.key.shadow.camera.left = -7;
    this.key.shadow.camera.right = 7;
    this.key.shadow.camera.top = 7;
    this.key.shadow.camera.bottom = -7;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.key.shadow.radius = 2;

    this.fill = new THREE.DirectionalLight(0xa8bdd8, 0.55);
    this.fill.position.set(-6.5, 3.5, 1.5);

    this.rim = new THREE.DirectionalLight(0xffd4a8, 1.15);
    this.rim.position.set(-3.5, 4.5, -7);

    this.spot = new THREE.SpotLight(0xfff7ee, 28, 22, Math.PI / 6.5, 0.55, 1.4);
    this.spot.position.set(0, 10, 1.5);
    this.spot.target.position.set(0, 0.5, 0);
    this.spot.castShadow = false;

    this.group.add(this.ambient, this.hemi, this.key, this.fill, this.rim, this.spot, this.spot.target);
    scene.add(this.group);
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
