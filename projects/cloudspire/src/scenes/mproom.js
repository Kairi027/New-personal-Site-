const platform = require('../core/platform.js');
const net = require('../net/multiplayer.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const { clamp } = require('../utils/math.js');

const CREATE_RECT = { x: 160, y: 440, w: 400, h: 72 };
const JOIN_RECT = { x: 160, y: 540, w: 400, h: 72 };
const SERVER_RECT = { x: 160, y: 640, w: 400, h: 64 };
const ROOMCODE_RECT = { x: 140, y: 500, w: 440, h: 72 };
const JOIN_CONFIRM_RECT = { x: 210, y: 640, w: 300, h: 64 };
const START_RECT = { x: 210, y: 900, w: 300, h: 64 };
const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };

function defaultServerUrl() {
  if (typeof location !== 'undefined' && location.hostname) {
    return 'ws://' + location.hostname + ':5174';
  }
  return 'ws://localhost:5174';
}

class MpRoomScene {
  constructor(game) {
    this.game = game;
    this.view = 'menu';
    this.name = '';
    this.serverUrl = defaultServerUrl();
    this.roomId = '';
    this.hostName = '';
    this.guestName = '';
    this.error = '';
    this.countdown = 0;
    this.enterCode = '';
    this.busy = false;
  }

  enter(params) {
    this.params = params || {};
    this.name = this.params.name || net.name || '';
    this.view = this.params.fromGame ? 'room' : 'menu';
    this.hostName = net.playerIndex === 1 ? this.name : net.peerName || '';
    this.guestName = net.playerIndex === 1 ? net.peerName || '' : this.name;
    this.roomId = net.roomId || '';
    this.error = '';
    this.countdown = 0;
    this.busy = false;
    net.onMessage = (msg) => this.handleMessage(msg);
    net.onClose = () => {
      if (this.view !== 'menu') {
        this.error = '连接已断开';
      }
    };
  }

  leave() {
    net.onMessage = null;
    net.onClose = null;
    net.close();
  }

