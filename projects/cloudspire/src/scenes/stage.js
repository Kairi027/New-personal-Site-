const { getDifficulty } = require('../config/difficulty.js');
const { getStage } = require('../config/stages.js');
const Player = require('../entities/player.js');
const Enemy = require('../entities/enemy.js');
const Boss = require('../entities/boss.js');
const BulletManager = require('../entities/bullets.js');
const ParticleSystem = require('../core/particles.js');
const MountainBackground = require('../core/mountain-background.js');
const storage = require('../core/storage.js');
const platform = require('../core/platform.js');
const PauseScene = require('./pause.js');
const { drawHud, drawCoopHud, drawBossHud, drawTwinBossHud } = require('../ui/hud.js');
const { drawInkTitle, drawButton, drawPanel } = require('../ui/menu.js');
const { TAU, circlesOverlap, rand, clamp } = require('../utils/math.js');
const net = require('../net/multiplayer.js');
const achievements = require('../core/achievements.js');
const { setGlobalSeed } = require('../utils/rng.js');
const { tintSprite } = require('../utils/tint.js');

const PAUSE_RECT = { x: 652, y: 14, w: 56, h: 52 };
const BOMB_RECT = { x: 38, y: 1152, w: 76, h: 92 };
const PK_WATCH_RECT = { x: 110, y: 900, w: 230, h: 76 };
const PK_WAIT_RECT = { x: 380, y: 900, w: 230, h: 76 };
const PK_EXIT_RECT = { x: 24, y: 24, w: 120, h: 48 };
const PK_TOP_RIGHT_RECT = { x: 576, y: 24, w: 120, h: 48 };
const PK_CONFIRM_PANEL = { x: 90, y: 500, w: 540, h: 290 };
const PK_CONFIRM_YES = { x: 190, y: 700, w: 140, h: 56 };
const PK_CONFIRM_NO = { x: 390, y: 700, w: 140, h: 56 };
const REVIVE_PANEL = { x: 90, y: 470, w: 540, h: 380 };
const REVIVE_YES = { x: 130, y: 730, w: 210, h: 60 };
const REVIVE_NO = { x: 380, y: 730, w: 210, h: 60 };

function formationPosition(layout, index, count, spawn) {
  const spacing = spawn.spacingX || 70;
  const spacingY = spawn.spacingY || 80;
  const cx = spawn.x !== undefined ? spawn.x : spawn.cx !== undefined ? spawn.cx : 360;
  const cy = spawn.y !== undefined ? spawn.y : spawn.cy !== undefined ? spawn.cy : -40;
  if (layout === 'V') {
    return { x: 360 + (index - (count - 1) / 2) * 58, y: -30 - Math.abs(index - (count - 1) / 2) * 42 };
  }
  if (layout === 'lineH') {
    return { x: cx + (index - (count - 1) / 2) * spacing, y: cy };
  }
  if (layout === 'lineV') {
    return { x: cx, y: -40 + index * spacingY };
  }
  if (layout === 'arc') {
    const radius = spawn.radius || 160;
    const angle = -Math.PI / 2 + (count === 1 ? 0 : (index / (count - 1)) * Math.PI);
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }
  if (layout === 'ring') {
    const radius = spawn.radius || 170;
    const angle = (index / count) * TAU;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }
  if (layout === 'triangle') {
    if (index === 0) return { x: cx, y: cy - 40 };
    if (index === 1) return { x: cx - 120, y: cy + 130 };
    return { x: cx + 120, y: cy + 130 };
  }
  if (layout === 'wedge') {
    return { x: 620 - index * 58, y: -60 + index * 48 };
  }
  if (layout === 'stairs') {
    const col = index % 2;
    const row = Math.floor(index / 2);
    return { x: 260 + col * 150, y: -60 + row * 100 + col * 45 };
  }
  return { x: null, y: null };
}

class StageScene {
  constructor(game) {
    this.game = game;
    this.pauseUi = new PauseScene(game);
  }

  enter(params) {
    this.params = params || {};
    const save = this.params.save;
    this.difficulty = getDifficulty(this.params.difficulty || (save && save.difficulty) || 'easy');
    this.stage = getStage(this.params.stage || (save && save.stage) || 1);
    this.continueMode = this.params.mode === 'continue';
    this.challenge = !!(this.params.challenge);
    this.noSave = !!(this.params.noSave || this.challenge);
    this.pk = !!(this.params.pk);
    this.coop = !!(this.params.coop) && !this.params.pk;
    if (this.coop) {
      this.roomId = this.params.roomId || '';
      this.playerIndex = this.params.playerIndex || 1;
      this.hostName = this.params.hostName || '';
      this.guestName = this.params.guestName || '';
      this.baseSeed = this.params.seed || 1;
      this.seed = this.baseSeed + Math.max(0, (this.stage ? this.stage.id : 1) - 1);
      this.coopEndSent = false;
      this.noSave = true;
      this.coopLocalSim = !!(this.params.coopLocalSim);
      this.coopClaimedExtras = [];
      this.coopMsg = '';
      this.coopBannerTimer = 0;
      this.coopNextStageId = 0;
      this.coopNextTimer = 0;
      this.coopStep = 1 / 60;
      this.coopBuffer = 6;
      this.coopGrace = 12;
      this.coopStartAtMs = typeof this.params.startAtLocal === 'number' ? this.params.startAtLocal : Date.now();
      this.coopNowMs = this.params.coopNowMs || (() => Date.now());
      this.coopSample = 0;
      this.coopNextStep = 0;
      this.localIntents = [];
      this.remoteIntents = {};
      this.lastRemoteIntent = { move: null, bomb: false };
      this.coopFrameIntent = null;
      setGlobalSeed(this.seed);
      net.onMessage = (msg) => this.handleNetMessage(msg);
    }
    if (this.pk) {
      this.noSave = true;
      this.roomId = this.params.roomId || '';
      this.playerIndex = this.params.playerIndex || 1;
      this.hostName = this.params.hostName || '';
      this.guestName = this.params.guestName || '';
      this.baseSeed = 1;
      this.pkState = 'play';
      this.pkChoice = null;
      this.pkConfirm = null;
      this.pkFinishedSent = false;
      this.pkOppFinished = false;
      this.pkLeaveSent = false;
      this.pkForfeitTimer = 0;
      this.pkForfeitName = '';
      this.pkSettleForfeit = '';
      this.pkSettleTimer = 0;
      this.pkStateTimer = 0;
      this.pkLastFrameAt = 0;
      this.pkFrameData = '';
      this.pkFrameImg = null;
      this.pkBroadcast = false;
      this.pkNextStageId = 0;
      this.pkNextTimer = 0;
      this.pkOpp = {
        name: this.playerIndex === 1 ? (this.params.guestName || 'P2') : (this.params.hostName || 'P1'),
        score: 0,
        stage: 1,
        lives: 3,
        hp: 100,
        maxHp: 100,
        over: false,
      };
      net.onMessage = (msg) => this.handlePkMessage(msg);
    }
    this.player = save ? Player.fromState(save) : this.params.progress ? Player.fromState(this.params.progress) : new Player(360, 1080);
    if (this.coop) {
      this.player2 = Player.fromState(this.player.toState());
      this.player2.x = 160;
      this.player2.y = 900;
      this.player2.red = true;
    }
    this.player.art = this.game.artBank ? this.game.artBank.get('player') : null;
    this.player.invincible = !!(
      this.params.invincible ||
      (save && save.invincible) ||
      (this.params.progress && this.params.progress.invincible)
    );
    if (this.params.boost && !save && !this.params.progress && this.player.level < 26) {
      this.player.level = Math.min(26, this.player.level + 5);
      this.player.recomputeCombatStats();
      this.player.hp = this.player.maxHp;
    }
    this.player.onLevelUp = () => {
      this.game.audio.levelup();
      this.particles.ring(this.player.x, this.player.y, '#f7d36b', 90, 0.7, 4);
    };

    this.bullets = new BulletManager(this.game.artBank);
    this.enemies = [];
    this.pickups = [];
    this.particles = new ParticleSystem();
    this.background = new MountainBackground({
      fixed: this.stage.background || null,
      terrain: this.stage.id === 1,
      sea: this.stage.id === 2,
      cloudtop: this.stage.id === 3,
      space: !!this.stage.space,
    });
    this.boss = null;
    this.bossFlashTimer = 0;
    this.paused = false;
    this.blockMoveUntilRelease = false;
    this.bombFx = null;
    this.bombTextTimer = 0;
    this.screenFlash = 0;
    this.hitFlash = 0;
    this.shields = [];
    this.meteors = [];
    this.meteorStormTimer = 0;
    this.cinematic = null;
    this.bossPlaceholderTimer = 0;
    this.miniBossCleared = false;
    this.bossPhase2Played = false;
    this.finalLordDropsSent = false;
    this.boss4BgmPlayed = false;
    this.alienDeathMusicStopped = false;
    this.bossDeadFade = 0;
    this.fakeEndingMode = (this.difficulty.id === 'hard' || this.difficulty.id === 'insane') && this.stage.id === 3;
    this.thunderTimer = rand(8, 12);
    this.lightningFlash = 0;
    this.thunderFlashDelay = 0;
    this.time = 0;
    this.shootCount = 0;
    this.gameOverSent = false;
    this.clearSent = false;
    this.revivePhase = null;
    this.reviveAdTimer = 0;
    this.activeEpisodeId = 0;
    this.episodeSpawns = [];
    this.episodeTimer = 0;
    this.pauseTimer = 0;

    this.episodeIndex = save ? save.waveIndex || 0 : 0;
    this.miniBossCleared = !!(save && save.miniBossCleared);
    if (this.continueMode && save) {
      if (this.stage.id === 3 && this.episodeIndex >= 10 && !this.miniBossCleared) {
        this.episodeIndex = 10;
        this.state = 'miniBoss';
        this.ensureMiniBoss();
        if (this.boss && save.twinHp) {
          for (const saved of save.twinHp) {
            const part = this.boss.parts.find((p) => p.key === saved.key);
            if (part && typeof saved.hp === 'number') {
              part.hp = Math.min(part.maxHp, saved.hp);
              if (part.hp <= 0) part.dead = true;
            }
          }
        }
      } else if (this.episodeIndex >= this.stage.episodes.length) {
        this.state = 'boss';
        this.ensureBoss();
        if (typeof save.bossHp === 'number' && save.bossHp >= 0) {
          this.boss.hp = Math.min(this.boss.maxHp, save.bossHp);
        }
        if (save.bossPhase) {
          this.boss.phase = Math.max(1, Math.min(3, save.bossPhase));
        }
      } else {
        this.state = 'intro';
        this.introTimer = 2.8;
      }
    } else {
      this.state = 'intro';
      this.introTimer = 2.8;
    }
    if (this.stage.id === 2) {
      this.game.audio.playStage2Bgm();
    } else if (this.stage.id === 3) {
      this.game.audio.playStage3Bgm();
    } else if (this.stage.id === 4) {
      this.game.audio.playStage4Bgm();
    } else {
      this.game.audio.playStageBgm();
    }
  }

