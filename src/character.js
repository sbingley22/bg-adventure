import * as THREE from 'three';
import * as Model from './characterModel.js'

function loadCharacters(scene, characters) {
  return Model.loadModel(scene, characters)
}

function addCharacter(scene, template, pos) {
  const character = Model.addCharacter(scene, template, pos)
  return character
}

function playAnimation(c, name) {
  Model.playAnimation(c, name)
}

export {
  loadCharacters,
  addCharacter,
  playAnimation,
};

