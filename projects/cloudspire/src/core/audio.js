const platform = require('./platform.js');

let sharedContext = null;

function getContext() {
  if (sharedContext) return sharedContext;
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createWebAudioContext) {
    sharedContext = wxApi.createWebAudioContext();
  } else if (typeof AudioContext !== 'undefined') {
    sharedContext = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    sharedContext = new webkitAudioContext();
  }
  return sharedContext;
}

function loadBufferTrack(track) {
  fetch(track.src)
    .then((response) => response.arrayBuffer())
    .then((data) => getContext().decodeAudioData(data))
    .then((buffer) => {
      track.buffer = buffer;
      track.ready = true;
      if (track.onReady) track.onReady();
    })
    .catch(() => {
      if (typeof Audio !== 'undefined') {
        track.fallback = new Audio(track.src);
        track.fallback.loop = true;
        track.fallback.addEventListener('ended', () => {
          if (track.onEnded) track.onEnded();
        });
      }
      track.ready = true;
      if (track.onReady) track.onReady();
    });
}

function createAudio(src) {
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createInnerAudioContext) {
    const inner = wxApi.createInnerAudioContext();
    inner.src = src;
    inner.loop = true;
    const track = { kind: 'inner', src, audio: inner, fallback: null, ready: false, pending: false, stopping: false };
    const markReady = () => {
      if (track.ready) return;
      track.ready = true;
      if (track.onReady) track.onReady();
    };
    if (typeof inner.onCanplay === 'function') inner.onCanplay(markReady);
    else inner.onCanplay = markReady;
    if (typeof inner.onError === 'function') inner.onError(markReady);
    else inner.onError = markReady;
    return track;
  }
  if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
    const track = {
      kind: 'buffer',
      src,
      buffer: null,
      fallback: null,
      source: null,
      gain: null,
      ready: false,
      pending: false,
      stopping: false,
    };
    loadBufferTrack(track);
    return track;
  }
  if (typeof Audio !== 'undefined') {
    const audio = new Audio(src);
    audio.loop = true;
    const track = { kind: 'inner', src, audio, fallback: null, ready: false, pending: false, stopping: false };
    audio.addEventListener('loadeddata', () => {
      track.ready = true;
      if (track.onReady) track.onReady();
    });
    audio.addEventListener('error', () => {
      track.ready = true;
      if (track.onReady) track.onReady();
    });
    audio.addEventListener('ended', () => {
      if (track.onEnded) track.onEnded();
    });
    return track;
  }
  return null;
}

