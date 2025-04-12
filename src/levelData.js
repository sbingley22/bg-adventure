const levelData = {
  village: {
    chars: [
      { template: "Knight", pos: [0,0,25] },
      { template: "Fem", pos: [1,0,20] },
      { template: "Male", pos: [-1,0,15] },
    ],
    ground: {
      type: "grass",
      size: [1.4,6],
    },
    backgrounds: [
      {
        type: "city",
        pos: [6,8,0],
        rot: [0,-Math.PI/2,0],
        scale: [60,16],
        wrap: [1.7, 1.0],
        col: [1.0, 1.0, 1.0],
      },
      {
        type: "city",
        pos: [0,10,-22],
        rot: [0,0,0],
        scale: [15,20],
        wrap: [0.5, 1.0],
        col: [1.0, 1.0, 1.0],
      },
    ]
  }
}

export default levelData
