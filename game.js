/* global Phaser, COIN_DASH, COIN_DASH_SOUNDS */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.totalPausedDuration = 0;
    this.highScore = parseInt(localStorage.getItem('coin_dash_highscore') || '0', 10);

    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished || this.isPaused) return;
      this.score++;
      if (typeof COIN_DASH_SOUNDS !== 'undefined') COIN_DASH_SOUNDS.coin();
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => {
      if (this.finished || this.isPaused) return;
      if (typeof COIN_DASH_SOUNDS !== 'undefined') COIN_DASH_SOUNDS.caught();
      this.finish('A drone caught you!');
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R,P');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  togglePause() {
    if (this.finished) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.pauseStartTime = this.time.now;
      const c = COIN_DASH;
      this.pauseBg = this.add.rectangle(c.width / 2, c.height / 2, 340, 100, 0x0a1120, 0.9);
      this.pauseText = this.add.text(c.width / 2, c.height / 2, 'GAME PAUSED\nPress P to resume', {
        font: '20px monospace', color: '#ffd166', align: 'center', lineSpacing: 8
      }).setOrigin(0.5);
    } else {
      this.physics.resume();
      this.totalPausedDuration += (this.time.now - this.pauseStartTime);
      if (this.pauseBg) this.pauseBg.destroy();
      if (this.pauseText) this.pauseText.destroy();
    }
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
    if (this.finished || this.isPaused) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    
    const remainingTime = this.deadline + this.totalPausedDuration - this.time.now;
    const seconds = Math.max(0, Math.ceil(remainingTime / 1000));
    const currentHigh = Math.max(this.score, this.highScore);
    this.hud.setText(`Coins: ${this.score}   Best: ${currentHigh}   [P: Pause]   Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      localStorage.setItem('coin_dash_highscore', String(this.score));
      this.highScore = this.score;
    }
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 480, 170, 0x0a1120, 0.95);
    const highMsg = isNewHigh ? '\n★ NEW HIGH SCORE! ★' : `\nPersonal Best: ${this.highScore}`;
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected${highMsg}\nPress R to try again`,
      { font: '22px monospace', color: '#ffffff', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5);
  }
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