  update(dt) {
    if (this.countdown > 0) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.game.go('difficulty', {
          coop: true,
          pk: true,
          roomId: net.roomId,
          playerIndex: net.playerIndex,
          seed: net.seed,
          hostName: this.hostName,
          guestName: this.guestName,
        });
      }
      return;
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.leave();
      this.game.go('title');
      return;
    }
    if (this.view === 'menu') {
      if (this.inRect(tap, CREATE_RECT)) {
        this.createRoom();
        return;
      }
      if (this.inRect(tap, JOIN_RECT)) {
        this.view = 'enterCode';
        this.enterCode = '';
        return;
      }
      if (this.inRect(tap, SERVER_RECT)) {
        this.openText('服务器地址', this.serverUrl, (v) => { this.serverUrl = v; });
      }
      return;
    }
    if (this.view === 'enterCode') {
      if (this.inRect(tap, ROOMCODE_RECT)) {
        this.openText('房间号(10位)', this.enterCode, (v) => { this.enterCode = v; });
        return;
      }
      if (this.inRect(tap, JOIN_CONFIRM_RECT)) {
        this.joinRoom();
      }
      return;
    }
    if (this.view === 'room') {
      if (net.playerIndex === 1 && this.guestName && this.inRect(tap, START_RECT)) {
        net.start();
      }
    }
  }

  createRoom() {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    net.connect(this.serverUrl)
      .then(() => {
        net.create(this.name);
      })
      .catch(() => {
        this.error = '无法连接服务器';
        this.busy = false;
      });
  }

  joinRoom() {
    if (this.busy) return;
    if (!/^\d{10}$/.test(this.enterCode)) {
      this.error = '请输入10位房间号';
      return;
    }
    this.busy = true;
    this.error = '';
    net.connect(this.serverUrl)
      .then(() => {
        net.join(this.enterCode, this.name);
      })
      .catch(() => {
        this.error = '无法连接服务器';
        this.busy = false;
      });
  }

  openText(title, value, done) {
    platform.showKeyboard({
      defaultValue: value,
      maxLength: 20,
      confirmType: 'done',
      onConfirm: (res) => {
        done((res && res.value) || '');
        platform.hideKeyboard();
      },
      onComplete: (res) => {
        const v = res && res.value !== undefined ? res.value : '';
        if (v) done(v);
        platform.hideKeyboard();
      },
    });
    void title;
  }

  handleMessage(msg) {
    if (msg.type === 'created') {
      this.roomId = msg.roomId;
      this.hostName = this.name;
      this.view = 'room';
      this.busy = false;
    } else if (msg.type === 'joined') {
      this.roomId = msg.roomId;
      this.hostName = msg.hostName;
      this.guestName = this.name;
      this.view = 'room';
      this.busy = false;
    } else if (msg.type === 'peerJoined') {
      this.guestName = msg.name;
    } else if (msg.type === 'start') {
      this.hostName = msg.hostName;
      this.guestName = msg.guestName;
      this.countdown = 3;
    } else if (msg.type === 'joinFailed') {
      this.error = msg.reason || '加入失败';
      this.busy = false;
    } else if (msg.type === 'peerLeft') {
      this.error = '对方已离开房间';
      this.leave();
      this.game.go('title');
    } else if (msg.type === 'gameover') {
      this.countdown = 0;
      this.view = 'room';
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.6, '#1a2540');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    if (this.view === 'menu') {
      drawInkTitle(ctx, 'Local PK', 360, 200, 46);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(220,232,255,0.8)';
      ctx.font = '20px sans-serif';
      ctx.fillText(`玩家：${this.name}`, 360, 300);
      drawButton(ctx, CREATE_RECT, 'Create Room', { font: 'bold 26px sans-serif', accent: 'rgba(140,200,255,0.9)' });
      drawButton(ctx, JOIN_RECT, 'Join Room', { font: 'bold 26px sans-serif', accent: 'rgba(255,160,120,0.9)' });
      drawButton(ctx, SERVER_RECT, `服务器：${this.serverUrl}`, { font: 'bold 18px sans-serif' });
      if (this.busy) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('连接中…', 360, 730);
      }
    } else if (this.view === 'enterCode') {
      drawInkTitle(ctx, 'Join Room', 360, 220, 46);
      drawPanel(ctx, { x: 120, y: 480, w: 480, h: 110 });
      ctx.textAlign = 'center';
      ctx.fillStyle = this.enterCode ? '#f2f6ff' : 'rgba(220,232,255,0.45)';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(this.enterCode || '点击输入10位房间号', 360, 542);
      drawButton(ctx, JOIN_CONFIRM_RECT, '加入', { font: 'bold 26px sans-serif' });
    } else {
      drawInkTitle(ctx, '房间', 360, 180, 52);
      drawPanel(ctx, { x: 110, y: 300, w: 500, h: 420 });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`房间号：${this.roomId}`, 360, 360);
      ctx.fillStyle = '#f2f6ff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`player1：${this.hostName || '…'}`, 360, 430);
      ctx.fillText(`player2：${this.guestName || '等待玩家2加入…'}`, 360, 480);
      if (this.busy) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.fillText('连接中…', 360, 540);
      } else if (net.playerIndex === 1) {
        if (this.guestName) {
          drawButton(ctx, START_RECT, 'Start', { font: 'bold 28px sans-serif', pulse: 0.15 + 0.1 * Math.sin(this.game.time || 0) });
        } else {
          ctx.fillStyle = 'rgba(220,232,255,0.7)';
          ctx.font = '20px sans-serif';
          ctx.fillText('等待玩家2加入…', 360, 560);
        }
      } else {
        ctx.fillStyle = 'rgba(220,232,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.fillText('等待房主开始…', 360, 560);
      }
    }

    if (this.error) {
      ctx.fillStyle = '#ffb3a0';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.error, 360, 760);
    }
    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });

    if (this.countdown > 0) {
      ctx.fillStyle = 'rgba(4,8,18,0.72)';
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = '#fff3cf';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.max(1, Math.ceil(this.countdown))), 360, 640);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('即将开始游戏…', 360, 720);
    }
    ctx.textAlign = 'left';
  }
}

module.exports = MpRoomScene;
