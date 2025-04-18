import * as Game from './game.js'

const effects = {
  "pixelize": 1.0,
  "noise": 0.0,
  "greyscale": 0.0,
  "dotScreen": 0.0,
  "toon": 6.0,
  "brightness": 2.0,
}

const playerData = {
  health: 5,
  stun: 2,
  shield: 1,
}

const menuElement = document.getElementById('main-menu')
let mode = "menu"
let level = "village"

function changeMode() {
  if (mode === "menu") {
    menuElement.style.display = "grid"
  }
  if (mode === "game") {
    menuElement.style.display = "none"
    Game.runGame(level, effects, playerData, restartGame)
  }
}

function restartGame() {
  mode = "menu"
  changeMode()
  Game.removeScene()
}

function startGame() {
  level = "village"
  mode = "game"
  playerData.health = 100;
  playerData.stun = 1;
  playerData.shield = 1;
  changeMode()
}
window.startGame = startGame
