const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ["websocket", "polling"],
  pingInterval: 10000,
  pingTimeout: 20000
});

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_, res) => res.status(200).send("ok"));

const COLORS = [
  { key: "red", hex: "#df2d2d", label: "RED" },
  { key: "blue", hex: "#2d67df", label: "BLUE" },
  { key: "yellow", hex: "#e9b718", label: "YELLOW" },
  { key: "green", hex: "#33ad55", label: "GREEN" }
];

const rooms = new Map();
const PUBLIC_ROOM = "__PUBLIC__";
const START_LIFE = 7;
const MAX_LIFE = 10;
const TEAM_ROUND_INTERVAL_MS = 45000;
const TEAM_ROUND_DURATION_MS = 12000;

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeRoom(code, isPublic = false) {
  return {
    code,
    isPublic,
    players: new Array(4).fill(null),
    started: false,
    finished: false,
    createdAt: Date.now(),
    startAt: 0,
    life: [START_LIFE, START_LIFE, START_LIFE, START_LIFE],
    stats: Array.from({ length: 4 }, () => ({
      memory: { ok: 0, total: 0 },
      concentration: { ok: 0, total: 0 },
      spatial: { ok: 0, total: 0 },
      multitasking: { ok: 0, total: 0 }
    })),
    challenges: [null, null, null, null],
    teamRound: null,
    nextTeamRoundAt: 0,
    tickTimer: null,
    challengeCounter: 0
  };
}

function publicRoomForJoin() {
  for (const room of rooms.values()) {
    if (room.isPublic && !room.started && room.players.filter(Boolean).length < 4) return room;
  }
  const code = `P-${randomCode(6)}`;
  const room = makeRoom(code, true);
  rooms.set(code, room);
  return room;
}

function sanitizeName(name) {
  const clean = String(name || "").replace(/[<>]/g, "").trim().slice(0, 18);
  return clean || "ANONYMOUS";
}

function roomState(room) {
  return {
    code: room.code,
    isPublic: room.isPublic,
    started: room.started,
    finished: room.finished,
    startAt: room.startAt,
    life: room.life,
    nextTeamRoundAt: room.nextTeamRoundAt,
    players: room.players.map((p, i) => p ? ({
      slot: i,
      name: p.name,
      color: COLORS[i],
      connected: p.connected
    }) : null),
    challenges: room.challenges.map(publicChallenge),
    teamRound: room.teamRound ? {
      active: true,
      id: room.teamRound.id,
      expiresAt: room.teamRound.expiresAt,
      current: room.teamRound.current,
      circles: room.teamRound.circles
    } : null
  };
}

function publicChallenge(c) {
  if (!c) return null;
  const common = {
    id: c.id,
    owner: c.owner,
    type: c.type,
    category: c.category,
    expiresAt: c.expiresAt,
    revealAt: c.revealAt || null
  };
  if (c.type === "oddDigit") return { ...common, grid: c.grid };
  if (c.type === "numberColor") return {
    ...common,
    mapping: c.mapping,
    promptNumber: c.promptNumber,
    choices: c.choices
  };
  if (c.type === "shapeColor") return {
    ...common,
    mapping: c.mapping,
    promptShape: c.promptShape,
    choices: c.choices
  };
  if (c.type === "rotation") return {
    ...common,
    base: c.base,
    options: c.options
  };
  if (c.type === "stroop") return {
    ...common,
    word: c.word,
    ink: c.ink,
    options: c.options,
    promptMode: c.promptMode
  };
  return common;
}

function difficulty(room) {
  if (!room.started) return 0;
  return Math.min(6, Math.floor((Date.now() - room.startAt) / 30000));
}

function taskDuration(room, base = 8500) {
  return Math.max(3600, base - difficulty(room) * 650);
}

