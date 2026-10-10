const assert = require('assert');

// Simulates the WeChat InnerAudioContext surface, deliberately ignoring `loop` the
// way some runtimes do, so the BGM restart guard is exercised on every pass.
function createFakeInnerAudioContext(options) {
  const opts = options || {};
  const handlers = { canplay: [], ended: [], error: [] };
  const ctx = {
    loop: false,
    paused: true,
    currentTime: 0,
    duration: opts.duration === undefined ? 120 : opts.duration,
    playCalls: 0,
    play() {
      this.playCalls += 1;
      this.paused = false;
      ctx.loop = false; // runtime drops looping
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
    stop() {
      this.pause();
    },
    seek() {},
    onCanplay(cb) {
      handlers.canplay.push(cb);
    },
    onEnded(cb) {
      handlers.ended.push(cb);
    },
    onError(cb) {
      handlers.error.push(cb);
    },
    set src(value) {
      this._src = value;
      setTimeout(() => handlers.canplay.forEach((cb) => cb()), 0);
    },
    get src() {
      return this._src;
    },
  };
  ctx.fireEnded = () => {
    ctx.paused = true;
    handlers.ended.forEach((cb) => cb());
  };
  return ctx;
}

const created = [];
global.wx = {
  createInnerAudioContext() {
    const inner = createFakeInnerAudioContext({ duration: global.__fakeDuration });
    created.push(inner);
    return inner;
  },
  createWebAudioContext() {
    return null;
  },
};

const AudioManager = require('../src/core/audio.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // A healthy short track: it ends, and the guard must restart it every time.
  global.__fakeDuration = 0.5;
  const audio = new AudioManager();
  audio.loadBgms();
  await sleep(30);
  audio.unlock();

  const tracks = audio.allTracks();
  assert.strictEqual(tracks.length, 7, 'expected all seven BGM tracks');
  for (const track of tracks) {
    assert.ok(track.audio, `track ${track.src} should expose an inner audio context`);
    assert.strictEqual(track.audio.loop, true, `track ${track.src} should request looping`);
  }

  audio.playStage4Bgm();
  const stage4 = audio.stage4Track;
  assert.strictEqual(audio.current, stage4, 'stage 4 BGM should be the active track');
  assert.strictEqual(stage4.audio.playCalls, 1, 'stage 4 BGM should start once');

  stage4.audio.fireEnded();
  await sleep(60);
  assert.strictEqual(stage4.audio.playCalls, 2, 'stage 4 BGM should restart after the first pass');
  assert.strictEqual(audio.current, stage4, 'stage 4 BGM should stay the active track');
  assert.strictEqual(stage4.audio.paused, false, 'stage 4 BGM should be playing again');

  // Watchdog path: the runtime pauses playback without firing `ended`.
  stage4.audio.paused = true;
  await sleep(320);
  audio.tick(0.6);
  assert.ok(stage4.audio.playCalls >= 3, 'watchdog should resume a stalled BGM');
  assert.strictEqual(stage4.audio.paused, false, 'watchdog restart should leave the BGM playing');

  // An intentional stop must not be resurrected by the watchdog or the guard.
  audio.stopBgm();
  const callsAfterStop = stage4.audio.playCalls;
  stage4.audio.fireEnded();
  audio.tick(0.6);
  await sleep(60);
  assert.strictEqual(audio.current, null, 'stopBgm should clear the active track');
  assert.strictEqual(stage4.audio.playCalls, callsAfterStop, 'stopped BGM must stay stopped');

  // A track that always dies instantly must not spin the restart guard forever.
  global.__fakeDuration = 120;
  const broken = new AudioManager();
  broken.loadBgms();
  await sleep(30);
  broken.unlock();
  broken.playStage4Bgm();
  const brokenTrack = broken.stage4Track;
  const brokenStartCalls = brokenTrack.audio.playCalls;
  for (let i = 0; i < 8; i += 1) {
    brokenTrack.audio.fireEnded();
    await sleep(340);
    broken.tick(0.6);
  }
  const brokenRestarts = brokenTrack.audio.playCalls - brokenStartCalls;
  assert.ok(brokenRestarts <= 4, `restart guard should give up on a broken track, got ${brokenRestarts} restarts`);

  console.log('Audio loop test passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
