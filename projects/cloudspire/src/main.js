const platform = require('./core/platform.js');
const SceneManager = require('./core/scenes.js');
const Input = require('./core/input.js');
const AudioManager = require('./core/audio.js');
const ArtBank = require('./core/artbank.js');
const storage = require('./core/storage.js');

const AuthScene = require('./scenes/auth.js');
const TitleScene = require('./scenes/title.js');
const DifficultyScene = require('./scenes/difficulty.js');
const StoryScene = require('./scenes/story.js');
const StageScene = require('./scenes/stage.js');
const GameOverScene = require('./scenes/gameover.js');
const StageClearScene = require('./scenes/stageclear.js');
const FakeEndingScene = require('./scenes/fakeending.js');
const LoadingScene = require('./scenes/loading.js');
const DebugStageScene = require('./scenes/debugstage.js');
const TrueEndingScene = require('./scenes/trueending.js');
const MpNameScene = require('./scenes/mpname.js');
const MpRoomScene = require('./scenes/mproom.js');
const AchievementScene = require('./scenes/achievements.js');
const AdScene = require('./scenes/ad.js');

class Game {
  constructor() {
    this.designW = 720;
    this.designH = 1280;
    this.canvas = platform.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    const info = platform.getSystemInfoSync();
    this.windowWidth = info.windowWidth;
    this.windowHeight = info.windowHeight;
    this.scale = Math.min(this.windowWidth / this.designW, this.windowHeight / this.designH);
    this.offsetX = (this.windowWidth - this.designW * this.scale) / 2;
    this.offsetY = (this.windowHeight - this.designH * this.scale) / 2;
    this.input = new Input(this);
    this.audio = new AudioManager();
    this.artBank = new ArtBank();
    this.audio.loadBgms();
    this.sceneManager = new SceneManager(this);
    this.lastTime = 0;
    this.running = false;

    this.sceneManager.register('auth', new AuthScene(this));
    this.sceneManager.register('title', new TitleScene(this));
    this.sceneManager.register('difficulty', new DifficultyScene(this));
    this.sceneManager.register('story', new StoryScene(this));
    this.sceneManager.register('stage', new StageScene(this));
    this.sceneManager.register('gameover', new GameOverScene(this));
    this.sceneManager.register('stageclear', new StageClearScene(this));
    this.sceneManager.register('fakeending', new FakeEndingScene(this));
    this.sceneManager.register('loading', new LoadingScene(this));
    this.sceneManager.register('debugstage', new DebugStageScene(this));
    this.sceneManager.register('trueending', new TrueEndingScene(this));
    this.sceneManager.register('mpname', new MpNameScene(this));
    this.sceneManager.register('mproom', new MpRoomScene(this));
    this.sceneManager.register('achievement', new AchievementScene(this));
    this.sceneManager.register('ad', new AdScene(this));

    if (typeof window !== 'undefined') {
      window.__cloudspireGame = this;
    }
  }

  toDesign(clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale,
    };
  }

  go(name, params) {
    this.sceneManager.go(name, params);
  }

  toTitle() {
    this.go('title');
  }

  start() {
    if (!this.canvas || !this.ctx) return;
    this.input.onAnyTap = () => this.audio.unlock();
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.audio.tick(1);
      });
    }
    this.input.start();
    const auth = storage.loadAuth();
    this.go('loading');
    this.running = true;
    this.lastTime = Date.now();
    this.tick();
  }

  tick() {
    if (!this.running) return;
    const now = Date.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.tick());
  }

  update(dt) {
    if (this.audio && this.audio.tick) this.audio.tick(dt);
    this.sceneManager.update(dt);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.designW, this.designH);
    ctx.clip();
    this.sceneManager.render(ctx);
    ctx.restore();
  }
}

module.exports = {
  Game,
};
