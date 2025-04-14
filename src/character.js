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
  return ch.position.distanceTo(chars[0].obj.position)
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

function damagePlayer(chars, dmg) {
  const c = chars[0]
  const p = c.obj

  p.userData.health -= dmg

  if (p.userData.health <= 0) {
    playAnimation(c, "Die")
    setTimeout(() => {
      console.log("Restart")
    }, 2000);
  }
  else {
    playAnimation(c, "Take Damage")
  }
}

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

function updateAi(chars, delta) {
  for (let index = 1; index < chars.length; index++) {
    const c = chars[index];

    if (c.obj.userData.health <= 0) continue

    if (c.obj.userData.status === "hostile") {
      hostileAi(chars, c, index, delta)
    } else {
      const dist = distanceToPlayer(chars, c.obj)
      if (dist < 10) becomeHostile(chars, c, index)
    }
  }
}

function becomeHostile(chars, c, i) {
  c.obj.userData.status = "hostile"
  playAnimation(c, "Sword Idle")

  chars.forEach((ch, index) => {
    if (index === i) return
    if (ch.obj.userData.health <= 0) return
    const dist = ch.obj.position.distanceTo(c.obj.position)
    if (dist < 10) {
      ch.obj.userData.status = "hostile"
      playAnimation(c, "Sword Idle")
    }
  })
}

function hostileAi(chars, c, index, delta) {
  rotateToFace(c.obj, chars[0].obj)
  chars[index].obj.userData.reload -= delta

  const combatType = c.obj.userData.combatType
  if (combatType === "mage") {
    if (moveTo(c.obj, chars[0].obj.position, 5, delta)) {
      // in striking range
      if (getActiveAction(c.obj) === "Sword Idle" && chars[index].obj.userData.reload <= 0) {
        playAnimation(c, "Fight Jab")
        setTimeout(() => {
          damagePlayer(chars, 10)
        }, 200);
        chars[index].obj.userData.reload = 4.0
      }
      else if (getActiveAction(c.obj) === "Walking") {
        playAnimation(c, "Sword Idle")
      }
    }
  }
  else if (combatType === "archer") {
    if (moveTo(c.obj, chars[0].obj.position, 8, delta)) {
      if (getActiveAction(c.obj) === "Sword Idle" && chars[index].obj.userData.reload <= 0) {
        playAnimation(c, "Pistol Fire")
        setTimeout(() => {
          damagePlayer(chars, 5)
        }, 200);
        chars[index].obj.userData.reload = 3.0
      }
      else if (getActiveAction(c.obj) === "Walking") {
        playAnimation(c, "Sword Idle")
      }
    }
    else {
      playAnimation(c, "Walking")
    }
  }
  else {
    if (moveTo(c.obj, chars[0].obj.position, 1, delta)) {
      if (getActiveAction(c.obj) === "Sword Idle" && chars[index].obj.userData.reload <= 0) {
        playAnimation(c, "Sword Slash")
        setTimeout(() => {
          damagePlayer(chars, 5)
        }, 200);
        chars[index].obj.userData.reload = 1.0
      }
      else if (getActiveAction(c.obj) === "Walking") {
        playAnimation(c, "Sword Idle")
      }
    }
    else {
      playAnimation(c, "Walking")
    }
  }
}

export {
  loadCharacters,
  addCharacter,
  playAnimation,
  updateCharacters,
};

