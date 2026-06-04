const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const rooms = new Map();

const CONTRACTS = [
  { label: "Two sets of 3", sets: [3, 3], runs: [] },
  { label: "One set of 3 + one same-suit run of 4", sets: [3], runs: [4] },
  { label: "Two same-suit runs of 4", sets: [], runs: [4, 4] },
  { label: "One set of 4 + one same-suit run of 4", sets: [4], runs: [4] },
  { label: "Two sets of 4", sets: [4, 4], runs: [] },
  { label: "One same-suit run of 7", sets: [], runs: [7] },
  { label: "One set of 5 + one set of 3", sets: [5, 3], runs: [] },
  { label: "One same-suit run of 8", sets: [], runs: [8] },
  { label: "One set of 5 + one same-suit run of 4", sets: [5], runs: [4] },
  { label: "One same-suit run of 9", sets: [], runs: [9] },
  { label: "Two sets of 5", sets: [5, 5], runs: [] },
  { label: "One same-suit run of 10", sets: [], runs: [10] }
];

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = [
  { rank: "A", value: 1 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 11 },
  { rank: "Q", value: 12 },
  { rank: "K", value: 13 }
];

function makeDeck() {
  const cards = [];
  for (let deck = 0; deck < 2; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          id: `${deck}-${suit}-${rank.rank}`,
          suit,
          rank: rank.rank,
          value: rank.value,
          label: `${rank.rank}${suitSymbol(suit)}`
        });
      }
    }
    cards.push({ id: `${deck}-joker-a`, suit: "joker", rank: "Joker", value: 0, wild: true, label: "Joker" });
    cards.push({ id: `${deck}-joker-b`, suit: "joker", rank: "Joker", value: 0, wild: true, label: "Joker" });
  }
  return shuffle(cards);
}