function tone(freq, duration, type, gainValue, when, slideTo) {
  const ctx = getContext();
  if (!ctx) return;
  const start = (when === undefined ? 0 : when) + ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }
  gain.gain.setValueAtTime(gainValue || 0.12, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration, gainValue, when) {
  const ctx = getContext();
  if (!ctx) return;
  const start = (when === undefined ? 0 : when) + ctx.currentTime;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  source.buffer = buffer;
  gain.gain.setValueAtTime(gainValue || 0.2, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

class AudioManager {
  constructor() {
    this.started = false;
    this.titleTrack = null;
    this.stageTrack = null;
    this.stage2Track = null;
    this.stage3Track = null;
    this.stage4Track = null;
    this.boss4Track = null;
    this.heTrack = null;
    this.current = null;
    this.lightingBuffer = null;
    this.lightingSource = null;
    this.lightingGain = null;
    this.lightingReady = false;
    this.watchdogTimer = 0;
    this.lastContextState = null;
  }

  allTracks() {
    return [this.titleTrack, this.stageTrack, this.stage2Track, this.stage3Track, this.stage4Track, this.boss4Track, this.heTrack].filter(Boolean);
  }

  createTrack(src) {
    const track = createAudio(src);
    if (!track) return null;
    track.onReady = () => this.tryStartPending(track);
    track.onEnded = () => this.restartTrack(track);
    this.attachEndedGuard(track);
    return track;
  }

  // BGM must never stop after a single pass. Some runtimes drop the loop flag, so
  // every track also gets an ended-handler that restarts it while it is the active BGM.
  attachEndedGuard(track) {
    const player = track.audio || track.fallback;
    if (!player) return;
    const handler = () => {
      if (track.onEnded) track.onEnded();
    };
    if (typeof player.addEventListener === 'function') {
      player.addEventListener('ended', handler);
      return;
    }
    if (typeof player.onEnded === 'function') {
      player.onEnded(handler);
      return;
    }
    player.onEnded = handler;
  }

  loadBgms() {
    this.titleTrack = this.createTrack('assets/audio/title.mp3');
    this.stageTrack = this.createTrack('assets/audio/stage1.mp3');
    this.stage2Track = this.createTrack('assets/audio/stage2.mp3');
    this.stage3Track = this.createTrack('assets/audio/stage3.mp3');
    this.stage4Track = this.createTrack('assets/audio/stage4.mp3');
    this.boss4Track = this.createTrack('assets/audio/boss4.m4a');
    this.heTrack = this.createTrack('assets/audio/he.mp3');
    this.loadLightingSfx();
  }

  loadLightingSfx(onDone) {
    if (this.lightingReady || this.lightingBuffer) {
      if (onDone) onDone();
      return;
    }
    if (typeof fetch === 'undefined') {
      this.lightingReady = true;
      if (onDone) onDone();
      return;
    }
    fetch('assets/audio/lighting.mp3')
      .then((r) => r.arrayBuffer())
      .then((d) => getContext().decodeAudioData(d))
      .then((buf) => {
        this.lightingBuffer = buf;
        this.lightingReady = true;
        if (onDone) onDone();
      })
      .catch(() => {
        this.lightingReady = true;
        if (onDone) onDone();
      });
  }

  loadAll(onProgress) {
    return new Promise((resolve) => {
      const tracks = this.allTracks();
      const total = tracks.length + 1;
      const readyTrack = (track) =>
        track.ready ||
        !!track.buffer ||
        (track.kind === 'inner' && track.audio && typeof track.audio.duration === 'number' && track.audio.duration > 0);
      const check = () => {
        const loaded = tracks.filter(readyTrack).length + (this.lightingReady || !!this.lightingBuffer ? 1 : 0);
        if (onProgress) onProgress({ loaded, total });
        if (loaded >= total) resolve();
      };
      for (const track of tracks) {
        const original = track.onReady;
        track.onReady = () => {
          if (original) original();
          check();
        };
      }
      this.loadLightingSfx(() => check());
      check();
    });
  }

  unlock() {
    const ctx = getContext();
    if (ctx && ctx.resume) {
      const resumed = ctx.resume();
      if (resumed && resumed.catch) resumed.catch(() => {});
    }
    this.started = true;
    for (const track of this.allTracks()) this.tryStartPending(track);
    if (this.current && this.current.kind === 'inner') {
      const inner = this.current.audio || this.current.fallback;
      if (inner && (inner.paused || inner.paused === undefined) && inner.play) {
        this.markPlaying(this.current);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
    }
  }

  playBgm(track) {
    if (!track || this.current === track) return;
    this.stopBgm();
    track.stopping = false;
    track.shortPlays = 0;
    track.lastRestartAt = 0;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (!inner) return;
      inner.loop = true;
      this.rewind(inner);
      if (inner.play) {
        this.markPlaying(track);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
      this.current = track;
      return;
    }
    const ctx = getContext();
    if (!ctx) return;
    if (!track.buffer) {
      track.pending = true;
      this.current = track;
      if (track.fallback) {
        this.playFallback(track);
      }
      return;
    }
    if (!this.started) {
      track.pending = true;
      this.current = track;
      return;
    }
    this.startBuffer(track);
  }

  rewind(player) {
    if (!player) return;
    try {
      player.currentTime = 0;
    } catch (err) {
      // some runtimes reject seek before metadata is ready
    }
    if (typeof player.seek === 'function') {
      try {
        player.seek(0);
      } catch (err) {
        // ignore
      }
    }
  }

  playFallback(track) {
    const player = track && track.fallback;
    if (!player) return;
    player.loop = true;
    this.rewind(player);
    this.markPlaying(track);
    const played = player.play();
    if (played && played.catch) played.catch(() => {});
  }

  // Restarts the active BGM in place, used when a runtime ends a looping track.
  restartTrack(track) {
    if (!track || this.current !== track || track.pending || track.stopping) return;
    const now = Date.now();
    const expected = this.trackDuration(track);
    const playedMs = now - (track.playedSince || 0);
    const endedTooEarly = expected > 2 && playedMs < expected * 300;
    if (endedTooEarly) {
      // Ended far too early: this track cannot play cleanly, so stop retrying it.
      track.shortPlays = (track.shortPlays || 0) + 1;
      if (track.shortPlays > 3) return;
    } else {
      track.shortPlays = 0;
    }
    // Never restart faster than the guard can be useful; a healthy BGM ends after a full pass.
    if (track.lastRestartAt && now - track.lastRestartAt < 300) return;
    track.lastRestartAt = now;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (!inner) return;
      inner.loop = true;
      this.rewind(inner);
      if (inner.play) {
        this.markPlaying(track);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
      return;
    }
    if (!track.buffer) {
      this.playFallback(track);
      return;
    }
    if (!this.started) {
      track.pending = true;
      return;
    }
    this.startBuffer(track);
  }

  trackDuration(track) {
    if (track.buffer && track.buffer.duration) return track.buffer.duration;
    const player = track.audio || track.fallback;
    if (player && typeof player.duration === 'number' && !isNaN(player.duration)) return player.duration;
    return 0;
  }

  markPlaying(track) {
    track.playedSince = Date.now();
  }

  tryStartPending(track) {
    if (!track || track !== this.current || !track.pending || !this.started) return;
    if (track.kind !== 'buffer' || !track.buffer) return;
    this.startBuffer(track);
  }

  releaseSource(track) {
    const source = track.source;
    track.source = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch (err) {
        // already stopped
      }
      try {
        source.disconnect();
      } catch (err) {
        // ignore
      }
    }
    if (track.gain) {
      try {
        track.gain.disconnect();
      } catch (err) {
        // ignore
      }
      track.gain = null;
    }
  }

  startBuffer(track) {
    const ctx = getContext();
    if (!ctx || !track.buffer) return;
    this.releaseSource(track);
    track.pending = false;
    track.stopping = false;
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.loopStart = 0;
    if (track.buffer.duration > 0) source.loopEnd = track.buffer.duration;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.onended = () => {
      // Fires only when a runtime ignored `loop`; restart so the BGM never goes silent.
      if (track.stopping || this.current !== track || track.source !== source) return;
      this.restartTrack(track);
    };
    track.source = source;
    track.gain = gain;
    this.markPlaying(track);
    source.start(0);
    this.current = track;
  }

  // Called every frame; keeps mobile/WeChat interruptions from leaving the BGM silent.
  tick(dt) {
    this.watchdogTimer += dt || 0;
    if (this.watchdogTimer < 0.5) return;
    this.watchdogTimer = 0;
    this.ensurePlayback();
  }

  ensurePlayback() {
    const ctx = getContext();
    let resumedFromInterrupt = false;
    let contextRunning = true;
    if (ctx && ctx.state) {
      if (ctx.state !== 'running') {
        this.lastContextState = ctx.state;
        contextRunning = false;
        if (ctx.resume) {
          const resumed = ctx.resume();
          if (resumed && resumed.catch) resumed.catch(() => {});
        }
      } else {
        if (this.lastContextState && this.lastContextState !== 'running') resumedFromInterrupt = true;
        this.lastContextState = 'running';
      }
    }
    const track = this.current;
    if (!track || track.pending || track.stopping || !this.started) return;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (inner && inner.paused === true) this.restartTrack(track);
      return;
    }
    if (!contextRunning) return;
    if (!track.buffer) {
      if (track.fallback && track.fallback.paused === true) this.restartTrack(track);
      return;
    }
    // The audio clock stopped (phone lock / app switch) and came back: the old
    // buffer source is dead even though `loop` is set, so build a fresh one.
    if (resumedFromInterrupt && track.source) this.restartTrack(track);
  }

  playTitleBgm() {
    this.playBgm(this.titleTrack);
  }

  playStageBgm() {
    this.playBgm(this.stageTrack);
  }

  playStage2Bgm() {
    this.playBgm(this.stage2Track);
  }

  playStage3Bgm() {
    this.playBgm(this.stage3Track);
  }

  playStage4Bgm() {
    this.playBgm(this.stage4Track);
  }

  playBoss4Bgm() {
    this.playBgm(this.boss4Track);
  }

  playHeBgm() {
    this.playBgm(this.heTrack);
  }

  startBgm() {
    this.playTitleBgm();
  }

  stopBgm() {
    if (!this.current) return;
    const track = this.current;
    track.pending = false;
    track.stopping = true;
    if (track.kind === 'buffer') {
      this.releaseSource(track);
    } else {
      const inner = track.audio || track.fallback;
      if (inner && inner.pause) inner.pause();
      if (inner) this.rewind(inner);
    }
    this.current = null;
  }

  shoot() {
    tone(900, 0.05, 'square', 0.13, 0, 620);
  }

  explosion() {
    noise(0.3, 0.4);
    tone(160, 0.2, 'sawtooth', 0.2, 0, 60);
  }

  pickup() {
    tone(660, 0.07, 'sine', 0.14);
    tone(990, 0.08, 'sine', 0.14, 0.07);
  }

  levelup() {
    tone(523, 0.09, 'square', 0.15);
    tone(659, 0.09, 'square', 0.15, 0.08);
    tone(784, 0.14, 'square', 0.15, 0.16);
  }

  bomb() {
    tone(300, 0.8, 'sawtooth', 0.22, 0, 40);
    noise(0.9, 0.3);
    tone(1200, 0.4, 'sine', 0.1, 0.1, 1600);
  }

  thunder() {
    noise(1.1, 0.5);
    tone(70, 1.0, 'sawtooth', 0.35, 0, 28);
    tone(140, 0.5, 'square', 0.25, 0.06, 45);
  }

  playLighting() {
    const ctx = getContext();
    if (!ctx) return;
    this.stopLighting();
    if (this.lightingBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.lightingBuffer;
      src.loop = false;
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
      this.lightingSource = src;
      this.lightingGain = gain;
      src.onended = () => {
        if (this.lightingSource === src) {
          this.lightingSource = null;
          this.lightingGain = null;
        }
      };
    } else {
      this.thunder();
    }
  }

  stopLighting() {
    if (this.lightingSource) {
      try { this.lightingSource.stop(); } catch (e) {}
      try { this.lightingSource.disconnect(); } catch (e) {}
      this.lightingSource = null;
    }
    if (this.lightingGain) {
      try { this.lightingGain.disconnect(); } catch (e) {}
      this.lightingGain = null;
    }
  }

  hit() {
    tone(220, 0.09, 'sawtooth', 0.14, 0, 130);
  }

  bossWarning() {
    tone(392, 0.12, 'square', 0.15);
    tone(392, 0.12, 'square', 0.15, 0.14);
    tone(523, 0.2, 'square', 0.17, 0.28);
  }

  bossPhase() {
    tone(330, 0.1, 'square', 0.15);
    tone(494, 0.18, 'square', 0.15, 0.1);
  }

  gameover() {
    tone(392, 0.25, 'triangle', 0.16);
    tone(311, 0.25, 'triangle', 0.16, 0.24);
    tone(233, 0.45, 'triangle', 0.16, 0.48);
  }

  clear() {
    tone(523, 0.12, 'square', 0.15);
    tone(659, 0.12, 'square', 0.15, 0.1);
    tone(784, 0.12, 'square', 0.15, 0.2);
    tone(1047, 0.3, 'square', 0.17, 0.3);
  }
}

module.exports = AudioManager;