  startEpisode(index) {
    const episode = this.stage.episodes[index];
    if (!episode) return;
    this.activeEpisodeId = index;
    this.episodeTimer = 0;
    this.pauseTimer = 0;
    this.episodeSpawns = [];
    this.cinematic = episode.flyover ? { t: 0, duration: episode.duration } : null;
    if (this.stage.id === 4) {
      const wave = index + 1;
      if (wave % 10 === 0) this.pickups.push({ type: 'bomb', x: 360, y: -30 });
      if (wave % 5 === 0) this.pickups.push({ type: 'heart', x: 440, y: -30 });
    }
    if (episode.meteorStorm) {
      this.meteorStormTimer = 12;
      for (const m of this.meteors) {
        m.vx *= 1.4;
        m.vy *= 1.4;
      }
    }
    if (episode.type === 'formation') {
      for (const group of episode.groups) {
        const groupCount = Math.max(1, Math.round(group.count * this.difficulty.enemyCount));
        const startY = 360 - ((groupCount - 1) * group.spacing) / 2;
        for (let i = 0; i < groupCount; i += 1) {
          const lane = startY + i * group.spacing;
          const flashing = episode.includeBombCarrier && i === 1 && group.side === 'left';
          const enemy = new Enemy(
            this.stage.enemyDefs[episode.enemyType],
            {
              side: group.side,
              path: 'loop',
              lane,
              flashing,
              loopConfig: {
                centerX: group.centerX,
                radius: group.radius,
                loopDuration: group.loopDuration,
              },
            },
            this.difficulty,
            index
          );
          this.applyEnemyArt(enemy);
          this.addEnemy(enemy);
        }
      }
    } else {
      this.episodeSpawns = episode.spawns.map((spawn) => {
        const baseInterval = spawn.interval || 0.5;
        return {
          type: spawn.type,
          side: spawn.side,
          path: spawn.path || 'dive',
          count: Math.max(1, Math.round(spawn.count * this.difficulty.enemyCount)),
          interval: baseInterval === 0 ? 0 : baseInterval * this.difficulty.enemyInterval,
          flashing: !!spawn.flashing,
          formation: spawn.formation || null,
          spawned: 0,
          nextAt: spawn.delay || 0,
        };
      });
    }
  }

  spawnEnemy(spawn, index) {
    if (spawn.type === 'MET') {
      this.spawnMeteor(spawn, index);
      return;
    }
    const def = this.stage.enemyDefs[spawn.type];
    if (!def) return;
    const pos = spawn.formation
      ? formationPosition(spawn.formation, index, spawn.count || 1, spawn)
      : { x: spawn.x !== undefined ? spawn.x : null, y: spawn.y !== undefined ? spawn.y : null };
    const enemy = new Enemy(
      def,
      {
        side: spawn.side,
        path: spawn.path || 'dive',
        flashing: spawn.flashing,
        x: pos.x,
        y: pos.y,
        groupConfig: spawn.groupConfig,
        holdY: spawn.holdY,
        holdTime: spawn.holdTime,
        angle: spawn.angle,
      },
      this.difficulty,
      this.activeEpisodeId
    );
    this.addEnemy(enemy);
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
    if (this.stage.id === 4 && (enemy.type === 'EN' || enemy.type === 'ED' || enemy.type === 'UV' || enemy.type === 'UG')) {
      enemy.holdTime = 9999;
    }

    if (enemy.type === 'UG') {
      const emHp = Math.max(1, Math.round(2500 * this.difficulty.enemyHp));
      this.shields.push({
        enemy,
        kind: 'em',
        hp: emHp,
        maxHp: emHp,
        radius: 210,
        active: true,
      });
      return;
    }
    if (enemy.def.shieldHp) {
      const hp = Math.max(1, Math.round(enemy.def.shieldHp * this.difficulty.enemyHp));
      this.shields.push({
        enemy,
        kind: enemy.def.shieldKind || 'normal',
        hp,
        maxHp: hp,
        radius: enemy.def.shieldRadius || 120,
        active: true,
      });
    }

    if (this.stage.id !== 4 && this.player && this.player.level >= 20) {
      const roll = Math.random();
      if (roll < 0.08) enemy.glow = 'yellow';
      else if (roll < 0.16) enemy.glow = 'blue';
    }
  }

  removeShield(enemy) {
    for (let i = this.shields.length - 1; i >= 0; i -= 1) {
      if (this.shields[i].enemy === enemy) this.shields.splice(i, 1);
    }
  }

