import * as THREE from 'three';
import * as Model from './characterModel.js'

function loadCharacters(scene, characters) {
  const chars = Model.loadModel(scene, characters)
  return chars
}

function addCharacter(scene, template, pos) {
  const character = Model.addCharacter(scene, template, pos)
  return character
}

function playAnimation(c, name) {
  Model.playAnimation(c, name)
}

function rotateToFace(object1, object2) {
  const targetPosition = new THREE.Vector3();
  object2.getWorldPosition(targetPosition);
  object1.lookAt(targetPosition);
}

function rotateToPos(object1, object2) {
  object1.lookAt(object2);
}

function findNearestChar(i, chars) {
  let nearestDistance = 999
  let nearestChar = -1
  chars.forEach((c, index) => {
    if (index === i) return
    const ch = c.obj
    if (ch.userData.health <= 0) return
    const dist = ch.position.distanceTo(chars[i].obj.position)
    if (dist < nearestDistance) {
      nearestDistance = dist
      nearestChar = index
    }
  })
  return [nearestChar, nearestDistance]
}

function distanceToPlayer(chars, ch) {
  return ch.position.distanceTo(chars[0].position)
}

function moveTo(ch, pos, minimumDistance = 0.01, delta) {
  const dist = ch.position.distanceTo(pos)
  if (dist < minimumDistance) return true

  const charSpeed = ch.userData.speed ? ch.userData.speed : 1
  const speed = charSpeed * delta
  const direction = new THREE.Vector3().subVectors(pos, ch.position).normalize();
  const step = direction.multiplyScalar(speed)

  // Prevent overshooting the target
  if (step.length() > dist) {
    ch.position.copy(pos);
    return true
  } else {
    ch.position.add(step);
  }
  return false
}

function getActiveAction(c) { return c.userData.activeAction.getClip().name }

function damageChar(c, dmg) {
  const obj = c.obj
  obj.userData.health -= dmg
  if (obj.userData.health <= 0) playAnimation(c, "Die")
  else playAnimation(c, "Take Damage")
}

function updateCharacters(chars, delta) {
  chars.forEach((c, i) => {
    if (i === 0) updatePlayer(chars, delta)
    else updateAi(chars, delta)
  })
}

function updatePlayer(chars, delta) {
  const p = chars[0].obj

  // Move to destination
  if (p.userData.destination && p.userData.destination !== null) {
    if (moveTo(p, p.userData.destination, 0.05, delta)) {
      playAnimation(chars[0], "Sword Idle")
      p.userData.destination = null
    }
    else {
      playAnimation(chars[0], "Walking")
      rotateToPos(p, p.userData.destination)
    }
  }
  else {
    //try attacking
    const [ci,cd] = findNearestChar(0, chars)
    if (ci != -1 && cd <= 1.5 && getActiveAction(p) === "Sword Idle") {
      playAnimation(chars[0], "Sword Slash")
      rotateToFace(p, chars[ci].obj)
      setTimeout(() => {
        damageChar(chars[ci], 20)
      }, 200);
    }
  }

}

function updateAi(chars) {

}

export {
  loadCharacters,
  addCharacter,
  playAnimation,
  updateCharacters,
};

