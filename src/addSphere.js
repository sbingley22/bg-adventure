// addSphere.js
import * as THREE from 'three';

/**
 * Adds a sphere to the provided Three.js scene.
 * @param {THREE.Scene} scene - The scene to add the sphere to.
 * @param {Object} [options] - Optional configuration.
 * @param {number} [options.radius=1] - Radius of the sphere.
 * @param {THREE.Vector3} [options.position] - Position of the sphere.
 * @param {THREE.Color | string | number} [options.color=0xff0000] - Color of the sphere.
 * @returns {THREE.Mesh} The sphere mesh added to the scene.
 */
export function addSphere(scene, options = {}) {
  const {
    radius = 1,
    position = new THREE.Vector3(0, 0, 0),
    color = 0xff0000
  } = options;

  const geometry = new THREE.SphereGeometry(radius, 6, 6);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    opacity: 0.4,
    transparent: true,
    depthWrite: false,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.name = "Sphere"
  sphere.visible = false

  sphere.position.copy(position);
  scene.add(sphere);

  return sphere;
}
