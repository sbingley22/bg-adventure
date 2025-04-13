import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import glb from "./assets/characters.glb?url"
import { createShadow } from './shadow.js'

let charAnimations = {}
let charModel = null

const templates = {
  "Fem": {
    meshes: ["Ana", "Hair-Wavy", "Sword", "Shield"],
    meshColors: [{name: "ana_1", color: 0x1144aa}],
    morphs: [{meshName: "ana", morphName: "Hands Fist", value: 0.5}],
    scale: [1,1,1],
  },
  "Male": {
    meshes: ["Adam", "HairM-Mowhawk", "Pistol"],
    meshColors: [{name: "adam_1", color: 0x99AA44}],
    morphs: [{meshName: "adam", morphName: "Hands Fist", value: 1}, {meshName: "adam", morphName: "Jacked", value: 1}],
    scale: [1,1.1,1],
  },
  "Knight": {
    meshes: ["Eve", "Hair-TiedBack", "Sword", "Shield", "PlateAbs", "PlateBoots", "PlateChest", "PlateForearms", "PlateShins", "PlateShoulder", "PlateThighs"],
    meshColors: [{name: "eve", color: 0x997767}],
    scale: [1,1.1,1],
  },
}

function loadModel(scene, characters) {
  const loader = new GLTFLoader();
  const array = []

  loader.load(glb, (gltf) => {
    charModel = gltf.scene
    console.log(charModel)

    // Store animations by name
    gltf.animations.forEach((clip) => {
      charAnimations[clip.name] = clip;
    });
    //console.log(charAnimations)
    
    characters.forEach(c => {
      array.push(addCharacter(scene, c.template, c.pos))
    })
  });

  return array
}

function addCharacter(scene, template, pos) {
  if (charModel === null) { console.warn("Model not yet loaded"); return; }

  const character = cloneCharacter(scene, template, pos)
  playAnimation(character, "Sword Idle")
  setCharUserData(character)

  if (templates[template].meshColors) templates[template].meshColors.forEach(m => changeMeshColor(character.obj, m.name, m.color))
  if (templates[template].morphs) templates[template].morphs.forEach(m => updateMorph(character.obj, m.meshName, m.morphName, m.value))
  if (templates[template].scale) character.obj.scale.set(...templates[template].scale)
  createShadow(character.obj)

  return character
}

function cloneCharacter(scene, template, pos) {
  const clone = SkeletonUtils.clone(charModel);
  clone.position.set(pos[0], pos[1], pos[2])
  showMeshes(clone, templates[template].meshes)
  scene.add(clone);

  const cloneMixer = new THREE.AnimationMixer(clone);
  clone.userData.previousAction = null
  clone.userData.activeAction = null

  const character = {obj: clone, mixer: cloneMixer}
  cloneMixer.addEventListener('finished', (e) => {
    const finishedAction = e.action.getClip().name
    if (["Sword Slash", "Take Damage", "Fight Jab"].includes(finishedAction)) {
      playAnimation(character, "Sword Idle");
    }
    else if (["Pistol Fire"].includes(finishedAction)) {
      playAnimation(character, "Pistol Ready");
    }
  })

  return character
}

function setCharUserData(c) {
  const userData = c.obj.userData
  userData.health = 100
  userData.speed = 1.5
}

// Function to play an animation by name with fade effect
function playAnimation(c, name) {
  if (!c) return

  const mixer = c.mixer
  if (!mixer || !charAnimations[name]) {
    console.warn(`Animation "${name}" not found`);
    return;
  }
  
  const newAction = mixer.clipAction(charAnimations[name]);
  if (c.obj.userData.activeAction !== newAction) {
    c.obj.userData.previousAction = c.obj.userData.activeAction
    c.obj.userData.activeAction = newAction;
    
    if (c.obj.userData.previousAction) {
      c.obj.userData.previousAction.fadeOut(0.1);
    }
    c.obj.userData.activeAction.reset().fadeIn(0.1).play();
    
    if (["Sword Slash", "Pistol Fire", "Fight Jab", "Take Damage", "Die"].includes(name)) {
      c.obj.userData.activeAction.setLoop(THREE.LoopOnce, 1);
      c.obj.userData.activeAction.clampWhenFinished = true;
    }
  }
}

function showMeshes(obj, meshes) {
  // Hide all meshes
  obj.traverse((child) => {
    if (child.isMesh || child.type === "Group") {
      if (child.name === "Scene") return
      child.visible = false;
    }
  });
  // Show specific meshes
  obj.traverse((child) => {
    if (child.isMesh || child.type === "Group") {
      if (meshes.includes(child.name))
      {
        child.visible = true
        if (child.type === "Group") {
          child.children.forEach((ch) => ch.visible = true)
        }
      }
    }
  });
}

function changeMeshColor(obj, meshName, color) {
  obj.traverse((child) => {
    if (child.isMesh) {
      // Check if the child's name matches the specified mesh name
      if (child.name === meshName) {
        // Change the color of the material to the provided color
        child.material.color.set(color);
      }
    }
  });
}

function updateMorph(obj, meshName, morphName, value) {
  //console.log(obj)
  obj.traverse((child) => {
    if (child.isMesh && child.name.includes(meshName)) {
      const morphIndex = child.morphTargetDictionary[morphName]
      if (morphIndex !== undefined) {
        child.morphTargetInfluences[morphIndex] = value
      }
      else {
        console.log("Couldn't find morph")
      }
    }
  })
}

export {
  loadModel,
  playAnimation,
  addCharacter,
  showMeshes,
  changeMeshColor,
  updateMorph,
};
