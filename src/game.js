import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as character from "./character.js"
import { setupPostProcessing } from './composer.js'
import { createGround } from './ground.js'
import { createBackground } from './background.js'
import levelData from './levelData.js'

let scene
let renderer
let animationFrameId

let spellFlag=null
let playerDataPointer=null

function runGame(levelName="village", effects=null, playerData=null) {
  const width = document.body.clientWidth
  const height = document.body.clientHeight
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 4, 10);
  camera.lookAt(new THREE.Vector3(0, 1, 0));
  const zoom = 1.0

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height)
  document.body.appendChild(renderer.domElement);
  renderer.domElement.classList.add('three-scene')

  const { composer, pixelPass, noisePass, greyPass, dotScreenPass, toonPass, brightnessPass } = setupPostProcessing(renderer, scene, camera);
  scene.background = null
  pixelPass.uniforms.pixelSize.value = 4.0
  noisePass.uniforms.amount.value = 0.5
  noisePass.uniforms.scale.value = 1.0
  noisePass.uniforms.speed.value = 1.0
  greyPass.uniforms.amount.value = 0.9
  greyPass.uniforms.brightness.value = 1.0
  dotScreenPass.uniforms['scale'].value = 9.0;
  dotScreenPass.uniforms['angle'].value = 0.785;
  toonPass.uniforms.levels.value = 6.0;
  brightnessPass.uniforms.brightness.value = 2.0;
  
  noisePass.enabled = false
  pixelPass.uniforms.pixelSize.value = 1.0
  greyPass.enabled = false
  dotScreenPass.enabled = false
  //toonPass.enabled = false
  if (effects=null) {
    pixelPass.uniforms.pixelSize.value = 1.0
    noisePass.enabled = false
  }

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(5, 10, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const level = levelData[levelName]
  const chars = character.loadCharacters(scene, level.chars)
  const ground = createGround(scene, level.ground.type, level.ground.size)
  level.backgrounds.forEach(b => {
    createBackground(scene, b.type, b.pos, b.rot, b.scale, b.wrap, b.col)
  })

  if (playerData) {
    // Load player data after player model has loaded
    playerDataPointer = playerData
    setTimeout(() => {
      if (chars.length < 1) return
      const p = chars[0].obj.userData
      if (playerData.health) p.health = playerData.health
    }, 1000);
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastClickTime = 0

  function handleInputStart(event) {
    // Prevent default touch behavior (like scrolling)
    event.preventDefault();

    let clientX, clientY;

    if (event.touches) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      if (event.button !== 0) return; // Only left mouse button
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const currentTime = performance.now();
    lastClickTime = currentTime;
  }

  function handleInputEnd(event) {
    event.preventDefault(); // Prevent default touch behavior

    let clientX, clientY;

    if (event.changedTouches) {
      // Touch event
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Mouse event
      if (event.button === 2) {
        console.log("RMB Clicked")
        return;
      }
      clientX = event.clientX;
      clientY = event.clientY;
    }

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    const currentTime = performance.now();
    const clickTime = currentTime - lastClickTime;
    if (clickTime > 200) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(ground, true);

    if (intersects.length > 0) {
      chars[0].obj.userData.destination = intersects[0].point
    } else {
      chars[0].obj.userData.destination = null
    }
  }

  const keysPressed = {};
  window.addEventListener('keydown', e => {
    keysPressed[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', e => {
    keysPressed[e.key.toLowerCase()] = false;
  });

  const canvas = renderer.domElement
  canvas.addEventListener('mouseup', handleInputEnd);
  canvas.addEventListener('mousedown', handleInputStart);

  canvas.addEventListener('touchend', handleInputEnd);
  canvas.addEventListener('touchstart', handleInputStart, { passive: false })

  const clock = new THREE.Clock();

  function animate(time) {
    animationFrameId = requestAnimationFrame(animate)
    const delta = clock.getDelta()

    if (chars.length > 0) {
      character.updateCharacters(chars, delta, keysPressed, spellFlag, playerData)
      spellFlag=null

      chars.forEach(c => {
        c.mixer.update(delta)
      })

      updateCamera(chars)
    }

    noisePass.uniforms.time.value = time * 0.001
    composer.render()
  }

  animate();

  function updateCamera() {
    if (!chars[0].obj) return
    const pos = chars[0].obj.position
    const offset = 5 * zoom
    camera.position.set(0, offset, pos.z + offset);
    camera.lookAt(new THREE.Vector3(0, pos.y, pos.z));
  }

  window.addEventListener('resize', () => {
    const width = document.body.clientWidth // window.innerWidth
    const height = document.body.clientHeight // widow.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    composer.setSize(width, height)
    pixelPass.uniforms.resolution.value.set(width, height)
  });
}

function useSpell(spell) {
  if (playerDataPointer[spell] > 0) {
    spellFlag = spell
    playerDataPointer[spell] -= 1
    if (playerDataPointer[spell] <= 0) {
      const spellButton = document.getElementById('spell-'+spell)
      if (spellButton) spellButton.classList.add('empty')
    }
  }
}
window.useSpell = useSpell

function removeScene() {
  const container = document.getElementById('three-game');
  const canvas = container ? container.querySelector('canvas') : null;
  // 1. Stop animation loop (assuming you have animationFrameId)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // 2. Dispose of resources
  if (scene) {
    scene.traverse(function (object) {
      if (object.isMesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      if (object.material && object.material.map) object.material.map.dispose();
      if (object.material && object.material.normalMap) object.material.normalMap.dispose();
    });
  }
  // 3. Remove event listeners
  if (canvas) {
    // Remove any event listeners attached to the canvas or window
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousedown');
    window.removeEventListener('mouseup');
    window.removeEventListener('touchstart');
    window.removeEventListener('touchend');
  }
  // 4. Dispose of the renderer
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  // 5. Remove the container (and its children, including the canvas) from the DOM
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  scene = null;
}

export {
  runGame,
  removeScene
}
