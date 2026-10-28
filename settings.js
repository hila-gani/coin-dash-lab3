// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a },
  difficulties: {
    Easy:   { droneCount: 2, droneSpeed: 70  },
    Normal: { droneCount: 3, droneSpeed: 105 },
    Hard:   { droneCount: 4, droneSpeed: 160 }
  }
};