function createChallenge(room, owner) {
  const types = ["oddDigit", "numberColor", "shapeColor", "rotation", "stroop"];
  const type = types[Math.floor(Math.random() * types.length)];
  const id = `${room.code}-${++room.challengeCounter}`;
  const now = Math.max(Date.now(), room.startAt || 0);

  if (type === "oddDigit") {
    const size = difficulty(room) >= 3 ? 7 : 6;
    const majority = Math.random() < 0.5 ? "9" : "6";
    const odd = majority === "9" ? "6" : "9";
    const count = size * size;
    const oddIndex = Math.floor(Math.random() * count);
    const grid = Array.from({ length: count }, (_, i) => i === oddIndex ? odd : majority);
    return {
      id, owner, type, category: "concentration",
      grid, answer: oddIndex,
      expiresAt: now + taskDuration(room, 8000)
    };
  }

  if (type === "numberColor") {
    const nums = shuffled([1,2,3,4,5,6]).slice(0, 3);
    const cols = shuffled(COLORS.map(c => c.key)).slice(0, 3);
    const mapping = nums.map((n, i) => ({ n, color: cols[i] }));
    const pick = mapping[Math.floor(Math.random() * mapping.length)];
    return {
      id, owner, type, category: "memory",
      mapping, promptNumber: pick.n, choices: shuffled(cols),
      answer: pick.color,
      revealAt: now + 1800,
      expiresAt: now + taskDuration(room, 9500)
    };
  }

  if (type === "shapeColor") {
    const shapes = shuffled(["circle", "triangle", "square", "diamond"]).slice(0, 3);
    const cols = shuffled(COLORS.map(c => c.key)).slice(0, 3);
    const mapping = shapes.map((shape, i) => ({ shape, color: cols[i] }));
    const pick = mapping[Math.floor(Math.random() * mapping.length)];
    return {
      id, owner, type, category: "memory",
      mapping, promptShape: pick.shape, choices: shuffled(cols),
      answer: pick.color,
      revealAt: now + 1800,
      expiresAt: now + taskDuration(room, 9500)
    };
  }

  if (type === "rotation") {
    const dirs = [0, 90, 180, 270];
    const base = dirs[Math.floor(Math.random() * dirs.length)];
    const turn = shuffled([90, 180, 270])[0];
    const answer = (base + turn) % 360;
    return {
      id, owner, type, category: "spatial",
      base: { angle: base, turn },
      options: shuffled(dirs),
      answer,
      expiresAt: now + taskDuration(room, 7600)
    };
  }

  const words = ["RED", "BLUE", "YELLOW", "GREEN"];
  const inkKeys = COLORS.map(c => c.key);
  const word = words[Math.floor(Math.random() * words.length)];
  const wordKey = word.toLowerCase();
  const ink = inkKeys[Math.floor(Math.random() * inkKeys.length)];
  const askInk = Math.random() < 0.5;
  return {
    id, owner, type: "stroop", category: "multitasking",
    word, ink, options: inkKeys,
    promptMode: askInk ? "ink" : "word",
    answer: askInk ? ink : wordKey,
    expiresAt: now + taskDuration(room, 7200)
  };
}

function emitRoom(room) {
  io.to(room.code).emit("roomState", roomState(room));
}

function startRoom(room) {
  if (room.started || room.finished) return;
  room.started = true;
  room.startAt = Date.now() + 3500;
  room.nextTeamRoundAt = room.startAt + TEAM_ROUND_INTERVAL_MS;
  for (let i = 0; i < 4; i++) room.challenges[i] = createChallenge(room, i);
  emitRoom(room);
  io.to(room.code).emit("gameStarting", { startAt: room.startAt });

  room.tickTimer = setInterval(() => tickRoom(room), 200);
}

function scoreCategory(room, slot, category, ok) {
  const s = room.stats[slot][category];
  s.total++;
  if (ok) s.ok++;
}

function successChallenge(room, slot, challenge) {
  scoreCategory(room, slot, challenge.category, true);
  const recipient = (slot + 1) % 4;
  room.life[recipient] = Math.min(MAX_LIFE, room.life[recipient] + 1);
  io.to(room.code).emit("feedback", { slot, ok: true, recipient });
  room.challenges[slot] = createChallenge(room, slot);
}

function failChallenge(room, slot, challenge, reason = "wrong") {
  scoreCategory(room, slot, challenge.category, false);
  room.life[slot] = Math.max(0, room.life[slot] - 1);
  io.to(room.code).emit("feedback", { slot, ok: false, reason });
  if (room.life[slot] <= 0) {
    finishRoom(room, slot);
    return;
  }
  room.challenges[slot] = createChallenge(room, slot);
}

