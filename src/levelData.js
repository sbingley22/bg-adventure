const levelData = {
  village: {
    chars: [
      { template: "Hero", pos: [0,0,25] },
      { template: "Mage", pos: [1,0,10] },
      { template: "Archer", pos: [-1,0,11] },
      { template: "Grunt", pos: [0,0,15] },
      { template: "Knight", pos: [0,0,5] },
    ],
    ground: {
      type: "grass",
      size: [1.4,6],
    },
    backgrounds: [
      {
        type: "city",
        pos: [7.5,8,0],
        rot: [0,-Math.PI/2,0],
        scale: [60,17],
        wrap: [1.5, 1.0],
        col: [1.0, 1.0, 1.0],
      },
      {
        type: "city",
        pos: [0,80,-22],
        rot: [0,0,0],
        scale: [15,17],
        wrap: [0.5, 1.0],
        col: [1.0, 1.0, 1.0],
      },
    ]
  }
}

export default levelData
