const { loadAssets } = require('./assets.js');

class ArtBank {
  constructor() {
    this.images = {};
    this.ready = false;
    this.promise = null;
  }

  start() {
    this.load();
  }

  load(onProgress) {
    if (this.promise) return this.promise;
    this.promise = new Promise((resolve) => {
      loadAssets((images) => {
        this.images = images;
        this.ready = true;
        resolve();
      }, onProgress);
    });
    return this.promise;
  }

  get(name) {
    const image = this.images[name];
    return image && image.width > 0 ? image : null;
  }
}

module.exports = ArtBank;
