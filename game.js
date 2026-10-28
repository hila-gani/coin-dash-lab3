/* global Phaser, COIN_DASH, COIN_DASH_SOUNDS */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.difficulty = null;
    this.best = loadBest();
    this.paused = false;

    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this._showDifficultySelect();
  }

  _showDifficultySelect() {
    const c = COIN_DASH;
    this._selectBg = this.add.rectangle(c.width / 2, c.height / 2, 520, 160, 0x0a1120, 0.95);
    this._selectText = this.add.text(c.width / 2, c.height / 2 - 35, 'Choose Difficulty',
      { font: '22px monospace', color: '#ffffff' }
    ).setOrigin(0.5);

    // Each option is both a clickable button and bound to its number key.
    const names = ['Easy', 'Normal', 'Hard'];
    this._selectButtons = names.map((name, i) => {
      const button = this.add.text(c.width / 2 + (i - 1) * 160, c.height / 2 + 25, `[${i + 1}] ${name}`,
        { font: '22px monospace', color: '#ffffff', backgroundColor: '#24334b', padding: { x: 10, y: 6 } }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setColor('#ffd166'));
      button.on('pointerout', () => button.setColor('#ffffff'));
      button.on('pointerdown', () => this._startRound(name));
      return button;
    });

    // Match on e.key so both the top-row digits and the numpad work.
    this._onSelectKey = (e) => {
      const index = ['1', '2', '3'].indexOf(e.key);
      if (index !== -1) this._startRound(names[index]);
    };
    this.input.keyboard.on('keydown', this._onSelectKey);
  }

  _startRound(difficultyName) {
    if (this.difficulty) return;
    const c = COIN_DASH;
    const preset = c.difficulties[difficultyName];
    this.difficulty = difficultyName;

    this.input.keyboard.off('keydown', this._onSelectKey);
    this._selectBg.destroy();
    this._selectText.destroy();
    this._selectButtons.forEach((button) => button.destroy());

    this.deadline = this.time.now + c.roundSeconds * 1000;

    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();

    this.drones = this.physics.add.group();
    for (let i = 0; i < preset.droneCount; i++) {
      const spacing = c.width / (preset.droneCount + 1);
      const drone = this.add.rectangle(spacing * (i + 1), 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * preset.droneSpeed, Math.sin(angle) * preset.droneSpeed);
    }

    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished || this.paused) return;
      this.score++;
      if (typeof COIN_DASH_SOUNDS !== 'undefined') COIN_DASH_SOUNDS.coin();
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => {
      if (this.finished || this.paused) return;
      if (typeof COIN_DASH_SOUNDS !== 'undefined') COIN_DASH_SOUNDS.caught();
      this.finish('A drone caught you!');
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.pauseOverlay = this.add.text(c.width / 2, c.height / 2, 'PAUSED',
      { font: '48px monospace', color: '#ffffff' }
    ).setOrigin(0.5).setVisible(false);
  }

  togglePause() {
    if (this.finished || !this.difficulty) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      // Push the deadline back by however long we were paused so no time is lost.
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
    }
    this.pauseOverlay.setVisible(this.paused);
  }

  placeCoin() {
    const c = COIN_DASH;
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished || this.paused || !this.difficulty) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.updateHud(seconds);
    if (seconds === 0) this.finish('Time is up!');
  }

  updateHud(seconds) {
    this.hud.setText(`[${this.difficulty}] Coins: ${this.score}  Best: ${this.best}  [P]  Time: ${seconds}s`);
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const newRecord = this.score > this.best;
    if (newRecord) {
      this.best = this.score;
      saveBest(this.best);
      this.updateHud(Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000)));
    }
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 480, 170, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected${newRecord ? ' - new best!' : ''}\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
// High score persists across reloads; storage can be unavailable (e.g. private mode).
const BEST_KEY = 'coinDash.best';
function loadBest() {
  try { return Math.max(0, parseInt(localStorage.getItem(BEST_KEY), 10) || 0); } catch { return 0; }
}
function saveBest(value) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* ignore */ }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
