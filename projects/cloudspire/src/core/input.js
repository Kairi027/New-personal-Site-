class Input {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.touches = {};
    this.taps = [];
    this.enabled = true;
    this.handlers = null;
    this.onAnyTap = null;
  }

  start() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi) return;
    this.handlers = {
      start: (event) => this.handleStart(event),
      move: (event) => this.handleMove(event),
      end: (event) => this.handleEnd(event),
    };
    if (wxApi.onTouchStart) wxApi.onTouchStart(this.handlers.start);
    if (wxApi.onTouchMove) wxApi.onTouchMove(this.handlers.move);
    if (wxApi.onTouchEnd) wxApi.onTouchEnd(this.handlers.end);
    if (wxApi.onTouchCancel) wxApi.onTouchCancel(this.handlers.end);
  }

  stop() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi || !this.handlers) return;
    if (wxApi.offTouchStart) wxApi.offTouchStart(this.handlers.start);
    if (wxApi.offTouchMove) wxApi.offTouchMove(this.handlers.move);
    if (wxApi.offTouchEnd) wxApi.offTouchEnd(this.handlers.end);
    if (wxApi.offTouchCancel) wxApi.offTouchCancel(this.handlers.end);
    this.handlers = null;
  }

  toDesign(clientX, clientY) {
    if (this.game) return this.game.toDesign(clientX, clientY);
    return { x: clientX, y: clientY };
  }

  handleStart(event) {
    if (!this.enabled) return;
    if (this.onAnyTap) this.onAnyTap();
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      const point = this.toDesign(touch.clientX, touch.clientY);
      this.touches[touch.identifier] = point;
      this.taps.push({ x: point.x, y: point.y, id: touch.identifier });
      if (!this.active) {
        this.active = { id: touch.identifier, x: point.x, y: point.y };
      }
    }
  }

  handleMove(event) {
    if (!this.enabled) return;
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      const point = this.toDesign(touch.clientX, touch.clientY);
      this.touches[touch.identifier] = point;
      if (this.active && this.active.id === touch.identifier) {
        this.active.x = point.x;
        this.active.y = point.y;
      }
    }
  }

  handleEnd(event) {
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      delete this.touches[touch.identifier];
      if (this.active && this.active.id === touch.identifier) {
        this.active = null;
      }
    }
  }

  getMoveTarget() {
    return this.active ? { x: this.active.x, y: this.active.y } : null;
  }

  consumeTap() {
    if (!this.taps.length) return null;
    return this.taps.shift();
  }

  hasTapIn(rect) {
    const index = this.taps.findIndex(
      (tap) => tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h
    );
    if (index === -1) return false;
    this.taps.splice(index, 1);
    return true;
  }
}

module.exports = Input;
