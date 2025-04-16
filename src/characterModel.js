import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import glb from "./assets/characters.glb?url"
import { createShadow } from './shadow.js'

let charAnimations = {}
let charModel = null

const templates = {
  "Hero": {
    meshes: ["AnaGen", "Hair-Wavy", "Sword", "Shield", "PlateAbs", "PlateBoots", "PlateChest", "PlateForearms", "PlateShins", "PlateShoulder", "PlateThighs"],
    meshColors: [{name: "anagen_1", color: 0x996655}],
    scale: [1,1.1,1],
  },
  "Mage": {
    meshes: ["Ana", "Hair-Parted", "Fireball", "Iceball"],
    meshColors: [{name: "ana_1", color: 0x772277}],
    morphs: [{meshName: "ana", morphName: "Hands Fist", value: 0.5}],
    scale: [1,1,1],
  },
  "Archer": {
    meshes: ["Adam", "HairM-Mowhawk", "Crossbow"],
    meshColors: [{name: "adam_1", color: 0x787833}],
    morphs: [{meshName: "adam", morphName: "Hands Fist", value: 1}],
    scale: [1,1.1,1],
  },
  "Grunt": {
    meshes: ["Adam", "Sword"],
    meshColors: [{name: "adam_1", color: 0x992233}, {name: "adam", color: 0x887766}],
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
  playAnimation(character, "Idle")
  setCharUserData(character, template)

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

  // Clone materials to prevent shared state
  clone.traverse((child) => {
    if (child.isMesh && child.material) {
      // If the mesh has an array of materials
      if (Array.isArray(child.material)) {
        child.material = child.material.map(mat => mat.clone())
      } else {
        child.material = child.material.clone()
      }
    }
  })

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

function setCharUserData(c, template=null) {
  const userData = c.obj.userData
  userData.health = 100
  userData.speed = 1.2
  userData.reload = 1
  userData.status = "idle"
  userData.combatType = "melee"
  userData.template = template

  if (template === "Hero") {
    userData.combatType = "all"
    userData.speed = 1.6
  }
  else if (template === "Archer") {
    userData.combatType = "archer"
  }
  else if (template === "Grunt") {
    userData.speed = 1.1
  }
  else if (template === "Mage") {
    userData.combatType = "mage"
  }
  else if (template === "Knight") {
    userData.speed = 1.0
  }
}

function animHierachy(currentAnim, anim) {
  const basic = ["Idle", "Jogging", "Walking", "Pistol Aim", "Pistol Idle"]
  const medium = ["Pistol Fire", "Fight Jab", "Sword Slash", "Take Damage"]
  const attacking = ["Pistol Fire", "Fight Jab", "Sword Slash"]
  if (currentAnim === "Die") return false
  if (attacking.includes(currentAnim) && anim==="Take Damage") return false
  if (basic.includes(currentAnim)) return true
  if (basic.includes(anim) && medium.includes(currentAnim)) return false
  return true
}

// Function to play an animation by name with fade effect
function playAnimation(c, name) {
  if (!c) return

  const mixer = c.mixer
  if (!mixer || !charAnimations[name]) {
    console.warn(`Animation "${name}" not found`);
    return;
  }
  
  const userData = c.obj.userData
  const newAction = mixer.clipAction(charAnimations[name]);
  if (userData.activeAction !== newAction) {
    // check anim hierachy
    if (userData.activeAction) {
      const canTransition = animHierachy(userData.activeAction.getClip().name, name)
      if (!canTransition) return
    }
    userData.previousAction = userData.activeAction
    userData.activeAction = newAction;
    
    if (userData.previousAction) {
      userData.previousAction.fadeOut(0.1);
    }
    userData.activeAction.reset().fadeIn(0.1).play();
    
    if (["Sword Slash", "Pistol Fire", "Fight Jab", "Take Damage", "Die"].includes(name)) {
      userData.activeAction.setLoop(THREE.LoopOnce, 1);
      userData.activeAction.clampWhenFinished = true;
    }
    if ("Take Damage" === name) {
      userData.activeAction.timeScale = 2
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
        //console.log("Couldn't find morph", obj, meshName)
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
