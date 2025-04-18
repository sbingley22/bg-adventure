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
  health: 100,
  stun: 2,
  shield: 1,
}

Game.runGame("village", effects, playerData)