function startTeamRound(room) {
  if (room.teamRound || room.finished) return;
  const n = 12 + Math.min(8, difficulty(room) * 2);
  const circles = [];
  for (let i = 1; i <= n; i++) {
    const owner = Math.floor(Math.random() * 4);
    circles.push({
      n: i,
      owner,
      color: COLORS[owner].key,
      x: 8 + Math.random() * 84,
      y: 12 + Math.random() * 76
    });
  }
  room.teamRound = {
    id: `TEAM-${room.code}-${Date.now()}`,
    circles,
    current: 1,
    pausedAt: Date.now(),
    expiresAt: Date.now() + TEAM_ROUND_DURATION_MS
  };
  io.to(room.code).emit("teamRoundStart", roomState(room).teamRound);
}

function finishTeamRound(room, success) {
  if (!room.teamRound) return;
  const pausedFor = Math.max(0, Date.now() - (room.teamRound.pausedAt || Date.now()));
  for (const c of room.challenges) {
    if (!c) continue;
    c.expiresAt += pausedFor;
    if (c.revealAt) c.revealAt += pausedFor;
  }
  if (success) {
    for (let i = 0; i < 4; i++) {
      room.life[i] = Math.min(MAX_LIFE, room.life[i] + 1);
      scoreCategory(room, i, "multitasking", true);
    }
    io.to(room.code).emit("teamRoundEnd", { ok: true });
  } else {
    for (let i = 0; i < 4; i++) {
      room.life[i] = Math.max(0, room.life[i] - 1);
      scoreCategory(room, i, "multitasking", false);
    }
    io.to(room.code).emit("teamRoundEnd", { ok: false });
    const dead = room.life.findIndex(x => x <= 0);
    if (dead >= 0) {
      room.teamRound = null;
      finishRoom(room, dead);
      return;
    }
  }
  room.teamRound = null;
  room.nextTeamRoundAt = Date.now() + TEAM_ROUND_INTERVAL_MS;
  emitRoom(room);
}

function tickRoom(room) {
  if (!room.started || room.finished) return;
  const now = Date.now();
  if (now < room.startAt) return;

  if (!room.teamRound && now >= room.nextTeamRoundAt) {
    startTeamRound(room);
    return;
  }

  if (room.teamRound) {
    if (now >= room.teamRound.expiresAt) finishTeamRound(room, false);
    return;
  }

  let changed = false;
  for (let i = 0; i < 4; i++) {
    const c = room.challenges[i];
    if (c && now >= c.expiresAt) {
      failChallenge(room, i, c, "timeout");
      changed = true;
      if (room.finished) return;
    }
  }
  if (changed) emitRoom(room);
}

function finishRoom(room, failedSlot) {
  if (room.finished) return;
  room.finished = true;
  if (room.tickTimer) clearInterval(room.tickTimer);
  room.tickTimer = null;
  const elapsedMs = Math.max(0, Date.now() - room.startAt);
  const categories = ["memory", "concentration", "spatial", "multitasking"];
  const categoryScores = {};
  for (const cat of categories) {
    let ok = 0, total = 0;
    for (let i = 0; i < 4; i++) {
      ok += room.stats[i][cat].ok;
      total += room.stats[i][cat].total;
    }
    categoryScores[cat] = total ? ok / total : 0;
  }
  io.to(room.code).emit("gameOver", {
    elapsedMs,
    failedSlot,
    categoryScores,
    life: room.life
  });
}

function leaveSocket(socket) {
  const code = socket.data.roomCode;
  const slot = socket.data.slot;
  if (!code || slot == null) return;
  const room = rooms.get(code);
  if (!room) return;
  const p = room.players[slot];
  if (p && p.socketId === socket.id) {
    if (room.started && !room.finished) {
      p.connected = false;
      io.to(room.code).emit("playerDisconnected", { slot });
      setTimeout(() => {
        const current = rooms.get(code);
        if (!current || current.finished) return;
        const pp = current.players[slot];
        if (pp && !pp.connected) {
          current.life[slot] = 0;
          finishRoom(current, slot);
        }
      }, 20000);
    } else {
      room.players[slot] = null;
      emitRoom(room);
      if (!room.players.some(Boolean)) rooms.delete(code);
    }
  }
}