function suitSymbol(suit) {
  return { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[suit] || "";
}

function shuffle(cards) {
  const copy = cards.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  do {
    value = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(value));
  return value;
}

function uid() {
  return crypto.randomBytes(10).toString("hex");
}

function createRoom(hostName) {
  const room = {
    code: code(),
    players: [],
    hostId: null,
    status: "lobby",
    round: 1,
    stock: [],
    discard: [],
    melds: [],
    turnIndex: 0,
    mustDraw: true,
    lastWinnerId: null,
    log: []
  };
  rooms.set(room.code, room);
  const player = addPlayer(room, hostName);
  room.hostId = player.id;
  return { room, player };
}

function addPlayer(room, name) {
  if (room.status !== "lobby") throw new Error("This game has already started.");
  if (room.players.length >= 8) throw new Error("This table is full.");
  const player = {
    id: uid(),
    name: cleanName(name),
    hand: [],
    contractIndex: 0,
    score: 0,
    laidDown: false,
    tableIntent: { hoverIndex: null, selectedIndices: [] },
    connected: true,
    socket: null
  };
  room.players.push(player);
  return player;
}

function cleanName(name) {
  const trimmed = String(name || "").trim().slice(0, 24);
  return trimmed || "Player";
}

function startRound(room) {
  room.status = "playing";
  room.stock = makeDeck();
  room.discard = [];
  room.melds = [];
  room.mustDraw = true;
  room.players.forEach((player) => {
    player.hand = [];
    player.laidDown = false;
    for (let i = 0; i < 11; i += 1) player.hand.push(room.stock.pop());
  });
  room.discard.push(room.stock.pop());
  if (room.lastWinnerId) {
    const next = room.players.findIndex((player) => player.id === room.lastWinnerId);
    room.turnIndex = next >= 0 ? (next + 1) % room.players.length : 0;
  } else {
    room.turnIndex = 0;
  }
  addLog(room, `Round ${room.round} started. ${currentPlayer(room).name} plays first.`);
}

function currentPlayer(room) {
  return room.players[room.turnIndex];
}

function addLog(room, message) {
  room.log.unshift({ id: uid(), message, at: new Date().toISOString() });
  room.log = room.log.slice(0, 30);
}

function draw(room, player, pile) {
  ensureTurn(room, player);
  if (!room.mustDraw) throw new Error("You have already drawn. Lay down or discard.");
  clearIntent(player);
  if (pile === "discard") {
    if (!room.discard.length) throw new Error("The discard pile is empty.");
    player.hand.push(room.discard.pop());
    addLog(room, `${player.name} picked up the discard.`);
  } else {
    if (!room.stock.length) recycleDiscard(room);
    if (!room.stock.length) throw new Error("No cards left to draw.");
    player.hand.push(room.stock.pop());
    addLog(room, `${player.name} drew from the stock.`);
  }
  room.mustDraw = false;
}

function recycleDiscard(room) {
  if (room.discard.length <= 1) return;
  const top = room.discard.pop();
  room.stock = shuffle(room.discard);
  room.discard = [top];
  addLog(room, "The discard pile was shuffled into a new stock.");
}

function layDown(room, player, groups) {
  ensureTurn(room, player);
  if (room.mustDraw) throw new Error("Draw a card before laying down.");
  if (player.laidDown) throw new Error("You have already laid down this round.");
  clearIntent(player);
  const normalized = normalizeGroups(player, groups);
  const contract = CONTRACTS[player.contractIndex] || CONTRACTS[CONTRACTS.length - 1];
  const validation = validateContract(normalized, contract);
  if (!validation.ok) throw new Error(validation.reason);

  const used = new Set(normalized.flatMap((group) => group.cards.map((card) => card.id)));
  player.hand = player.hand.filter((card) => !used.has(card.id));
  player.laidDown = true;
  normalized.forEach((group) => {
    room.melds.push({
      id: uid(),
      ownerId: player.id,
      ownerName: player.name,
      type: group.type,
      cards: sortGroupCards(group.cards, group.type)
    });
  });
  addLog(room, `${player.name} laid down: ${contract.label}.`);
}

function normalizeGroups(player, groups) {
  if (!Array.isArray(groups) || groups.length === 0) throw new Error("Choose cards to lay down first.");
  const handById = new Map(player.hand.map((card) => [card.id, card]));
  const seen = new Set();
  return groups.map((group) => {
    const cards = (group.cards || []).map((id) => {
      if (!handById.has(id)) throw new Error("One of those cards is not in your hand.");
      if (seen.has(id)) throw new Error("A card cannot be used twice.");
      seen.add(id);
      return handById.get(id);
    });
    const type = group.type === "run" || group.type === "set" ? group.type : "auto";
    return { type, cards };
  });
}

function validateContract(groups, contract) {
  const expected = [
    ...contract.sets.map((size) => ({ type: "set", size })),
    ...contract.runs.map((size) => ({ type: "run", size }))
  ];
  if (groups.length !== expected.length) return { ok: false, reason: `This round needs ${contract.label}.` };

  const remaining = groups.slice();
  for (const need of expected) {
    const index = remaining.findIndex((group) => {
      if (group.type !== "auto" && group.type !== need.type) return false;
      return group.cards.length >= need.size && isValidGroup({ type: need.type, cards: group.cards });
    });
    if (index === -1) return { ok: false, reason: `Those cards do not satisfy: ${contract.label}.` };
    remaining[index].type = need.type;
    remaining.splice(index, 1);
  }
  return { ok: true };
}

function isValidGroup(group) {
  const natural = group.cards.filter((card) => !card.wild);
  const wildCount = group.cards.length - natural.length;
  if (group.type === "set") {
    if (!natural.length) return true;
    return natural.every((card) => card.rank === natural[0].rank) && wildCount <= group.cards.length - 2;
  }
  const suits = new Set(natural.map((card) => card.suit));
  if (suits.size > 1) return false;
  const values = [...new Set(natural.map((card) => card.value))].sort((a, b) => a - b);
  if (values.length !== natural.length) return false;
  for (let start = 1; start <= 14 - group.cards.length; start += 1) {
    let missing = 0;
    for (let v = start; v < start + group.cards.length; v += 1) {
      if (!values.includes(v)) missing += 1;
    }
    if (missing <= wildCount) return true;
  }
  return false;
}

function sortGroupCards(cards, type) {
  const suitOrder = { hearts: 0, diamonds: 1, clubs: 2, spades: 3, joker: 4 };
  const sorted = cards.slice();
  if (type === "run") {
    return sorted.sort((a, b) => {
      if (a.wild && b.wild) return a.id.localeCompare(b.id);
      if (a.wild) return 1;
      if (b.wild) return -1;
      return a.value - b.value || suitOrder[a.suit] - suitOrder[b.suit];
    });
  }
  return sorted.sort((a, b) => {
    if (a.wild && b.wild) return a.id.localeCompare(b.id);
    if (a.wild) return 1;
    if (b.wild) return -1;
    return a.value - b.value || suitOrder[a.suit] - suitOrder[b.suit];
  });
}

function addToMeld(room, player, cardId, meldId) {
  ensureTurn(room, player);
  if (room.mustDraw) throw new Error("Draw a card before adding to melds.");
  if (!player.laidDown) throw new Error("You must lay down before adding to other melds.");
  clearIntent(player);
  const card = player.hand.find((item) => item.id === cardId);
  const meld = room.melds.find((item) => item.id === meldId);
  if (!card || !meld) throw new Error("Card or meld not found.");
  if (!isValidGroup({ type: meld.type, cards: [...meld.cards, card] })) {
    throw new Error("That card does not fit on this meld.");
  }
  player.hand = player.hand.filter((item) => item.id !== cardId);
  meld.cards.push(card);
  meld.cards = sortGroupCards(meld.cards, meld.type);
  addLog(room, `${player.name} added a card to ${meld.ownerName}'s meld.`);
}

function discard(room, player, cardId) {
  ensureTurn(room, player);
  if (room.mustDraw) throw new Error("Draw a card before discarding.");
  clearIntent(player);
  const card = player.hand.find((item) => item.id === cardId);
  if (!card) throw new Error("That card is not in your hand.");
  player.hand = player.hand.filter((item) => item.id !== cardId);
  room.discard.push(card);
  addLog(room, `${player.name} discarded ${card.label}.`);
  if (player.hand.length === 0) finishRound(room, player);
  else {
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    room.mustDraw = true;
  }
}

function finishRound(room, winner) {
  room.lastWinnerId = winner.id;
  addLog(room, `${winner.name} went out.`);
  room.players.forEach((player) => {
    const points = player.hand.reduce((sum, card) => sum + cardPoints(card), 0);
    player.score += points;
    if ((player.laidDown || player.id === winner.id) && player.contractIndex < CONTRACTS.length - 1) {
      player.contractIndex += 1;
    }
  });
  if (winner.contractIndex >= CONTRACTS.length - 1) {
    room.status = "finished";
    addLog(room, `${winner.name} completed the final contract.`);
  } else {
    room.status = "roundOver";
    room.round += 1;
  }
}

function cardPoints(card) {
  if (card.wild) return 25;
  if (card.value >= 10) return 10;
  return 5;
}

function ensureTurn(room, player) {
  if (room.status !== "playing") throw new Error("The game is not currently playing.");
  if (currentPlayer(room).id !== player.id) throw new Error("It is not your turn.");
}

function clearIntent(player) {
  player.tableIntent = { hoverIndex: null, selectedIndices: [] };
}

function publicState(room, viewer) {
  return {
    code: room.code,
    status: room.status,
    round: room.round,
    hostId: room.hostId,
    you: viewer.id,
    currentPlayerId: room.status === "playing" ? currentPlayer(room).id : null,
    mustDraw: room.mustDraw,
    stockCount: room.stock.length,
    topDiscard: room.discard[room.discard.length - 1] || null,
    discardCount: room.discard.length,
    contracts: CONTRACTS,
    melds: room.melds,
    log: room.log,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      handCount: player.hand.length,
      contractIndex: player.contractIndex,
      score: player.score,
      laidDown: player.laidDown,
      tableIntent: player.id === viewer.id ? undefined : player.tableIntent,
      connected: player.connected,
      isHost: player.id === room.hostId,
      hand: player.id === viewer.id ? sortHand(player.hand) : undefined
    }))
  };
}

