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
  //console.log(speed, charSpeed)

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
function charIsIdle(c) {
  const name = c.userData.activeAction.getClip().name
  if (["Idle", "Sword Idle", "Pistol Ready", "Pistol Aim"].includes(name)) return true
  // prevent player from getting stun locked
  //else if (c.userData.isPlayer && name === "Take Damage") return true 
  else return false
}

function damagePlayer(chars, dmg) {
  const c = chars[0]
  const p = c.obj
  const hudInfo = document.getElementById('hud-info')
  const hudHealth = document.getElementById('hud-health')

  p.userData.health -= dmg

  if (p.userData.health <= 0) {
    playAnimation(c, "Die")
    setTimeout(() => {
      console.log("Restart")
    }, 2000);
  }
  else {
    playAnimation(c, "Take Damage")
    hudInfo.style.backgroundColor = "red"
    setTimeout(() => {
      hudInfo.style.backgroundColor = "black"
    }, 200);
  }

  hudHealth.innerText = "Health: " + Math.floor(p.userData.health)
}

function damageChar(c, dmg, type=null) {
  const obj = c.obj
  obj.userData.health -= dmg
  if (obj.userData.health <= 0) playAnimation(c, "Die")
  else playAnimation(c, "Take Damage")

  if (type === "fireball") {
    obj.userData.reload += 1.0
    setSphere(c, type, 0.2)
  }
}

function setSphere(c, type, length = 0.1) {
  const sphere = c.obj.userData.sphere
  if (type === "fireball") {
    sphere.visible = true
    sphere.material.opacity = 0.3
    sphere.material.color.set(0xFF3311)
  }

  setTimeout(() => {
    //sphere.material.opacity = 0.0
    sphere.visible = false
  }, length * 1000)
}

function updateCharacters(chars, delta, keysPressed) {
  updatePlayer(chars, delta, keysPressed)
  updateAi(chars, delta)
}

function keyMovement(keysPressed, p) {
  const pos = p.position.clone();
  const speed = 0.1
  let keyDown = false

  if (keysPressed['w'] || keysPressed['arrowup']) {pos.z -= speed; keyDown=true}
  if (keysPressed['s'] || keysPressed['arrowdown']) {pos.z += speed; keyDown=true}
  if (keysPressed['a'] || keysPressed['arrowleft']) {pos.x -= speed; keyDown=true}
  if (keysPressed['d'] || keysPressed['arrowright']) {pos.x += speed; keyDown=true}

  if (keyDown) p.userData.destination = pos;
}

function updatePlayer(chars, delta, keysPressed) {
  const p = chars[0].obj
  p.userData.reload -= delta
  keyMovement(keysPressed, p)

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
    if (p.userData.reload <= 0 && charIsIdle(p)) {
      const [ci,cd] = findNearestChar(0, chars)
      if (ci != -1) {
        if (cd <= 1.95) {
          playAnimation(chars[0], "Sword Slash")
          rotateToFace(p, chars[ci].obj)
          setTimeout(() => {
            damageChar(chars[ci], 20)
          }, 200);
          p.userData.reload = 1
        }
        else if (cd <= 5) {
          playAnimation(chars[0], "Fight Jab")
          rotateToFace(p, chars[ci].obj)
          setTimeout(() => {
            damageChar(chars[ci], 5, "fireball")
          }, 200);
          p.userData.reload = 1
        }
      }
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
      if (charIsIdle(c.obj) && chars[index].obj.userData.reload <= 0) {
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
      if (charIsIdle(c.obj) && chars[index].obj.userData.reload <= 0) {
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
    // default to melee
    if (moveTo(c.obj, chars[0].obj.position, 1, delta)) {
      if (charIsIdle(c.obj) && chars[index].obj.userData.reload <= 0) {
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

