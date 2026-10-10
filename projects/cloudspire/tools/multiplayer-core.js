function randomRoomId() {
  let id = '';
  for (let i = 0; i < 10; i += 1) id += Math.floor(Math.random() * 10);
  return id;
}

class MultiplayerCore {
  constructor() {
    this.rooms = new Map();
  }

  send(conn, msg) {
    if (conn && conn.send) conn.send(msg);
  }

  broadcast(room, msg) {
    if (room.host) this.send(room.host.conn, msg);
    if (room.guest) this.send(room.guest.conn, msg);
  }

  create(conn, name) {
    let id = randomRoomId();
    while (this.rooms.has(id)) id = randomRoomId();
    const room = {
      id,
      host: { conn, name: name || '玩家1' },
      guest: null,
      state: 'lobby',
      seed: 0,
      difficulty: null,
    };
    this.rooms.set(id, room);
    this.send(conn, { type: 'created', roomId: id, playerIndex: 1 });
    return room;
  }

  join(conn, roomId, name) {
    const room = this.rooms.get(String(roomId || ''));
    if (!room) {
      this.send(conn, { type: 'joinFailed', reason: '房间不存在' });
      return null;
    }
    if (room.guest) {
      this.send(conn, { type: 'joinFailed', reason: '房间已满' });
      return null;
    }
    if (room.state !== 'lobby') {
      this.send(conn, { type: 'joinFailed', reason: '游戏已开始' });
      return null;
    }
    room.guest = { conn, name: name || '玩家2' };
    this.send(conn, { type: 'joined', roomId: room.id, playerIndex: 2, hostName: room.host.name });
    this.send(room.host.conn, { type: 'peerJoined', name: room.guest.name });
    return room;
  }

  start(conn) {
    const room = this.roomForConn(conn);
    if (!room || conn !== room.host.conn) return;
    if (!room.guest) return;
    room.state = 'starting';
    room.seed = Math.floor(Math.random() * 2147483647);
    const at = Date.now() + 3000;
    const startAt = Date.now() + 1500;
    this.broadcast(room, {
      type: 'start',
      seed: room.seed,
      at,
      startAt,
      hostName: room.host.name,
      guestName: room.guest.name,
    });
  }

  selectDifficulty(conn, difficulty) {
    const room = this.roomForConn(conn);
    if (!room || conn !== room.host.conn) return;
    room.difficulty = difficulty || 'easy';
    room.state = 'playing';
    const startAt = Date.now() + 1500;
    this.broadcast(room, {
      type: 'difficulty',
      difficulty: room.difficulty,
      seed: room.seed,
      startAt,
      hostName: room.host.name,
      guestName: room.guest.name,
    });
  }

  relayPayload(msg) {
    const type = msg.type;
    if (type === 'input') {
      return { type, frame: Number(msg.frame) || 0, move: msg.move || null, bomb: !!msg.bomb, stage: msg.stage || 0 };
    }
    if (type === 'pkState') {
      return {
        type,
        score: Number(msg.score) || 0,
        stage: Number(msg.stage) || 1,
        lives: Number(msg.lives) || 0,
        hp: Number(msg.hp) || 0,
        maxHp: Number(msg.maxHp) || 100,
        over: !!msg.over,
      };
    }
    if (type === 'pkFinished') {
      return { type, score: Number(msg.score) || 0, stage: Number(msg.stage) || 1, cleared: !!msg.cleared };
    }
    if (type === 'pkWatchOn') {
      return { type, on: !!msg.on };
    }
    if (type === 'pkFrame') {
      return { type, data: String(msg.data || '') };
    }
    return null;
  }

    forfeit(conn) {
      const room = this.roomForConn(conn);
      if (!room) return;
      const isHost = room.host && room.host.conn === conn;
      const survivor = isHost ? room.guest : room.host;
      if (!survivor || !survivor.conn) {
        this.rooms.delete(room.id);
        return;
      }
      const forfeiterName = (isHost ? room.host.name : room.guest.name) || '对方';
      if (isHost) {
        room.host = { conn: survivor.conn, name: survivor.name };
        room.guest = null;
      } else {
        room.guest = null;
      }
      room.state = 'pkForfeit';
      this.send(survivor.conn, { type: 'pkForfeit', name: forfeiterName, host: isHost });
    }


  input(conn, msg) {
    const room = this.roomForConn(conn);
    if (!room) return;
    const payload = this.relayPayload(msg || {});
    if (!payload) return;
    const target = conn === room.host.conn ? room.guest : room.host;
    if (target && target.conn) this.send(target.conn, payload);
  }

  gameover(conn) {
    const room = this.roomForConn(conn);
    if (!room) return;
    room.state = 'lobby';
    this.broadcast(room, { type: 'gameover' });
  }

  roomForConn(conn) {
    for (const room of this.rooms.values()) {
      if (room.host.conn === conn || (room.guest && room.guest.conn === conn)) return room;
    }
    return null;
  }

  disconnect(conn) {
    const room = this.roomForConn(conn);
    if (!room) return;
    const isHost = room.host.conn === conn;
    const peer = isHost ? room.guest : room.host;
    this.rooms.delete(room.id);
    if (peer && peer.conn) this.send(peer.conn, { type: 'peerLeft' });
  }
}

module.exports = { MultiplayerCore, randomRoomId };