io.on("connection", (socket) => {
  socket.on("join", ({ mode, code, name, reconnectToken }) => {
    leaveSocket(socket);

    let room;
    if (mode === "public") {
      room = publicRoomForJoin();
    } else {
      const cleanCode = String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 18);
      if (!cleanCode) {
        socket.emit("joinError", "INVALID ROOM CODE");
        return;
      }
      room = rooms.get(cleanCode);
      if (!room && mode === "create") {
        room = makeRoom(cleanCode, false);
        rooms.set(cleanCode, room);
      }
      if (!room) {
        socket.emit("joinError", "TEAM DOES NOT EXIST");
        return;
      }
    }

    if (room.finished) {
      socket.emit("joinError", "THIS TEST HAS ENDED");
      return;
    }

    let slot = -1;
    if (reconnectToken) {
      slot = room.players.findIndex(p => p && p.token === reconnectToken && !p.connected);
    }
    if (slot < 0) slot = room.players.findIndex(p => !p);
    if (slot < 0) {
      socket.emit("joinError", "TEAM IS FULL");
      return;
    }

    const token = reconnectToken || randomCode(16);
    room.players[slot] = {
      socketId: socket.id,
      token,
      connected: true,
      name: sanitizeName(name)
    };
    socket.data.roomCode = room.code;
    socket.data.slot = slot;
    socket.join(room.code);

    socket.emit("joined", {
      code: room.code,
      slot,
      color: COLORS[slot],
      token,
      state: roomState(room)
    });
    emitRoom(room);

    if (!room.started && room.players.filter(Boolean).length === 4) {
      setTimeout(() => {
        const current = rooms.get(room.code);
        if (current && current.players.filter(p => p && p.connected).length === 4) startRoom(current);
      }, 900);
    }
  });

  socket.on("answer", ({ challengeId, value }) => {
    const room = rooms.get(socket.data.roomCode);
    const slot = socket.data.slot;
    if (!room || room.finished || room.teamRound || slot == null) return;
    const c = room.challenges[slot];
    if (!c || c.id !== challengeId || Date.now() >= c.expiresAt) return;

    let ok = false;
    if (c.type === "oddDigit") ok = Number(value) === c.answer;
    else if (["numberColor", "shapeColor", "stroop"].includes(c.type)) ok = String(value) === String(c.answer);
    else if (c.type === "rotation") ok = Number(value) === Number(c.answer);

    if (ok) successChallenge(room, slot, c);
    else failChallenge(room, slot, c, "wrong");
    if (!room.finished) emitRoom(room);
  });

  socket.on("teamClick", ({ number }) => {
    const room = rooms.get(socket.data.roomCode);
    const slot = socket.data.slot;
    if (!room || !room.teamRound || room.finished || slot == null) return;

    const target = room.teamRound.circles.find(c => c.n === room.teamRound.current);
    if (!target) return;
    if (Number(number) !== target.n || target.owner !== slot) {
      room.life[slot] = Math.max(0, room.life[slot] - 1);
      io.to(room.code).emit("feedback", { slot, ok: false, reason: "team-order" });
      if (room.life[slot] <= 0) {
        finishRoom(room, slot);
        return;
      }
      emitRoom(room);
      return;
    }

    room.teamRound.current++;
    io.to(room.code).emit("teamRoundProgress", { current: room.teamRound.current });
    if (room.teamRound.current > room.teamRound.circles.length) {
      finishTeamRound(room, true);
    }
  });

  socket.on("cursor", ({ x, y }) => {
    const room = rooms.get(socket.data.roomCode);
    const slot = socket.data.slot;
    if (!room || slot == null) return;
    socket.to(room.code).emit("cursor", {
      slot,
      x: Math.max(0, Math.min(1, Number(x))),
      y: Math.max(0, Math.min(1, Number(y)))
    });
  });

  socket.on("disconnect", () => leaveSocket(socket));
});

server.listen(PORT, HOST, () => {
  console.log(`Team Test recreation listening on http://${HOST}:${PORT}`);
});