function sortHand(hand) {
  const suitOrder = { hearts: 0, diamonds: 1, clubs: 2, spades: 3, joker: 4 };
  return hand.slice().sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || a.value - b.value);
}

function broadcast(room, exceptPlayerId = null) {
  for (const player of room.players) {
    if (player.id === exceptPlayerId) continue;
    if (player.socket) send(player.socket, { type: "state", state: publicState(room, player) });
  }
}

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function handleMessage(ws, message) {
  let data;
  try {
    data = JSON.parse(message);
  } catch {
    send(ws, { type: "error", message: "That message was not understood." });
    return;
  }
  try {
    if (data.type === "create") {
      const { room, player } = createRoom(data.name);
      player.socket = ws;
      ws.playerId = player.id;
      ws.roomCode = room.code;
      addLog(room, `${player.name} created the game.`);
      broadcast(room);
      return;
    }

    if (data.type === "join") {
      const room = rooms.get(String(data.code || "").toUpperCase());
      if (!room) throw new Error("Game code not found.");
      const player = addPlayer(room, data.name);
      player.socket = ws;
      ws.playerId = player.id;
      ws.roomCode = room.code;
      addLog(room, `${player.name} joined the table.`);
      broadcast(room);
      return;
    }

    const { room, player } = getSession(ws);
    if (data.type === "start") {
      if (player.id !== room.hostId) throw new Error("Only the host can start the game.");
      if (room.players.length < 2) throw new Error("You need at least two players.");
      startRound(room);
    } else if (data.type === "nextRound") {
      if (player.id !== room.hostId) throw new Error("Only the host can start the next round.");
      if (room.status !== "roundOver") throw new Error("The round is not over.");
      startRound(room);
    } else if (data.type === "draw") draw(room, player, data.pile);
    else if (data.type === "layDown") layDown(room, player, data.groups);
    else if (data.type === "addToMeld") addToMeld(room, player, data.cardId, data.meldId);
    else if (data.type === "discard") discard(room, player, data.cardId);
    else if (data.type === "intent") {
      player.tableIntent = {
        hoverIndex: Number.isInteger(data.hoverIndex) ? data.hoverIndex : null,
        selectedIndices: Array.isArray(data.selectedIndices)
          ? data.selectedIndices.filter(Number.isInteger).slice(0, 6)
          : []
      };
      broadcast(room, player.id);
      return;
    }
    else throw new Error("Unknown action.");
    broadcast(room);
  } catch (error) {
    send(ws, { type: "error", message: error.message });
  }
}