  findShieldFor(enemy) {
    let best = null;
    let bestDist = Infinity;
    for (const shield of this.shields) {
      if (!shield.active) continue;
      if (shield.kind === 'em' && shield.enemy === enemy) continue;
      const dx = shield.enemy.x - enemy.x;
      const dy = shield.enemy.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= shield.radius + enemy.r && dist < bestDist) {
        best = shield;
        bestDist = dist;
      }
    }
    return best;
  }

  applyEnemyArt(enemy) {
    const artKeys = {
      S: 'enemy_s',
      M: 'enemy_m',
      H: 'enemy_h',
      K: 'enemy_tuxi',
      D: 'enemy_hudun',
      N: 'enemy_juji',
      F: 'enemy_fengwei_a',
      G: 'enemy_fengwei_b',
      ES: 'enemy_es',
      EM: 'enemy_em',
      EH: 'enemy_eh',
      EK: 'enemy_ek',
      EN: 'enemy_en',
      ED: 'enemy_ed',
      U: 'ufo_m',
      UV: 'ufo_l',
      UG: 'ufo_gen',
    };
    const key = artKeys[enemy.type];
    enemy.art = key ? (this.game.artBank ? this.game.artBank.get(key) : null) : null;
  }

  ensureBoss() {
    if ((!this.boss || this.boss.custom === 'twinGuards') && this.stage.boss) {
      this.boss = new Boss(this.stage.boss, this.difficulty);
      const bossArtKey =
        this.boss.custom === 'stormEye' ? 'boss2' : this.boss.custom === 'finalLord' ? 'boss3' : this.boss.custom === 'alienMothership' ? 'mothership' : 'boss';
      this.boss.art = this.game.artBank ? this.game.artBank.get(bossArtKey) : null;
    }
  }

  ensureMiniBoss() {
    if (!this.boss && this.stage.miniBoss) {
      this.boss = new Boss(this.stage.miniBoss, this.difficulty);
      if (this.boss.parts) {
        for (const part of this.boss.parts) {
          part.art = this.game.artBank ? this.game.artBank.get(part.artKey) : null;
        }
      }
    }
  }

  spawnBossEscorts(types) {
    for (const type of types) {
      const def = this.stage.enemyDefs[type];
      if (!def) continue;
      const side = ['top', 'topLeft', 'topRight'][Math.floor(Math.random() * 3)];
      const enemy = new Enemy(def, { side, path: type === 'K' ? 'kamikaze' : 'dive' }, this.difficulty, -1);
      this.applyEnemyArt(enemy);
    this.enemies.push(enemy);
    }
  }

  update(dt) {
      if (!this.coop) {
        if (this.pk) this.updatePkMeta(dt);
        this.step(dt);
        return;
      }
      const now = this.coopNowMs();
      const STEP_MS = this.coopStep * 1000;
      while (now - this.coopStartAtMs >= this.coopSample * STEP_MS) {
        const intent = this.sampleCoopIntent();
        this.localIntents[this.coopSample] = intent;
        if (this.coopLocalSim) {
          this.remoteIntents[this.coopSample] = { move: null, bomb: false };
        } else {
          net.sendIntent(this.coopSample, intent.move, intent.bomb, this.stage.id);
        }
        this.coopSample += 1;
      }
      if (!this.coopLocalSim) {
        const rttMs = typeof net.smoothedRttMs === 'number' && net.smoothedRttMs > 0 ? net.smoothedRttMs : 60;
        const want = Math.max(1, Math.min(10, Math.ceil((rttMs + 10) / STEP_MS)));
        if (want !== this.coopBuffer) this.coopBuffer = want;
      }
      const stepLimit = this.coopLocalSim
        ? this.coopSample
        : Math.max(0, this.coopSample - this.coopBuffer);
      let guard = 0;
      while (this.coopNextStep < stepLimit && guard < 12) {
        const f = this.coopNextStep;
        if (!this.coopLocalSim && !this.remoteIntents[f]) {
          if (this.coopSample - f <= this.coopBuffer + this.coopGrace) break;
          this.remoteIntents[f] = this.lastRemoteIntent;
        }
        const remote = this.remoteIntents[f] || { move: null, bomb: false };
        this.coopFrameIntent = {
          p1: this.playerIndex === 1 ? this.localIntents[f] : remote,
          p2: this.playerIndex === 2 ? this.localIntents[f] : remote,
        };
        this.step(this.coopStep);
        if (this.coopBannerTimer > 0) {
          this.coopBannerTimer = Math.max(0, this.coopBannerTimer - this.coopStep);
        }
        this.coopNextStep += 1;
        guard += 1;
      }
    }

  step(dt) {
    if (this.pk && this.state === 'pkNext') {
      this.pkNextTimer -= dt;
      if (this.pkNextTimer <= 0) {
        this.pkNextTimer = 0;
        this.pkStartNextStage();
      }
      return;
    }
    if (this.pk && this.pkState === 'forfeit') {
      this.pkForfeitTimer -= dt;
      if (this.pkForfeitTimer <= 0) {
        this.pkForfeitTimer = 0;
        this.pkBeginSettle(this.pkForfeitName || '对方');
      }
      return;
    }
    if (this.pk && this.pkState === 'settle') {
      this.pkSettleTimer -= dt;
      if (this.pkSettleTimer <= 0 && !this.pkLeaveSent) {
        this.pkLeaveSent = true;
        if (this.pkSettleForfeit) {
          // 对方已逃跑并退出房间，无需再回房间，直接返回标题界面
          net.close();
          this.game.go('title');
        } else {
          net.gameover();
          this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        }
      }
      return;
    }
    if (this.pk && this.pkState !== 'play') {
      this.handlePkTerminal(dt);
      return;
    }
    if (this.state === 'coopNext') {
      this.coopNextTimer -= dt;
      if (this.coopNextTimer <= 0) {
        this.coopNextTimer = 0;
        this.beginNextStage();
      }
      return;
    }
    if (this.revivePhase) {
      this.updateRevive(dt);
      return;
    }
    if (this.paused) {
      const action = this.pauseUi.update(this.game.input, this.player.invincible, this.noSave, this.pk);
      if (action === 'resume') {
        this.paused = false;
      } else if (action === 'escape' && this.pk) {
        this.paused = false;
        this.pkEscape();
      } else if (action === 'save-exit') {
        if (!this.player.invincible && !this.noSave) storage.saveSave(this.makeSnapshot());
        this.game.go('title');
      } else if (action === 'exit') {
        if (!this.noSave) storage.clearSave();
        this.game.go('title');
      }
      return;
    }

    if (this.state === 'bossPlaceholder') {
      this.bossPlaceholderTimer -= dt;
      if (this.bossPlaceholderTimer <= 0) this.triggerClear();
      return;
    }

    this.time += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.background.update(dt);
    this.updateThunder(dt);
    this.particles.update(dt);
    this.updateBombFx(dt);
    this.updateIntro(dt);
    this.handleStageTaps();
    this.updatePlayer(dt);
    if (this.revivePhase) return;
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateBossFlash(dt);
    this.updateBoss(dt);
    this.bullets.update(dt, this.player);
    this.updateCollisions();
    this.updateMeteors(dt);
    this.updatePickups(dt);
    this.checkGameOver();
  }

  updateThunder(dt) {
    if (this.stage.id !== 2) return;
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0) {
      this.game.audio.playLighting();
      this.background.triggerLightning(rand(120, 600));
      this.lightningFlash = 1;
      this.thunderTimer = rand(8, 12);
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 0.5);
  }

  updateIntro(dt) {
    if (this.state !== 'intro') return;
    this.introTimer -= dt;
    if (this.introTimer <= 0) {
      this.state = 'waves';
      this.startEpisode(this.episodeIndex);
    }
  }

  handleStageTaps() {
      if (this.coop) return;
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.inRect(tap, PAUSE_RECT)) {
        this.paused = true;
        this.blockMoveUntilRelease = true;
        return;
      }
      if (this.inRect(tap, BOMB_RECT)) {
        this.blockMoveUntilRelease = true;
        this.tryBomb(this.player);
      }
    }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  updatePlayer(dt) {
    if (this.coop) {
      this.updateCoopPlayers(dt);
      return;
    }
    if (!this.player.art && this.game.artBank && this.game.artBank.ready) {
      this.player.art = this.game.artBank.get('player');
    }
    const moveTarget = this.blockMoveUntilRelease ? null : this.game.input.getMoveTarget();
    if (!this.game.input.active) this.blockMoveUntilRelease = false;
    this.player.update(dt, moveTarget);
    if (!this.player.alive && this.player.respawnTimer <= 0) {
      if (this.player.lives < 0) {
        if (this.offerRevive()) return;
        this.triggerGameOver();
        return;
      }
      this.player.respawn();
      this.bullets.clearEnemy();
      this.particles.ring(this.player.x, this.player.y, '#b7e0ff', 90, 0.6, 5);
    }
    if (this.player.alive) {
      this.shootCount += 1;
      this.player.updateFire(dt, this.bullets);
      if (this.shootCount % 4 === 0) this.game.audio.shoot();
    }
  }

  updateCoopPlayers(dt) {
      if (!this.player.art && this.game.artBank && this.game.artBank.ready) {
        this.player.art = this.game.artBank.get('player');
      }
      if (this.player2 && !this.player2.art && this.player.art) {
        this.player2.art = tintSprite(this.player.art, 'rgba(255,60,60,0.9)');
      }
      const intent = this.coopFrameIntent || {};
      const i1 = intent.p1 || { move: null, bomb: false };
      const i2 = intent.p2 || { move: null, bomb: false };
      this.player.update(dt, this.player.spectating ? null : i1.move);
      this.player2.update(dt, this.player2.spectating ? null : i2.move);

      let bomber = null;
      if (i1.bomb && this.player.alive && !this.player.spectating) bomber = this.player;
      if (!bomber && i2.bomb && this.player2.alive && !this.player2.spectating) bomber = this.player2;
      if (bomber) this.tryBomb(bomber);

      for (const p of [this.player, this.player2]) {
        if (p.alive || p.respawnTimer > 0 || p.spectating) continue;
        if (p.lives > 0) {
          p.respawn();
          p.spectating = false;
          this.bullets.clearEnemy();
          this.particles.ring(p.x, p.y, p.red ? '#ff8fa0' : '#b7e0ff', 90, 0.6, 5);
        } else {
          p.spectating = true;
          const local = this.playerIndex === 1 ? this.player : this.player2;
          this.coopAnnounce(
            local === p
              ? '你已出局 · 观战中'
              : ((p.red ? this.guestName : this.hostName) || '队友') + ' 已出局，等待返场',
            2.6
          );
        }
      }
      if (this.player.spectating && this.player2.spectating) {
        this.triggerGameOver();
        return;
      }
      for (const p of [this.player, this.player2]) {
        if (p.alive && !p.spectating) p.updateFire(dt, this.bullets);
      }
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (local.alive && !local.spectating) {
        this.shootCount += 1;
        if (this.shootCount % 4 === 0) this.game.audio.shoot();
      }
    }

  handleNetMessage(msg) {
      if (msg.type === 'input') {
        if (msg.stage !== undefined && msg.stage !== this.stage.id) return;
        const intent = { move: msg.move || null, bomb: !!msg.bomb };
        this.remoteIntents[msg.frame] = intent;
        this.lastRemoteIntent = intent;
      } else if (msg.type === 'gameover') {
        if (!this.coopEndSent) {
          this.coopEndSent = true;
          this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        }
      }
    }

  damagePlayerFor(p, amount) {
    if (p.damage(amount)) {
      this.hitFlash = 0.5;
      platform.vibrateShort();
    }
  }

  updatePlayer2Collisions() {
    if (!this.coop || !this.player2) return;
    const p2 = this.player2;
    if (!p2.alive || p2.invuln > 0) return;
    for (let i = this.bullets.enemy.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.enemy[i];
      if (circlesOverlap(bullet.x, bullet.y, bullet.r, p2.x, p2.y, p2.r + 2)) {
        const damage = bullet.large ? 30 : 12;
        this.damagePlayerFor(p2, damage);
        this.bullets.enemy.splice(i, 1);
        if (bullet.fragment) this.bullets.spawnFragments(bullet);
        this.particles.burst(p2.x, p2.y, '#ff6f91', 8, 140, 0.4, 4);
        this.game.audio.hit();
      }
    }
    for (const beam of this.bullets.beams) {
      if (beam.timer < (beam.charge || 0)) continue;
      const beamHit = beam.direction === 'horizontal'
        ? Math.abs(p2.y - beam.y) <= beam.width / 2 + p2.r + 4
        : p2.y >= beam.y && Math.abs(p2.x - beam.x) <= beam.width / 2 + p2.r + 4;
      if (beamHit && beam.hitTimer <= 0) {
        beam.hitTimer = beam.hitInterval || 0.4;
        this.damagePlayerFor(p2, beam.damage || 20);
        this.particles.burst(p2.x, p2.y, '#ff8a4a', 10, 160, 0.45, 4);
        this.game.audio.hit();
      }
    }
    for (const enemy of this.enemies.slice()) {
      if (enemy.dead) continue;
      if (circlesOverlap(enemy.x, enemy.y, enemy.r, p2.x, p2.y, p2.r + 6)) {
        this.damagePlayerFor(p2, 20);
        enemy.damage(999);
        this.particles.burst(enemy.x, enemy.y, '#ff9dab', 10, 120, 0.4, 4);
      }
    }
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      const m = this.meteors[i];
      if (circlesOverlap(m.x, m.y, m.r, p2.x, p2.y, p2.r + 6)) {
        this.damagePlayerFor(p2, 30);
        this.explodeMeteor(m, i, false);
      }
    }
    if (this.boss && !this.boss.dead) {
      if (this.boss.custom === 'stormEye' && this.boss.isDiving() &&
          circlesOverlap(p2.x, p2.y, p2.r, this.boss.x, this.boss.y, this.boss.r * 0.75)) {
        this.damagePlayerFor(p2, 25);
        this.boss.flash = 1;
      }
      if (this.boss.custom === 'alienMothership' && this.boss.isAlienDiving() &&
          circlesOverlap(p2.x, p2.y, p2.r, this.boss.x, this.boss.y, this.boss.r * 0.8)) {
        this.damagePlayerFor(p2, 30);
        this.boss.flash = 1;
      }
      if (this.boss.custom === 'twinGuards') {
        for (const part of this.boss.parts) {
          if (!part.dead && part.diveState === 'dive' &&
              circlesOverlap(p2.x, p2.y, p2.r, part.x, part.y, part.r * 0.8)) {
            this.damagePlayerFor(p2, 25);
            part.flash = 1;
          }
        }
      }
    }
  }

  sampleCoopIntent() {
      const intent = { move: null, bomb: false };
      const input = this.game && this.game.input;
      if (!input) return intent;
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (!local || local.spectating) return intent;
      if (this.blockMoveUntilRelease && !input.active) this.blockMoveUntilRelease = false;
      const tap = input.consumeTap();
      if (tap && this.inRect(tap, BOMB_RECT)) {
        intent.bomb = true;
        this.blockMoveUntilRelease = true;
      }
      if (!this.blockMoveUntilRelease && input.active) {
        intent.move = input.getMoveTarget();
      }
      return intent;
    }

    coopAnnounce(text, duration) {
      this.coopMsg = text || '';
      this.coopBannerTimer = duration || 2.2;
    }

    addTeamScore(amount) {
      if (!this.coop) {
        this.player.addScore(amount);
        return;
      }
      this.player.score += amount;
      for (const threshold of Player.EXTRA_LIFE_SCORES || []) {
        if (this.player.score < threshold || this.coopClaimedExtras.indexOf(threshold) !== -1) continue;
        this.coopClaimedExtras.push(threshold);
        this.coopAnnounce('奖命达成 · 双方残机 +1', 2.6);
        for (const p of [this.player, this.player2]) {
          if (p.spectating) {
            p.lives += 1;
            this.reviveSpectator(p);
          } else {
            p.lives += 1;
            p.lifeFlash = 2;
          }
        }
      }
    }

    reviveSpectator(p) {
      p.reviveFromSpectate();
      this.particles.ring(p.x, p.y, '#ffd36b', 130, 0.9, 8);
      this.game.audio.levelup();
    }

    beginNextStage() {
      const next = this.coopNextStageId;
      this.coopNextStageId = 0;
      this.resetStageWorld(next);
    }

    resetStageWorld(stageId) {
      this.stage = getStage(stageId);
      this.seed = this.baseSeed + Math.max(0, stageId - 1);
      setGlobalSeed(this.seed);
      const resetShips = [this.player];
      if (this.player2) resetShips.push(this.player2);
      for (const p of resetShips) {
        p.x = p === this.player2 ? 160 : 360;
        p.y = p === this.player2 ? 900 : 1080;
        p.tilt = 0;
        if (p.spectating) {
          p.respawnTimer = 0;
          continue;
        }
        if (!p.alive && p.lives > 0) p.respawn();
        p.invuln = Math.max(p.invuln, 2);
      }
      this.bullets = new BulletManager(this.game.artBank);
      this.enemies = [];
      this.pickups = [];
      this.particles = new ParticleSystem();
      this.background = new MountainBackground({
        fixed: this.stage.background || null,
        terrain: this.stage.id === 1,
        sea: this.stage.id === 2,
        cloudtop: this.stage.id === 3,
        space: !!this.stage.space,
      });
      this.boss = null;
      this.bossFlashTimer = 0;
      this.paused = false;
      this.blockMoveUntilRelease = false;
      this.bombFx = null;
      this.bombTextTimer = 0;
      this.screenFlash = 0;
      this.hitFlash = 0;
      this.shields = [];
      this.meteors = [];
      this.meteorStormTimer = 0;
      this.cinematic = null;
      this.bossPlaceholderTimer = 0;
      this.miniBossCleared = false;
      this.bossPhase2Played = false;
      this.finalLordDropsSent = false;
      this.boss4BgmPlayed = false;
      this.alienDeathMusicStopped = false;
      this.bossDeadFade = 0;
      this.fakeEndingMode = (this.difficulty.id === 'hard' || this.difficulty.id === 'insane') && this.stage.id === 3;
      this.thunderTimer = rand(8, 12);
      this.lightningFlash = 0;
      this.thunderFlashDelay = 0;
      this.time = 0;
      this.shootCount = 0;
      this.gameOverSent = false;
      this.clearSent = false;
      this.activeEpisodeId = 0;
      this.episodeSpawns = [];
      this.episodeTimer = 0;
      this.pauseTimer = 0;
      this.episodeIndex = 0;
      this.state = 'intro';
      this.introTimer = 2.8;
      this.coopMsg = '';
      this.coopBannerTimer = 0;
      if (this.stage.id === 2) this.game.audio.playStage2Bgm();
      else if (this.stage.id === 3) this.game.audio.playStage3Bgm();
      else if (this.stage.id === 4) this.game.audio.playStage4Bgm();
      else this.game.audio.playStageBgm();
    }

    renderCoopOverlay(ctx) {
      if (!this.coop) return;
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (local && local.spectating) {
        ctx.fillStyle = '#ff9db0';
        ctx.font = 'bold 26px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('你已出局 · 观战中', 360, 196);
        ctx.textAlign = 'left';
      }
      if (this.coopBannerTimer > 0 && this.coopMsg) {
        ctx.globalAlpha = Math.min(1, this.coopBannerTimer);
        ctx.fillStyle = 'rgba(8,14,30,0.55)';
        ctx.fillRect(120, 700, 480, 92);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.coopMsg, 360, 752);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
      if (this.state === 'coopNext') {
        ctx.fillStyle = 'rgba(6,10,24,0.55)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 44px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${this.stage.id} 关突破`, 360, 600);
        ctx.font = 'bold 24px sans-serif';
        const next = this.coopNextStageId;
        const nextStage = getStage(next);
        ctx.fillText(`即将进入第 ${next} 关 · ${nextStage ? nextStage.title : ''}`, 360, 660);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#9fd8ff';
        ctx.fillText(String(Math.max(1, Math.ceil(this.coopNextTimer))), 360, 722);
        ctx.textAlign = 'left';
      }
    }


  updatePkMeta(dt) {
      if (!this.pk || this.pkState !== 'play') return;
      this.pkStateTimer -= dt;
      if (this.pkStateTimer <= 0) {
        this.pkStateTimer = 0.25;
        net.sendPkState({
          score: this.player.score,
          stage: this.stage.id,
          lives: Math.max(0, this.player.lives),
          hp: Math.max(0, Math.ceil(this.player.hp)),
          maxHp: this.player.maxHp,
          over: false,
        });
      }
    }

    handlePkMessage(msg) {
        if (!msg) return;
        if (msg.type === 'pkState') {
          this.pkOpp.score = msg.score || 0;
          this.pkOpp.stage = msg.stage || this.pkOpp.stage;
          this.pkOpp.lives = typeof msg.lives === 'number' ? msg.lives : this.pkOpp.lives;
          this.pkOpp.hp = msg.hp || 0;
          this.pkOpp.maxHp = msg.maxHp || 100;
          if (msg.over) this.pkOpp.over = true;
          return;
        }
        if (msg.type === 'pkFinished') {
          this.pkOpp.score = msg.score || 0;
          this.pkOpp.stage = msg.stage || this.pkOpp.stage;
          this.pkOpp.over = true;
          this.pkOppFinished = true;
          if (this.pkState !== 'play' && this.pkFinishedSent) this.pkBeginSettle();
          return;
        }
        if (msg.type === 'pkWatchOn') {
          this.pkBroadcast = !!msg.on;
          return;
        }
        if (msg.type === 'pkFrame') {
          this.pkFrameData = msg.data || '';
          const ImageCtor = typeof Image !== 'undefined' ? Image : null;
          if (ImageCtor && this.pkFrameData) {
            const img = new ImageCtor();
            img.onload = () => { this.pkFrameImg = img; };
            img.src = this.pkFrameData;
          }
          return;
        }
        if (msg.type === 'pkForfeit') {
          this.pkConfirm = null;
          this.game.audio.stopBgm();
          this.pkForfeitName = msg.name || '对方';
          this.pkForfeitTimer = 2;
          this.pkBroadcast = false;
          this.pkState = 'forfeit';
          this.pkChoice = null;
          return;
        }
        if (msg.type === 'gameover') {
          if (!this.pkLeaveSent) {
            this.pkLeaveSent = true;
            this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
          }
          return;
        }
        if (msg.type === 'peerLeft') {
          net.close();
          this.game.go('title');
        }
      }

    pkFinishRun(cleared) {
      if (this.pkState !== 'play') return;
      this.pkState = cleared ? 'clear' : 'over';
      this.game.audio.stopLighting();
      this.game.audio.stopBgm();
      if (cleared) this.game.audio.clear();
      else this.game.audio.gameover();
      if (!this.pkFinishedSent) {
        this.pkFinishedSent = true;
        net.sendPkFinished(this.player.score, this.stage.id, cleared);
      }
      if (this.pkOppFinished && this.pkOpp.over) this.pkBeginSettle();
    }

    pkBeginSettle(forfeitName) {
        if (this.pkState === 'settle') return;
        this.pkConfirm = null;
        this.pkSettleForfeit = forfeitName || '';
        this.pkState = 'settle';
        this.pkSettleTimer = 3;
        this.pkChoice = 'settle';
        const myScore = this.player.score;
        const oppScore = this.pkOpp.score;
        if (this.pkSettleForfeit || myScore > oppScore) achievements.unlock('pvp');
      }

    pkStartNextStage() {
      this.resetStageWorld(this.pkNextStageId);
    }

    handlePkTerminal(dt) {
        if (this.pkState === 'settle' || this.pkState === 'forfeit') return;
        const tap = this.game.input.consumeTap();
        if (!tap) return;
        if (this.pkConfirm) {
          if (this.inRect(tap, PK_CONFIRM_YES)) {
            this.pkConfirm = null;
            this.pkForfeitLocal();
          } else if (this.inRect(tap, PK_CONFIRM_NO)) {
            this.pkConfirm = null;
          }
          return;
        }
        if (this.pkChoice === 'wait' || this.pkChoice === 'watch') {
          if (this.inRect(tap, PK_EXIT_RECT)) {
            this.pkConfirm = { mode: 'exitForfeit' };
            this.game.audio.pickup();
            return;
          }
          if (this.pkChoice === 'wait' && this.inRect(tap, PK_TOP_RIGHT_RECT)) {
            this.pkChoice = 'watch';
            net.sendPkWatch(true);
            this.game.audio.pickup();
            return;
          }
          if (this.pkChoice === 'watch' && this.inRect(tap, PK_TOP_RIGHT_RECT)) {
            this.pkChoice = 'wait';
            net.sendPkWatch(false);
            this.game.audio.pickup();
          }
          return;
        }
        if (this.inRect(tap, PK_WATCH_RECT)) {
          this.pkChoice = 'watch';
          net.sendPkWatch(true);
          this.game.audio.pickup();
          return;
        }
        if (this.inRect(tap, PK_WAIT_RECT)) {
          this.pkChoice = 'wait';
          this.game.audio.pickup();
        }
      }

    drawPkOpponentBar(ctx) {
        ctx.fillStyle = 'rgba(4,8,20,0.62)';
        ctx.fillRect(0, 1248, 720, 32);
        const myName = this.playerIndex === 1 ? (this.hostName || 'P1') : (this.guestName || 'P2');
        const oppName = this.playerIndex === 1 ? (this.guestName || 'P2') : (this.hostName || 'P1');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('你 ' + myName + '  ' + String(this.player.score).padStart(7, '0'), 24, 1270);
        ctx.fillStyle = '#ff9db0';
        ctx.textAlign = 'right';
        ctx.fillText(String(this.pkOpp.score).padStart(7, '0') + '  ' + oppName + '（对方）', 696, 1270);
        ctx.textAlign = 'left';
      }

    renderPkOverlay(ctx) {
        if (!this.pk) return;
        if (this.pkState === 'play') {
          this.drawPkOpponentBar(ctx);
          return;
        }
        if (this.pkState === 'forfeit') {
          ctx.fillStyle = 'rgba(4,6,16,0.82)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffd36b';
          ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('对方已逃跑', 360, 560);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('即将进入结算界面…', 360, 640);
          ctx.fillStyle = 'rgba(220,232,255,0.85)';
          ctx.font = '22px sans-serif';
          ctx.fillText(String(Math.max(1, Math.ceil(this.pkForfeitTimer))), 360, 700);
          ctx.textAlign = 'left';
          return;
        }
        if (this.pkChoice === 'wait') {
          ctx.fillStyle = 'rgba(4,6,16,0.72)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffe9b8';
          ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('等待结算', 360, 400);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('对方仍在游戏中 · 分数实时更新', 360, 470);
          ctx.fillStyle = 'rgba(220,232,255,0.8)';
          ctx.font = '20px sans-serif';
          ctx.fillText('对方结束后将自动进入 PK 结算', 360, 520);
          ctx.textAlign = 'left';
          drawButton(ctx, PK_EXIT_RECT, '退出房间', { font: 'bold 22px sans-serif', accent: 'rgba(255,140,150,0.95)' });
          drawButton(ctx, PK_TOP_RIGHT_RECT, '观战', { font: 'bold 24px sans-serif', accent: 'rgba(140,230,180,0.95)' });
          this.drawPkOpponentBar(ctx);
          return;
        }
        if (this.pkChoice === 'watch') {
          ctx.fillStyle = '#04070d';
          ctx.fillRect(0, 0, 720, 1280);
          const img = this.pkFrameImg;
          if (img) {
            try { ctx.drawImage(img, 0, 0, 720, 1280); } catch (e) {}
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 28px "STKaiti","KaiTi",serif';
            ctx.textAlign = 'center';
            ctx.fillText('正在同步对方画面…', 360, 620);
            ctx.textAlign = 'left';
          }
          ctx.fillStyle = 'rgba(140,230,180,0.95)';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('观战中 · 对方结束后自动结算', 360, 72);
          ctx.textAlign = 'left';
          this.drawPkOpponentBar(ctx);
          drawButton(ctx, PK_EXIT_RECT, '退出房间', { font: 'bold 22px sans-serif', accent: 'rgba(255,140,150,0.95)' });
          drawButton(ctx, PK_TOP_RIGHT_RECT, '等待结算', { font: 'bold 24px sans-serif', accent: 'rgba(140,200,255,0.95)' });
          return;
        }
        if (this.pkState === 'settle') {
          const myScore = this.player.score;
          const oppScore = this.pkOpp.score;
          const myName = this.playerIndex === 1 ? (this.hostName || 'P1') : (this.guestName || 'P2');
          const oppName = this.playerIndex === 1 ? (this.guestName || 'P2') : (this.hostName || 'P1');
          ctx.fillStyle = 'rgba(4,6,16,0.84)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffe9b8';
          ctx.font = 'bold 58px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('PK 结算', 360, 320);
          ctx.font = 'bold 30px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(myName + '  ' + String(myScore).padStart(7, '0'), 360, 430);
          ctx.fillStyle = '#ffd36b';
          ctx.fillText('VS', 360, 492);
          ctx.fillStyle = '#fff';
          ctx.fillText(oppName + '  ' + String(oppScore).padStart(7, '0'), 360, 554);
          let verdict = '';
          if (this.pkSettleForfeit) {
            verdict = this.pkSettleForfeit + ' 逃跑 · 你胜出';
          } else if (myScore > oppScore) {
            verdict = myName + ' 胜出';
          } else if (oppScore > myScore) {
            verdict = oppName + ' 胜出';
          } else {
            verdict = '平局';
          }
          ctx.fillStyle = '#ffd36b';
          ctx.font = 'bold 40px "STKaiti","KaiTi",serif';
          ctx.fillText(verdict, 360, 672);
          ctx.fillStyle = 'rgba(220,232,255,0.8)';
          ctx.font = '22px sans-serif';
          ctx.fillText((this.pkSettleForfeit ? '即将返回标题界面 · ' : '即将返回房间 · ') + Math.max(1, Math.ceil(this.pkSettleTimer)), 360, 742);
          ctx.textAlign = 'left';
          return;
        }
        ctx.fillStyle = 'rgba(4,6,16,0.74)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = this.pkState === 'clear' ? '#9fe8b8' : '#ff9db0';
        ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.pkState === 'clear' ? '本局通关' : '你已阵亡', 360, 390);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('本局得分 ' + String(this.player.score).padStart(7, '0'), 360, 470);
        ctx.fillStyle = 'rgba(220,232,255,0.75)';
        ctx.font = '22px sans-serif';
        ctx.fillText('选择观战，或等待对方结束后结算', 360, 540);
        ctx.textAlign = 'left';
        drawButton(ctx, PK_WATCH_RECT, '观战', { font: 'bold 28px sans-serif', accent: 'rgba(140,230,180,0.95)' });
        drawButton(ctx, PK_WAIT_RECT, '等待结算', { font: 'bold 26px sans-serif', accent: 'rgba(140,200,255,0.95)' });
        this.drawPkOpponentBar(ctx);
      }

    renderPkConfirm(ctx) {
        if (!this.pkConfirm) return;
        if (this.pkState !== 'over' && this.pkState !== 'clear') return;
        ctx.fillStyle = 'rgba(4,6,16,0.62)';
        ctx.fillRect(0, 0, 720, 1280);
        drawPanel(ctx, PK_CONFIRM_PANEL);
        ctx.fillStyle = '#ffd36b';
        ctx.font = 'bold 36px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('退出房间', 360, 578);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('是否退出房间？', 360, 642);
        ctx.fillStyle = 'rgba(255,157,176,0.95)';
        ctx.font = '20px sans-serif';
        ctx.fillText('确认后本局将自动判负 · 对方胜出', 360, 682);
        ctx.textAlign = 'left';
        drawButton(ctx, PK_CONFIRM_YES, '确认退出', { font: 'bold 24px sans-serif', accent: 'rgba(255,120,120,0.9)' });
        drawButton(ctx, PK_CONFIRM_NO, '取消', { font: 'bold 24px sans-serif', accent: 'rgba(140,200,255,0.9)' });
      }

    pkEscape() {
        if (this.pkState !== 'play') return;
        this.pkFinishRun(false);
      }

      pkForfeitLocal() {
        if (this.pkLeaveSent) return;
        this.pkLeaveSent = true;
        net.sendPkForfeit();
        net.close();
        this.game.go('title');
      }


    capturePkFrame(ctx) {
        if (!this.pk || this.pkState !== 'play' || !this.pkBroadcast) return;
        const now = Date.now();
        const cv = ctx && ctx.canvas;
        if (!cv || typeof cv.toDataURL !== 'function') return;
        let target = cv;
        let period = 220;
        let quality = 0.35;
        try {
          if (typeof document !== 'undefined' && document.createElement) {
            if (!this.pkOffCanvas) {
              this.pkOffCanvas = document.createElement('canvas');
              this.pkOffCanvas.width = 270;
              this.pkOffCanvas.height = 480;
            }
            const octx = this.pkOffCanvas.getContext('2d');
            if (octx && typeof this.pkOffCanvas.toDataURL === 'function') {
              octx.drawImage(cv, 0, 0, 270, 480);
              target = this.pkOffCanvas;
              period = 66;
              quality = 0.5;
            }
          }
          if (now - this.pkLastFrameAt < period) return;
          this.pkLastFrameAt = now;
          net.sendPkFrame(target.toDataURL('image/jpeg', quality));
        } catch (e) {}
      }


  updateWave(dt) {
    if (this.state !== 'waves') return;
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.advanceEpisode();
      return;
    }
    const episode = this.stage.episodes[this.episodeIndex];
    if (!episode) {
      this.advanceEpisode();
      return;
    }
    if (episode.type === 'burst') {
      if (this.cinematic) {
        this.cinematic.t += dt;
        if (this.cinematic.t >= this.cinematic.duration) {
          this.cinematic = null;
          this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 1.5;
        }
        return;
      }
      this.episodeTimer += dt;
      for (const spawn of this.episodeSpawns) {
        if (spawn.spawned < spawn.count && this.episodeTimer >= spawn.nextAt) {
          this.spawnEnemy(spawn, spawn.spawned);
          spawn.spawned += 1;
          spawn.nextAt += spawn.interval * (0.8 + Math.random() * 0.4);
        }
      }
      const activeLeft =
        this.enemies.some((enemy) => enemy.waveId === this.activeEpisodeId) ||
        this.meteors.some((m) => m.waveId === this.activeEpisodeId);
      if (this.episodeTimer >= episode.duration && !activeLeft) {
        if (episode.meteorClearAtEnd) this.clearAllMeteors();
        this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 1.5;
      }
      return;
    }
    const activeLeft = this.enemies.some((enemy) => enemy.waveId === this.activeEpisodeId);
    if (!activeLeft) {
      this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 2;
    }
  }

  advanceEpisode() {
    this.episodeIndex += 1;
    if (this.stage.id === 3 && this.episodeIndex === 10 && !this.miniBossCleared) {
      this.state = 'miniBossWarning';
      this.miniBossWarningTimer = 2.0;
      this.screenFlash = 1;
      this.game.audio.bossWarning();
      return;
    }
    if (this.episodeIndex < this.stage.episodes.length) {
      this.startEpisode(this.episodeIndex);
    } else if (this.stage.id === 2) {
      this.state = 'bossFlash';
      this.bossFlashTimer = 0.5;
    } else if (this.stage.id === 4) {
      this.state = 'bossWarning';
      this.bossWarningTimer = 2.2;
      this.game.audio.bossWarning();
    } else {
      this.state = 'bossWarning';
      this.bossWarningTimer = 2.2;
      this.game.audio.bossWarning();
    }
  }

  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (!enemy.art && this.game.artBank && this.game.artBank.ready) this.applyEnemyArt(enemy);
      enemy.update(dt, this.bullets, this.player, this.difficulty, this.time);
      if (enemy.dead) {
        this.killEnemy(enemy);
        this.removeShield(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      if (enemy.offScreen()) {
        this.removeShield(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      if (
        this.player.alive &&
        this.player.invuln <= 0 &&
        circlesOverlap(enemy.x, enemy.y, enemy.r, this.player.x, this.player.y, this.player.r + 6)
      ) {
        this.damagePlayer(20);
        enemy.damage(999);
        this.particles.burst(enemy.x, enemy.y, '#ff9dab', 10, 120, 0.4, 4);
        if (enemy.dead) {
          this.killEnemy(enemy);
          this.removeShield(enemy);
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  killEnemy(enemy, quiet) {
      if (this.coop && this.player2) this.player2.addExp(enemy.exp);
      this.player.addExp(enemy.exp);
      this.addTeamScore(enemy.score);
      this.particles.explosion(enemy.x, enemy.y, enemy.flashing ? '#ffd36b' : '#ff8a4a');
      if (!quiet) this.game.audio.explosion();
      if (enemy.glow === 'yellow') {
        this.pickups.push({ type: 'bomb', x: enemy.x, y: enemy.y });
      } else if (enemy.glow === 'blue') {
        this.pickups.push({ type: 'shield', x: enemy.x, y: enemy.y });
      } else if (enemy.flashing) {
        this.pickups.push({ type: 'bomb', x: enemy.x, y: enemy.y });
      } else if (this.stage.id !== 4 && Math.random() < (enemy.def.heartChance || 0)) {
        this.pickups.push({ type: 'heart', x: enemy.x, y: enemy.y });
      }
    }

  updateBossFlash(dt) {
    if (this.state !== 'bossFlash') return;
    this.bossFlashTimer -= dt;
    if (this.bossFlashTimer <= 0) {
      this.state = 'bossWarning';
      this.bossWarningTimer = 1.8;
      this.game.audio.bossWarning();
    }
  }

  updateBoss(dt) {
    if (this.state === 'miniBossWarning') {
      this.miniBossWarningTimer -= dt;
      this.ensureMiniBoss();
      if (this.miniBossWarningTimer <= 0) {
        this.state = 'miniBoss';
        if (this.boss) this.boss.showSpell('锋卫双骑 降临');
      }
      return;
    }
    if (this.state === 'miniBoss') {
      this.ensureMiniBoss();
      if (!this.boss) return;
      for (const part of this.boss.parts) {
        if (!part.art && this.game.artBank && this.game.artBank.ready) {
          part.art = this.game.artBank.get(part.artKey);
        }
      }
      this.boss.update(dt, this.bullets, this.player);
      if (this.boss.phase2 && !this.bossPhase2Played) {
        this.bossPhase2Played = true;
        this.game.audio.bossPhase();
      }
      if (this.boss.dead) {
        this.state = 'miniBossDeath';
        this.miniBossDeathTimer = 0;
        this.bullets.clearEnemy();
        for (const part of this.boss.parts) {
          this.particles.explosion(part.x, part.y, '#ffd36b');
        }
        this.pickups.push({ type: 'heart', x: 200, y: 420 });
        this.pickups.push({ type: 'heart', x: 520, y: 420 });
        this.pickups.push({ type: 'bomb', x: 360, y: 470 });
      }
      return;
    }
    if (this.state === 'miniBossDeath') {
      this.miniBossDeathTimer += dt;
      if (this.boss) {
        for (const part of this.boss.parts) {
          this.particles.burst(
            part.x + (Math.random() - 0.5) * 140,
            part.y + (Math.random() - 0.5) * 140,
            '#ffe9b8',
            5,
            170,
            0.6,
            5
          );
        }
      }
      if (this.miniBossDeathTimer > 3.0) {
        this.state = 'reinforceBanner';
        this.reinforceTimer = 2.5;
      }
      return;
    }
    if (this.state === 'reinforceBanner') {
      this.reinforceTimer -= dt;
      if (this.reinforceTimer <= 0) {
        this.miniBossCleared = true;
        this.episodeIndex = 10;
        this.state = 'waves';
        this.startEpisode(10);
      }
      return;
    }
    if (this.state === 'bossWarning') {
      this.bossWarningTimer -= dt;
      this.ensureBoss();
      if (this.boss) {
        this.boss.y = -190;
      }
      if (this.bossWarningTimer <= 0) {
        this.state = 'boss';
        if (this.boss) this.boss.showSpell(this.boss.config.skills[0].label);
      }
      return;
    }
    if (this.state === 'boss') {
      this.ensureBoss();
      if (!this.boss) return;
      if (!this.boss.art && this.game.artBank && this.game.artBank.ready) {
        const bossArtKey =
          this.boss.custom === 'stormEye' ? 'boss2' : this.boss.custom === 'finalLord' ? 'boss3' : this.boss.custom === 'alienMothership' ? 'mothership' : 'boss';
        this.boss.art = this.game.artBank.get(bossArtKey);
      }
      if (this.stage.id === 4 && this.boss.custom === 'alienMothership' && !this.boss4BgmPlayed) {
        this.boss4BgmPlayed = true;
        this.game.audio.playBoss4Bgm();
      }
      this.boss.summonCallback = (types) => this.spawnBossEscorts(types);
      this.boss.update(dt, this.bullets, this.player);
      if (this.boss.phase !== this.bossPhase) {
        this.bossPhase = this.boss.phase;
        this.game.audio.bossPhase();
      }
      if (this.boss.dead) {
        this.state = 'bossDeath';
        this.bossDeathTimer = 0;
        this.bullets.clearEnemy();
        this.particles.explosion(this.boss.x, this.boss.y, '#ff8fb0');
      }
      return;
    }
    if (this.state === 'bossDeath') {
      this.bossDeathTimer += dt;
      if (this.boss) {
        const color = this.boss.custom === 'finalLord' ? '#d8b6ff' : '#ffe9b8';
        this.particles.burst(this.boss.x + (Math.random() - 0.5) * 170, this.boss.y + (Math.random() - 0.5) * 170, color, 6, 170, 0.6, 5);
        if (this.boss.custom === 'finalLord' && Math.random() < dt * 7) {
          this.particles.burst(
            this.boss.x + (Math.random() - 0.5) * 240,
            this.boss.y + (Math.random() - 0.5) * 240,
            '#ffd36b',
            8,
            230,
            0.7,
            6
          );
        }
      }
      if (this.boss && this.boss.custom === 'alienMothership') {
        if (!this.alienDeathMusicStopped) {
          this.alienDeathMusicStopped = true;
          this.game.audio.stopBgm();
        }
        if (this.bossDeathTimer >= 5) {
          this.bossDeadFade = Math.min(1, this.bossDeadFade + dt / 1.5);
          if (this.bossDeadFade >= 1) {
            if (this.coop || this.pk) { this.triggerClear(); return; }
            this.game.go('trueending', {
              difficulty: this.difficulty.id,
              score: this.player.score,
              progress: this.progressState(),
              invincible: this.player.invincible,
            });
          }
        }
        return;
      }
      if (this.fakeEndingMode && this.boss && this.boss.custom === 'finalLord') {
        if (this.bossDeathTimer >= 4 && !this.finalLordDropsSent) {
          this.finalLordDropsSent = true;
          this.addTeamScore(200000);
          this.pickups.push({ type: 'heart', x: 140, y: 500 });
          this.pickups.push({ type: 'heart', x: 300, y: 560 });
          this.pickups.push({ type: 'heart', x: 420, y: 560 });
          this.pickups.push({ type: 'heart', x: 580, y: 500 });
          this.pickups.push({ type: 'bomb', x: 230, y: 640 });
          this.pickups.push({ type: 'bomb', x: 490, y: 640 });
        }
        if (this.bossDeathTimer >= 9.5) {
          if (this.coop || this.pk) { this.triggerClear(); return; }
          this.game.audio.playTitleBgm();
          this.game.go('fakeending', {
            difficulty: this.difficulty.id,
            score: this.player.score,
            progress: this.progressState(),
            invincible: this.player.invincible,
          });
        }
        return;
      }
      if (this.boss && this.boss.custom === 'finalLord' && !this.finalLordDropsSent) {
        this.finalLordDropsSent = true;
        this.addTeamScore(200000);
        this.pickups.push({ type: 'heart', x: 140, y: 500 });
        this.pickups.push({ type: 'heart', x: 300, y: 560 });
        this.pickups.push({ type: 'heart', x: 420, y: 560 });
        this.pickups.push({ type: 'heart', x: 580, y: 500 });
        this.pickups.push({ type: 'bomb', x: 230, y: 640 });
        this.pickups.push({ type: 'bomb', x: 490, y: 640 });
      }
      const deathDuration =
        this.boss && this.boss.custom === 'stormEye' ? 3.4 :
        this.boss && this.boss.custom === 'finalLord' ? 4.0 : 2.2;
      if (this.bossDeathTimer > deathDuration) {
        this.triggerClear();
      }
    }
  }

  updateCollisions() {
    for (let i = this.bullets.player.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.player[i];
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (circlesOverlap(bullet.x, bullet.y, bullet.r, enemy.x, enemy.y, enemy.r)) {
          const shield = this.findShieldFor(enemy);
          if (shield) {
            shield.hp -= bullet.damage;
            this.particles.sparkle(shield.enemy.x, shield.enemy.y, shield.kind === 'em' ? '#c26bff' : '#ffd36b', 3);
            if (shield.hp <= 0) {
              shield.active = false;
              this.particles.explosion(shield.enemy.x, shield.enemy.y, shield.kind === 'em' ? '#c26bff' : '#ffe9b8');
              this.game.audio.hit();
            }
          } else {
            enemy.damage(bullet.damage);
            if (enemy.dead) {
              this.killEnemy(enemy);
              this.removeShield(enemy);
              this.enemies.splice(j, 1);
            }
          }
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (let k = this.bullets.enemy.length - 1; k >= 0; k -= 1) {
          const missile = this.bullets.enemy[k];
          if (!missile.destructible) continue;
          if (circlesOverlap(bullet.x, bullet.y, bullet.r, missile.x, missile.y, missile.r)) {
            missile.hp -= bullet.damage;
            this.particles.sparkle(missile.x, missile.y, '#ffb13d', 3);
            if (missile.hp <= 0) {
              this.bullets.enemy.splice(k, 1);
              this.particles.explosion(missile.x, missile.y, '#ffb13d');
              this.game.audio.hit();
            }
            hit = true;
            break;
          }
        }
      }
      if (!hit && this.boss && !this.boss.dead && this.state === 'boss') {
        const turretSide = this.boss.hitTurret(bullet.x, bullet.y, bullet.r);
        if (turretSide) {
          this.boss.damageTurret(turretSide, bullet.damage);
          this.particles.sparkle(bullet.x, bullet.y, '#ff5f6b', 3);
          hit = true;
        } else if (circlesOverlap(bullet.x, bullet.y, bullet.r, this.boss.x, this.boss.y, this.boss.r)) {
          this.boss.damage(bullet.damage);
          this.particles.sparkle(bullet.x, bullet.y, '#ffd36b', 2);
          hit = true;
        }
      }
      if (!hit && this.boss && this.boss.custom === 'twinGuards' && this.state === 'miniBoss') {
        for (const part of this.boss.parts) {
          if (!part.dead && circlesOverlap(bullet.x, bullet.y, bullet.r, part.x, part.y, part.r)) {
            this.boss.damagePart(part.key, bullet.damage);
            this.particles.sparkle(bullet.x, bullet.y, '#ffd36b', 3);
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (let k = this.meteors.length - 1; k >= 0; k -= 1) {
          const meteor = this.meteors[k];
          if (circlesOverlap(bullet.x, bullet.y, bullet.r, meteor.x, meteor.y, meteor.r)) {
            meteor.hp -= bullet.damage;
            this.particles.sparkle(meteor.x, meteor.y, '#d8a06a', 2);
            if (meteor.hp <= 0) this.explodeMeteor(meteor, k, true);
            hit = true;
            break;
          }
        }
      }
      if (hit) this.bullets.player.splice(i, 1);
    }

    if (this.player.alive && this.player.invuln <= 0) {
      if (this.boss && this.boss.custom === 'stormEye' && this.boss.isDiving() &&
          circlesOverlap(this.player.x, this.player.y, this.player.r, this.boss.x, this.boss.y, this.boss.r * 0.75)) {
        this.damagePlayer(25);
        this.boss.flash = 1;
        this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
        this.game.audio.hit();
      }
      if (this.boss && this.boss.custom === 'twinGuards') {
        for (const part of this.boss.parts) {
          if (!part.dead && part.diveState === 'dive' &&
              circlesOverlap(this.player.x, this.player.y, this.player.r, part.x, part.y, part.r * 0.8)) {
            this.damagePlayer(25);
            part.flash = 1;
            this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
            this.game.audio.hit();
          }
        }
      }

      if (this.boss && this.boss.custom === 'alienMothership' && this.boss.isAlienDiving() &&
          circlesOverlap(this.player.x, this.player.y, this.player.r, this.boss.x, this.boss.y, this.boss.r * 0.8)) {
        this.damagePlayer(30);
        this.boss.flash = 1;
        this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
        this.game.audio.hit();
      }
      for (const beam of this.bullets.beams) {
        if (beam.timer < (beam.charge || 0)) continue;
        const beamHit = beam.direction === 'horizontal'
          ? Math.abs(this.player.y - beam.y) <= beam.width / 2 + this.player.r + 4
          : this.player.y >= beam.y && Math.abs(this.player.x - beam.x) <= beam.width / 2 + this.player.r + 4;
        if (beamHit) {
          if (beam.hitTimer <= 0) {
            beam.hitTimer = beam.hitInterval || 0.4;
            this.damagePlayer(beam.damage || 20);
            this.particles.burst(this.player.x, this.player.y, '#ff8a4a', 10, 160, 0.45, 4);
            this.game.audio.hit();
          }
        }
      }
    }

    if (!this.player.alive || this.player.invuln > 0) {
      if (this.coop) this.updatePlayer2Collisions();
      return;
    }
    for (let i = this.bullets.enemy.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.enemy[i];
      if (circlesOverlap(bullet.x, bullet.y, bullet.r, this.player.x, this.player.y, this.player.r + 2)) {
        const damage = bullet.large ? 30 : 12;
        this.damagePlayer(damage);
        this.bullets.enemy.splice(i, 1);
        if (bullet.fragment) this.bullets.spawnFragments(bullet);
        this.particles.burst(this.player.x, this.player.y, '#ff6f91', 8, 140, 0.4, 4);
        this.game.audio.hit();
      }
    }
    this.updatePlayer2Collisions();
  }

  updatePickups(dt) {
      const ships = this.player2 ? [this.player, this.player2] : [this.player];
      for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
        const pickup = this.pickups[i];
        pickup.y += 85 * dt;
        if (pickup.y > 1320) {
          this.pickups.splice(i, 1);
          continue;
        }
        for (const p of ships) {
          if (p.spectating || !p.alive) continue;
          if (!circlesOverlap(pickup.x, pickup.y, 18, p.x, p.y, p.r + 16)) continue;
          if (pickup.type === 'heart') p.heal(30);
          if (pickup.type === 'bomb') {
            if (this.coop) this.player.addBomb(1);
            else p.addBomb(1);
          }
          if (pickup.type === 'shield') p.shield = Math.min(p.maxShield, p.shield + 50);
          this.game.audio.pickup();
          this.particles.sparkle(
            pickup.x,
            pickup.y,
            pickup.type === 'heart' ? '#ff8fb0' : pickup.type === 'shield' ? '#4da6ff' : '#ffd36b',
            8
          );
          this.pickups.splice(i, 1);
          break;
        }
      }
    }

  tryBomb(player) {
      const bomber = this.coop ? player || this.player : this.player;
      if ((this.player.bombs <= 0 && !this.player.invincible) || !bomber.alive || bomber.spectating || this.bombFx) return;
      if (!this.player.invincible) this.player.bombs -= 1;
      bomber.invuln = 3;
      this.bullets.clearEnemy();
      this.bombFx = { timer: 0, count: 0, x: bomber.x, y: bomber.y };
      this.bombTextTimer = 1.5;
      this.screenFlash = 1;
      this.game.audio.bomb();
      this.particles.burst(bomber.x, bomber.y, '#ffe9b8', 42, 320, 0.9, 6);
      for (const enemy of this.enemies.slice()) {
        this.killEnemy(enemy, true);
      }
      this.enemies = [];
      this.shields = [];
      this.meteors = [];
      this.meteorStormTimer = 0;
      this.cinematic = null;
      this.bossPlaceholderTimer = 0;
      if (this.boss && this.boss.custom === 'alienMothership' && !this.boss.dead && this.state === 'boss') {
        for (const turret of this.boss.turrets) {
          if (!turret.broken) this.boss.damageTurret(turret.side, 500);
        }
        if (this.boss.turrets.every((t) => t.broken)) this.boss.damage(500);
        this.particles.burst(this.boss.x, this.boss.y, '#ff8fb0', 22, 220, 0.7, 6);
      } else if (this.boss && !this.boss.dead && (this.state === 'boss' || this.state === 'miniBoss')) {
        this.boss.damage(500);
        this.particles.burst(this.boss.x, this.boss.y, '#ff8fb0', 22, 220, 0.7, 6);
      }
    }

  updateBombFx(dt) {
      if (this.bombFx) {
        this.bombFx.timer += dt;
        while (this.bombFx.count < 3 && this.bombFx.timer >= this.bombFx.count * 0.32) {
          const radius = 260 + this.bombFx.count * 60;
          const color = this.bombFx.count === 0 ? '#ffffff' : '#ffe9b8';
          this.particles.ring(this.bombFx.x, this.bombFx.y, color, radius, 0.85, 10 - this.bombFx.count * 2);
          this.bombFx.count += 1;
        }
        if (this.bombFx.count >= 3) this.bombFx = null;
      }
      this.screenFlash = Math.max(0, this.screenFlash - dt * 1.05);
      this.bombTextTimer = Math.max(0, this.bombTextTimer - dt);
    }

  progressState() {
    return this.player.toState();
  }

  makeSnapshot() {
    const snap = Object.assign(
      {
        version: 1,
        difficulty: this.difficulty.id,
        stage: this.stage.id,
        waveIndex: this.episodeIndex,
        bossPhase: this.boss && this.boss.phase ? this.boss.phase : 0,
        miniBossCleared: !!this.miniBossCleared,
      },
      this.player.toState(),
      { savedAt: Date.now() }
    );
    if (this.boss && this.boss.custom === 'twinGuards') {
      snap.twinHp = this.boss.parts.map((part) => ({ key: part.key, hp: Math.round(part.hp) }));
    } else if (this.boss) {
      snap.bossHp = Math.round(this.boss.hp);
      snap.bossMaxHp = this.boss.maxHp;
    }
    return snap;
  }

  damagePlayer(amount) {
    if (this.player.damage(amount)) {
      this.hitFlash = 0.5;
      platform.vibrateShort();
    }
  }

  spawnMeteor(spawn, index) {
    const size = spawn.size || 'medium';
    const sizes = {
      large: { r: 34, hp: 1500, speed: 90 },
      medium: { r: 22, hp: 750, speed: 140 },
      small: { r: 13, hp: 300, speed: 190 },
    };
    const cfg = sizes[size] || sizes.medium;
    const baseSpeed = cfg.speed * 1.2 * (spawn.speedFactor || 1);
    const side = spawn.side || 'top';
    let vx = 0;
    let vy = 0;
    let x = 360;
    let y = -60;
    if (side === 'top') {
      x = rand(40, 680);
      y = -60;
      vx = rand(-40, 40);
      vy = baseSpeed;
    } else if (side === 'bottom') {
      x = rand(40, 680);
      y = 1340;
      vx = rand(-40, 40);
      vy = -baseSpeed;
    } else if (side === 'left') {
      x = -60;
      y = rand(100, 900);
      vx = baseSpeed;
      vy = rand(-30, 50);
    } else {
      x = 780;
      y = rand(100, 900);
      vx = -baseSpeed;
      vy = rand(-30, 50);
    }
    this.meteors.push({
      x,
      y,
      vx,
      vy,
      r: cfg.r,
      size,
      hp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      maxHp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      spin: rand(0, TAU),
      spinSpeed: rand(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1),
      waveId: this.activeEpisodeId,
      seed: Math.random(),
    });
  }

  spawnSplitMeteor(size, x, y, angle) {
    const sizes = {
      large: { r: 34, hp: 1500, speed: 90 },
      medium: { r: 22, hp: 750, speed: 140 },
      small: { r: 13, hp: 300, speed: 190 },
    };
    const cfg = sizes[size];
    const speed = cfg.speed * 1.2 * rand(0.85, 1.15);
    this.meteors.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: cfg.r,
      size,
      hp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      maxHp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      spin: rand(0, TAU),
      spinSpeed: rand(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1),
      waveId: this.activeEpisodeId,
      seed: Math.random(),
    });
  }

  explodeMeteor(meteor, index, dropBoost) {
    this.particles.explosion(meteor.x, meteor.y, '#c97b45');
    this.particles.burst(meteor.x, meteor.y, '#ffb36b', 8, 160, 0.5, 5);
    if (meteor.size === 'large') {
      for (let k = 0; k < 3; k += 1) {
        const ang = (k / 3) * TAU + rand(0, 0.4);
        this.spawnSplitMeteor('medium', meteor.x, meteor.y, ang);
      }
    } else if (meteor.size === 'medium') {
      for (let k = 0; k < 3; k += 1) {
        const ang = (k / 3) * TAU + rand(0, 0.4);
        this.spawnSplitMeteor('small', meteor.x, meteor.y, ang);
      }
    }
    this.meteors.splice(index, 1);
  }

  clearAllMeteors() {
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      this.explodeMeteor(this.meteors[i], i, true);
    }
  }

  updateMeteors(dt) {
    if (this.meteorStormTimer > 0) this.meteorStormTimer = Math.max(0, this.meteorStormTimer - dt);
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      const m = this.meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.spin += m.spinSpeed * dt;
      if (m.y > 1360 || m.y < -160 || m.x > 800 || m.x < -80) {
        this.meteors.splice(i, 1);
        continue;
      }
      if (
        this.player.alive &&
        this.player.invuln <= 0 &&
        circlesOverlap(m.x, m.y, m.r, this.player.x, this.player.y, this.player.r + 6)
      ) {
        this.damagePlayer(30);
        this.explodeMeteor(m, i, false);
      }
    }
  }

  renderMeteors(ctx) {
    const artMap = { large: 'meteor_large', medium: 'meteor_medium', small: 'meteor_small' };
    for (const m of this.meteors) {
      const img = this.game.artBank ? this.game.artBank.get(artMap[m.size] || 'meteor_medium') : null;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.spin);
      if (img) {
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (m.r * 3.2) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#5a4636';
        ctx.strokeStyle = 'rgba(30,20,12,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const points = 9;
        for (let p = 0; p < points; p += 1) {
          const a = (p / points) * TAU;
          const rr = m.r * (0.82 + 0.18 * Math.sin(m.seed * 97 + p * 1.7));
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(30,20,12,0.55)';
        ctx.beginPath();
        ctx.arc(-m.r * 0.3, -m.r * 0.2, m.r * 0.28, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.r * 0.25, m.r * 0.3, m.r * 0.18, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(178,107,255,0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, m.r * 1.12, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      if (m.hp < m.maxHp && m.hp > 0) {
        ctx.fillStyle = 'rgba(10,12,8,0.7)';
        ctx.fillRect(m.x - m.r, m.y - m.r - 12, m.r * 2, 4);
        ctx.fillStyle = '#ff7043';
        ctx.fillRect(m.x - m.r, m.y - m.r - 12, m.r * 2 * clamp(m.hp / m.maxHp, 0, 1), 4);
      }
    }
  }

  offerRevive() {
    if (this.coop || this.pk) return false;
    if (this.player.invincible) return false;
    if (this.params.debugStage) return false;
    if (this.player.reviveUsed >= 2) return false;
    if (this.gameOverSent || this.clearSent) return false;
    this.revivePhase = 'prompt';
    return true;
  }

  updateRevive(dt) {
    if (this.revivePhase === 'ad') {
      this.reviveAdTimer -= dt;
      if (this.reviveAdTimer <= 0) {
        this.reviveAdTimer = 0;
        this.revivePhase = null;
        this.performRevive();
      }
      return;
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, REVIVE_YES)) {
      this.game.audio.pickup();
      this.revivePhase = 'ad';
      this.reviveAdTimer = 15;
    } else if (this.inRect(tap, REVIVE_NO)) {
      this.revivePhase = null;
      this.triggerGameOver();
    }
  }

  performRevive() {
    this.player.lives = Math.max(0, this.player.lives + 1);
    this.player.reviveUsed += 1;
    this.player.respawn();
    this.bullets.clearEnemy();
    this.particles.ring(this.player.x, this.player.y, '#b7e0ff', 90, 0.6, 5);
    this.game.audio.pickup();
  }

  checkGameOver() {
    if (this.gameOverSent || this.clearSent) return;
    if (this.coop) return;
    if (this.player.lives < 0) {
      if (this.offerRevive()) return;
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
      if (this.gameOverSent) return;
      this.gameOverSent = true;
      if (this.coop) {
        if (!this.coopEndSent) { this.coopEndSent = true; net.gameover(); }
        this.game.audio.stopLighting();
        this.game.audio.gameover();
        this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        return;
      }
      if (this.pk) {
        this.pkFinishRun(false);
        return;
      }
      if (!this.player.invincible) storage.clearSave();
      this.game.audio.stopLighting();
      this.game.audio.gameover();
      this.game.go('gameover', {
        difficulty: this.difficulty.id,
        score: this.player.score,
        stage: this.stage.id,
        progress: this.progressState(),
        challenge: this.challenge,
      });
    }

  triggerClear() {
      if (this.clearSent) return;
      this.clearSent = true;
      if (this.coop) {
        const nextStage = this.stage.id + 1;
        const hasNext = nextStage <= this.difficulty.stageCount && !!getStage(nextStage).enabled;
        if (hasNext) {
          this.coopNextStageId = nextStage;
          this.coopNextTimer = 3.6;
          this.state = 'coopNext';
          this.game.audio.stopLighting();
          this.game.audio.clear();
          return;
        }
        if (!this.coopEndSent) { this.coopEndSent = true; net.gameover(); }
        this.game.audio.stopLighting();
        this.game.audio.clear();
        this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        return;
      }
      if (this.pk) {
        const nextStage = this.stage.id + 1;
        const hasNext = nextStage <= this.difficulty.stageCount && !!getStage(nextStage).enabled;
        if (hasNext) {
          this.pkNextStageId = nextStage;
          this.pkNextTimer = 3.4;
          this.state = 'pkNext';
          this.game.audio.stopLighting();
          this.game.audio.clear();
          return;
        }
        this.pkFinishRun(true);
        return;
      }
      if (!this.player.invincible) storage.clearSave();
      this.game.audio.stopLighting();
      this.game.audio.clear();
      this.game.go('stageclear', {
        difficulty: this.difficulty.id,
        score: this.player.score,
        stage: this.stage.id,
        progress: this.progressState(),
      });
    }

  render(ctx) {
    this.background.render(ctx, { lightning: this.lightningFlash });
    this.renderMeteors(ctx);
    if (this.cinematic) {
      const img = this.game.artBank ? this.game.artBank.get('mothership') : null;
      const ct = this.cinematic.t / Math.max(0.001, this.cinematic.duration);
      const cx = 360 + (ct - 0.5) * 1000;
      const cy = 70 - Math.sin(ct * Math.PI) * 36;
      ctx.save();
      ctx.globalAlpha = 0.8;
      if (img) {
        const cs = 0.42;
        const cw = img.width * cs;
        const ch = img.height * cs;
        ctx.shadowColor = '#c26bff';
        ctx.shadowBlur = 22;
        ctx.drawImage(img, cx - cw / 2, cy - ch / 2, cw, ch);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(194,107,255,0.55)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('异形母舰 · 远景掠过', 360, 132);
      ctx.textAlign = 'left';
    }
    for (const shield of this.shields) this.renderShield(ctx, shield);
    for (const pickup of this.pickups) this.renderPickup(ctx, pickup);
    for (const enemy of this.enemies) enemy.render(ctx, this.time);
    if (
      this.boss &&
      this.state !== 'intro' &&
      !(this.fakeEndingMode && this.state === 'bossDeath' && this.bossDeathTimer >= 4) &&
      !(this.boss.custom === 'alienMothership' && this.state === 'bossDeath' && this.bossDeathTimer >= 5)
    ) {
      this.boss.render(ctx, this.time);
    }
    if (!this.player.spectating) this.player.render(ctx, this.time);
    if (this.coop && this.player2 && !this.player2.spectating) this.player2.render(ctx, this.time);
    this.bullets.renderEnemy(ctx);
    this.bullets.renderPlayer(ctx);
    this.bullets.renderBeams(ctx);
    this.particles.render(ctx);
    this.background.renderForeground(ctx);
    if (this.stage.id === 2 && this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(this.lightningFlash * 0.38).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    if (this.state === 'bossFlash') {
      const alpha = Math.min(1, Math.max(0, this.bossFlashTimer / 0.5));
      ctx.fillStyle = `rgba(4,6,12,${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    this.renderHud(ctx);
    this.renderCoopOverlay(ctx);
    this.renderPkOverlay(ctx);
    this.renderPkConfirm(ctx);
    this.renderIntro(ctx);
    this.renderBombFx(ctx);
    if (this.state === 'bossPlaceholder') {
      const alpha = Math.min(1, this.bossPlaceholderTimer / 0.6);
      ctx.fillStyle = `rgba(6,2,12,${(alpha * 0.6).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#d9b3ff';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('最终 Boss · 信号逼近', 360, 600);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#c9a2ff';
      ctx.fillText('Boss 战待定', 360, 660);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    if (this.hitFlash > 0) {
      const flashRatio = this.hitFlash / 0.5;
      const blink = 0.55 + 0.45 * Math.sin(this.time * 46);
      ctx.save();
      ctx.strokeStyle = `rgba(255,45,70,${(flashRatio * blink * 0.85).toFixed(3)})`;
      ctx.lineWidth = 18;
      ctx.shadowColor = '#ff2d46';
      ctx.shadowBlur = 26;
      ctx.strokeRect(9, 9, 702, 1262);
      ctx.restore();
    }
    if (this.state === 'reinforceBanner') {
      const alpha = Math.min(1, this.reinforceTimer / 0.6);
      ctx.fillStyle = `rgba(255,240,190,${(alpha * 0.16).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff3cf';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('神域大门开启', 360, 600);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('增援舰队抵达', 360, 655);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    if (this.state === 'bossDeath' && this.boss && this.boss.custom === 'finalLord') {
      if (this.fakeEndingMode) {
        const t = this.bossDeathTimer;
        if (t >= 4.5 && t < 9.5) {
          const dark = Math.min(1, Math.max(0, (t - 4.5) / 3));
          const textAlpha = t < 9.2 ? Math.min(1, (t - 4.5) / 0.8) : Math.max(0, (9.5 - t) / 0.3);
          ctx.fillStyle = `rgba(4,2,10,${dark.toFixed(3)})`;
          ctx.fillRect(0, 0, 720, 1280);
          ctx.globalAlpha = textAlpha;
          ctx.fillStyle = '#fff3cf';
          ctx.font = 'bold 38px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('击碎天阙主宰，天空重归宁静', 360, 620);
          ctx.globalAlpha = 1;
          ctx.textAlign = 'left';
        }
      } else if (this.bossDeathTimer > 2) {
        const alpha = Math.min(1, (this.bossDeathTimer - 2) / 1.2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(18,10,34,0.45)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 38px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('击碎天阙主宰，天空重归宁静', 360, 620);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    }
    if (this.state === 'bossDeath' && this.boss && this.boss.custom === 'alienMothership' && this.bossDeadFade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.bossDeadFade.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    if (this.paused) this.pauseUi.render(ctx, this.makeSnapshot(), this.player.invincible, this.noSave, this.pk);
    if (this.revivePhase === 'prompt') {
      ctx.fillStyle = 'rgba(4,8,18,0.78)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, REVIVE_PANEL);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('是否观看广告复活？', 360, 536);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('彻底阵亡 · 观看 15 秒广告可复活', 360, 592);
      ctx.fillText('复活后残机数 +1 · 本局最多复活 2 次', 360, 628);
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('本局剩余复活次数：' + Math.max(0, 2 - this.player.reviveUsed) + ' / 2', 360, 670);
      drawButton(ctx, REVIVE_YES, '观看广告复活', { font: 'bold 24px sans-serif', accent: 'rgba(255,211,107,0.95)' });
      drawButton(ctx, REVIVE_NO, '放弃本局', { font: 'bold 24px sans-serif', accent: 'rgba(255,120,120,0.95)' });
      ctx.textAlign = 'left';
    } else if (this.revivePhase === 'ad') {
      const sky = ctx.createLinearGradient(0, 0, 0, 1280);
      sky.addColorStop(0, '#1a1030');
      sky.addColorStop(0.55, '#3a1f52');
      sky.addColorStop(1, '#120b20');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = 'rgba(255,220,120,0.14)';
      for (let i = 0; i < 5; i += 1) {
        const x = (i * 173 + 60) % 720;
        const y = (i * 257 + 80) % 1280;
        ctx.beginPath();
        ctx.arc(x, y, 42 + i * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('广告', 360, 150);
      ctx.fillStyle = '#fff3e0';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('复活药剂 · 星海补给站', 360, 260);
      ctx.fillStyle = '#f2e7ff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('观看完成即可复活继续战斗', 360, 360);
      const adSeconds = Math.max(0, Math.ceil(this.reviveAdTimer));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('广告剩余 ' + adSeconds + ' 秒', 360, 520);
      const barX = 170;
      const barW = 380;
      const progress = 1 - this.reviveAdTimer / 15;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(barX, 560, barW, 12);
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(barX, 560, barW * Math.max(0, Math.min(1, progress)), 12);
      ctx.fillStyle = 'rgba(220,232,255,0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText('（模拟广告 · 观看完成后将自动复活）', 360, 640);
      ctx.textAlign = 'left';
    }
    this.capturePkFrame(ctx);
  }

  renderShield(ctx, shield) {
    if (!shield.active) return;
    const pulse = 1 + Math.sin(this.time * 3) * 0.03;
    const r = shield.radius * pulse;
    const ratio = shield.kind === 'em' ? 1 : shield.hp / shield.maxHp;
    const palettes = {
      normal: { inner: '255,220,120', mid: '255,200,80', outer: '255,180,60', edge: '255,220,130', low: '255,120,80', crack: '255,90,70' },
      erosion: { inner: '120,20,30', mid: '150,30,40', outer: '190,45,55', edge: '255,110,120', low: '255,80,90', crack: '255,70,80' },
      em: { inner: '170,90,255', mid: '160,70,255', outer: '150,60,235', edge: '210,150,255', low: '255,150,120', crack: '255,120,90' },
    };
    const pal = palettes[shield.kind] || palettes.normal;
    const grad = ctx.createRadialGradient(shield.enemy.x, shield.enemy.y, r * 0.2, shield.enemy.x, shield.enemy.y, r);
    grad.addColorStop(0, `rgba(${pal.inner},0.10)`);
    grad.addColorStop(0.8, `rgba(${pal.mid},0.18)`);
    grad.addColorStop(1, `rgba(${pal.outer},0.34)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(shield.enemy.x, shield.enemy.y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = ratio > 0.5 ? `rgba(${pal.edge},0.55)` : `rgba(${pal.low},0.7)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shield.enemy.x, shield.enemy.y, r, 0, TAU);
    ctx.stroke();
    if (ratio < 0.5) {
      ctx.strokeStyle = `rgba(${pal.crack},0.45)`;
      for (let i = 0; i < 5; i += 1) {
        const a = (i * TAU) / 5 + this.time * 0.4;
        ctx.beginPath();
        ctx.moveTo(shield.enemy.x + Math.cos(a) * r * 0.75, shield.enemy.y + Math.sin(a) * r * 0.75);
        ctx.lineTo(shield.enemy.x + Math.cos(a) * r, shield.enemy.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
  }

  renderPickup(ctx, pickup) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    const pulse = 1 + Math.sin(this.time * 6) * 0.12;
    ctx.scale(pulse, pulse);
    if (pickup.type === 'shield') {
      ctx.fillStyle = '#2f7fe0';
      ctx.shadowColor = '#4da6ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dff0ff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('盾', 0, 5);
    } else if (pickup.type === 'heart') {
      ctx.fillStyle = '#ff6f91';
      ctx.shadowColor = '#ff6f91';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-10, -2, -7, -12, 0, -6);
      ctx.bezierCurveTo(7, -12, 10, -2, 0, 8);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f7c948';
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('必', 0, 6);
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  renderHud(ctx) {
      if (this.coop && this.player2) {
        drawCoopHud(ctx, { stage: this.stage.id }, this.player, this.player2, this.hostName || 'P1', this.guestName || 'P2');
      } else {
        drawHud(ctx, this.player, { stage: this.stage.id });
      }
      if (
        this.boss &&
        this.boss.custom === 'twinGuards' &&
        (this.state === 'miniBossWarning' || this.state === 'miniBoss' || this.state === 'miniBossDeath')
      ) {
        drawTwinBossHud(ctx, this.boss);
      } else if (this.boss && (this.state === 'boss' || this.state === 'bossDeath' || this.state === 'bossWarning')) {
        drawBossHud(ctx, this.boss);
      }
    }

  renderIntro(ctx) {
    if (this.state !== 'intro' || this.introTimer <= 0) return;
    const alpha = Math.min(1, this.introTimer / 0.9);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(12,8,4,0.72)';
    ctx.fillRect(0, 470, 720, 130);
    ctx.fillStyle = '#fff8e8';
    ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    const main = this.stage.title;
    ctx.fillText(main, 360, 545);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  renderBombFx(ctx) {
    if (this.bombTextTimer > 0) {
      const alpha = Math.min(1, this.bombTextTimer / 0.35);
      ctx.globalAlpha = Math.min(1, alpha * 0.85);
      ctx.fillStyle = 'rgba(8,12,24,0.38)';
      ctx.fillRect(190, 470, 340, 180);
      ctx.globalAlpha = alpha;
      drawInkTitle(ctx, '全域清扫', 360, 560, 76);
      ctx.globalAlpha = 1;
    }
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, this.screenFlash).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
  }
}

module.exports = StageScene;
