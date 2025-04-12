import * as THREE from 'three';
import city from './assets/medieval-village.png'

let backgroundMesh;

function createBackground(scene, bg, pos, rot, scale, wrap, col) {
  const textureLoader = new THREE.TextureLoader();
  const bgImg = city
  const texture = textureLoader.load(bgImg);

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(wrap[0], wrap[1])

  const color = 0xffffff

  const geometry = new THREE.PlaneGeometry(scale[0], scale[1])
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: color,
    transparent: true,         // Needed for alphaMap to work
    depthWrite: false,         // Optional: helps with transparency rendering
    //side: THREE.DoubleSide     // Show both sides of the plane if needed
  });

  backgroundMesh = new THREE.Mesh(geometry, material);
  backgroundMesh.rotation.set(...rot)
  backgroundMesh.position.set(...pos)
  backgroundMesh.material.color.set(...col)
  backgroundMesh.name = "bg"

  scene.add(backgroundMesh);

  return backgroundMesh
}

export { createBackground };
