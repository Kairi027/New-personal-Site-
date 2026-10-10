class SceneManager {
  constructor(game) {
    this.game = game;
    this.scenes = {};
    this.current = null;
  }

  register(name, scene) {
    this.scenes[name] = scene;
  }

  go(name, params) {
    if (!this.scenes[name]) {
      throw new Error(`Unknown scene: ${name}`);
    }
    if (this.current && this.current.exit) this.current.exit();
    this.current = this.scenes[name];
    this.current.enter(params || {});
  }

  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
  }

  render(ctx) {
    if (this.current && this.current.render) this.current.render(ctx);
  }
}

module.exports = SceneManager;
