import * as Game from './game.js'

const effects = {
  "pixelize": 1.0,
  "noise": 0.0,
  "greyscale": 0.0,
  "dotScreen": 0.0,
  "toon": 6.0,
  "brightness": 2.0,
}
const ranges = {
  "pixelize": [1, 10],
  "noise": [0, 1],
  "greyscale": [0, 1],
  "dotScreen": [0, 8],
  "toon": [0, 10],
  "brightness": [0.5, 3],
};

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

const controlsDiv = document.getElementById("controls");
for (const effect in effects) {
  const container = document.createElement("div");
  container.className = "slider-container";

  const label = document.createElement("label");
  label.innerText = `${effect}: `;

  const valueDisplay = document.createElement("span");
  valueDisplay.innerText = effects[effect].toFixed(2);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = ranges[effect][0];
  slider.max = ranges[effect][1];
  slider.step = 0.01;
  slider.value = effects[effect];
  slider.addEventListener("input", () => {
    effects[effect] = parseFloat(slider.value);
    valueDisplay.innerText = effects[effect].toFixed(2);
    // You can call your render/update function here
    // updateShaderEffects(effects);
    console.log(effects);
  });

  container.appendChild(label);
  container.appendChild(slider);
  container.appendChild(valueDisplay);
  controlsDiv.appendChild(container);
}