function getSession(ws) {
  const room = rooms.get(ws.roomCode);
  if (!room) throw new Error("You are not in a room.");
  const player = room.players.find((item) => item.id === ws.playerId);
  if (!player) throw new Error("You are not seated at this table.");
  return { room, player };
}

function handleClose(ws) {
  const room = rooms.get(ws.roomCode);
  if (!room) return;
  const player = room.players.find((item) => item.id === ws.playerId);
  if (!player) return;
  player.connected = false;
  player.socket = null;
  addLog(room, `${player.name} disconnected.`);
  broadcast(room);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(content);
  });
});

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  return "application/octet-stream";
}

server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.destroy();
    return;
  }
  const key = req.headers["sec-websocket-key"];
  const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    ""
  ].join("\r\n"));
  const ws = wrapSocket(socket);
  socket.on("data", (buffer) => decodeFrames(buffer).forEach((text) => handleMessage(ws, text)));
  socket.on("close", () => handleClose(ws));
  socket.on("error", () => handleClose(ws));
});

function wrapSocket(socket) {
  return {
    readyState: 1,
    roomCode: null,
    playerId: null,
    send(text) {
      const payload = Buffer.from(text);
      const header = payload.length < 126
        ? Buffer.from([0x81, payload.length])
        : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 255]);
      socket.write(Buffer.concat([header, payload]));
    }
  };
}

function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const byte1 = buffer[offset++];
    const byte2 = buffer[offset++];
    const masked = Boolean(byte2 & 0x80);
    let length = byte2 & 0x7f;
    if (length === 126) {
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      length = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }
    const mask = masked ? buffer.slice(offset, offset + 4) : null;
    if (masked) offset += 4;
    const payload = buffer.slice(offset, offset + length);
    offset += length;
    if ((byte1 & 0x0f) === 8) continue;
    if (mask) {
      for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    }
    frames.push(payload.toString("utf8"));
  }
  return frames;
}

server.listen(PORT, () => {
  console.log(`Frustration web app running at http://localhost:${PORT}`);
});
