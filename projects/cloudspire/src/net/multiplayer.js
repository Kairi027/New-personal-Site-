class Multiplayer {
  constructor() {
    this.conn = null;
    this.sendRaw = null;
    this.roomId = null;
    this.playerIndex = 0;
    this.name = '';
    this.peerName = '';
    this.seed = 0;
    this.url = '';
    this.onMessage = null;
    this.onClose = null;
    this.clockOffsetMs = 0;
    this.smoothedRttMs = 60;
    this._pingTimer = null;
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
  }

  connect(url) {
    return new Promise((resolve, reject) => {
      this.url = url;
      let settled = false;
      const fail = (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.onClose) this.onClose();
        reject(e || new Error('连接失败'));
      };
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => fail(new Error('连接超时')), 6000);
      const wxApi = typeof wx !== 'undefined' ? wx : null;
      if (wxApi && wxApi.connectSocket) {
        const task = wxApi.connectSocket({ url, fail: (e) => fail(e) });
        task.onOpen(() => {
          this.conn = task;
          this.sendRaw = (s) => task.send({ data: s });
          done();
          this._beginClockSync();
        });
        task.onMessage((res) => this.dispatch(res.data));
        task.onClose(() => fail(new Error('连接已断开')));
        task.onError((e) => fail(e));
        return;
      }
      if (typeof WebSocket === 'undefined') {
        fail(new Error('WebSocket 不可用'));
        return;
      }
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.conn = ws;
        this.sendRaw = (s) => ws.send(s);
        done();
        this._beginClockSync();
      };
      ws.onmessage = (e) => this.dispatch(e.data);
      ws.onclose = () => fail(new Error('连接已断开'));
      ws.onerror = () => fail(new Error('连接失败'));
    });
  }

  _beginClockSync() {
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
    const sample = () => {
      this._pingCount += 1;
      this.send({ type: 'ping', t: Date.now() });
      this._pingTimer = setTimeout(sample, this._pingCount < 3 ? 200 : 1000);
    };
    sample();
  }

  send(obj) {
    if (this.sendRaw) this.sendRaw(JSON.stringify(obj));
  }

  dispatch(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (msg.type === 'pong') {
      const sentAt = typeof msg.t === 'number' ? msg.t : 0;
      const serverTime = typeof msg.serverTime === 'number' ? msg.serverTime : Date.now();
      if (sentAt > 0) {
        const recvAt = Date.now();
        const offset = serverTime - (sentAt + recvAt) / 2;
        const rtt = recvAt - sentAt;
        this._pingSamples.push(offset);
        this._rttSamples.push(rtt);
        if (this._pingSamples.length > 5) this._pingSamples.shift();
        if (this._rttSamples.length > 5) this._rttSamples.shift();
        let sum = 0;
        for (const s of this._pingSamples) sum += s;
        this.clockOffsetMs = Math.round(sum / this._pingSamples.length);
        let rttSum = 0;
        for (const r of this._rttSamples) rttSum += r;
        this.smoothedRttMs = Math.max(4, Math.round(rttSum / this._rttSamples.length));
      }
    } else if (msg.type === 'created') {
      this.roomId = msg.roomId;
      this.playerIndex = msg.playerIndex || 1;
    } else if (msg.type === 'joined') {
      this.roomId = msg.roomId;
      this.playerIndex = msg.playerIndex || 2;
      this.peerName = msg.hostName || '';
    } else if (msg.type === 'peerJoined') {
      this.peerName = msg.name || '';
    } else if (msg.type === 'pkForfeit') {
      if (msg.host) this.playerIndex = 1;
    } else if (msg.type === 'start' || msg.type === 'difficulty') {
      this.seed = msg.seed || 0;
    }
    if (this.onMessage) this.onMessage(msg);
  }

  create(name) {
    this.name = name || '';
    this.send({ type: 'create', name: this.name });
  }

  join(roomId, name) {
    this.name = name || '';
    this.send({ type: 'join', roomId: String(roomId || ''), name: this.name });
  }

  start() {
    this.send({ type: 'start' });
  }

  selectDifficulty(difficulty) {
    this.send({ type: 'selectDifficulty', difficulty });
  }

  sendIntent(frame, move, bomb, stageId) {
    this.send({
      type: 'input',
      frame: Number(frame) || 0,
      move: move || null,
      bomb: !!bomb,
      stage: stageId || 0,
    });
  }

  sendPkForfeit() {
      this.send({ type: 'pkForfeit' });
    }


  sendPkState(state) {
      this.send({
        type: 'pkState',
        score: Number(state.score) || 0,
        stage: Number(state.stage) || 1,
        lives: Number(state.lives) || 0,
        hp: Number(state.hp) || 0,
        maxHp: Number(state.maxHp) || 100,
        over: !!state.over,
      });
    }

    sendPkFinished(score, stage, cleared) {
      this.send({ type: 'pkFinished', score: Number(score) || 0, stage: Number(stage) || 1, cleared: !!cleared });
    }

    sendPkWatch(on) {
      this.send({ type: 'pkWatchOn', on: !!on });
    }

    sendPkFrame(data) {
      this.send({ type: 'pkFrame', data: String(data || '') });
    }


  sendInput(move) {
    this.sendIntent(0, move, false, 0);
  }

  gameover() {
    this.send({ type: 'gameover' });
  }

  close() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
      this._pingTimer = null;
    }
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
    this.clockOffsetMs = 0;
    this.smoothedRttMs = 60;
    if (this.conn) {
      try {
        if (typeof this.conn.close === 'function') this.conn.close();
        else this.conn.close({});
      } catch (e) {}
    }
    this.conn = null;
    this.sendRaw = null;
    this.roomId = null;
    this.playerIndex = 0;
    this.peerName = '';
  }
}

module.exports = new Multiplayer();
