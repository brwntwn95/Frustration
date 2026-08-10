const socket = io();

const COLORS = {
  red: "#df2d2d",
  blue: "#2d67df",
  yellow: "#e9b718",
  green: "#33ad55"
};

const screens = ["landing","lobby","game","results"];
const state = {
  code: null,
  slot: null,
  color: null,
  token: null,
  room: null,
  startedAt: 0,
  sound: true,
  timerRAF: null,
  renderedChallengeIds: [null,null,null,null],
  remoteCursors: {},
  final: null
};

const $ = (id) => document.getElementById(id);
const screen = (id) => {
  screens.forEach(s => $(s).classList.toggle("active", s === id));
};

function displayTime(ms) {
  ms = Math.max(0, ms);
  const totalCs = Math.floor(ms / 10);
  const min = Math.floor(totalCs / 6000);
  const sec = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}:${String(cs).padStart(2,"0")}`;
}

function nameValue() {
  return $("nameInput").value.trim() || "ANONYMOUS";
}

function parseHashRoom() {
  const m = location.hash.match(/^#\/private\/([A-Za-z0-9-]+)/);
  return m ? m[1].toUpperCase() : null;
}

function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i=0;i<8;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function doJoin(mode, code) {
  socket.emit("join", {
    mode,
    code,
    name: nameValue(),
    reconnectToken: mode === "reconnect" ? state.token : null
  });
}

$("publicBtn").onclick = () => doJoin("public");
$("createBtn").onclick = () => {
  const code = createRoomCode();
  location.hash = `#/private/${code}`;
  doJoin("create", code);
};
$("joinBtn").onclick = () => {
  const code = $("roomInput").value.trim().toUpperCase();
  if (code) {
    location.hash = `#/private/${code}`;
    doJoin("join", code);
  }
};

$("copyLinkBtn").onclick = async () => {
  const url = `${location.origin}${location.pathname}#/private/${state.code}`;
  try {
    await navigator.clipboard.writeText(url);
    $("copyLinkBtn").textContent = "COPIED";
    setTimeout(() => $("copyLinkBtn").textContent = "COPY INVITE LINK", 1200);
  } catch {
    prompt("Copy this invite link:", url);
  }
};

$("soundToggle").onclick = () => {
  state.sound = !state.sound;
  $("soundToggle").textContent = `SOUND: ${state.sound ? "ON" : "OFF"}`;
  if (state.sound) beep(480, .05, .03);
};

$("leaveBtn").onclick = () => {
  location.hash = "";
  location.reload();
};
$("reconnectBtn").onclick = () => {
  location.reload();
};

function beep(freq=520, duration=.06, volume=.025, type="sine") {
  if (!state.sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!beep.ctx) beep.ctx = new AudioCtx();
    const ctx = beep.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

socket.on("joinError", msg => {
  alert(msg);
});

socket.on("joined", payload => {
  state.code = payload.code;
  state.slot = payload.slot;
  state.color = payload.color;
  state.token = payload.token;
  state.room = payload.state;
  localStorage.setItem(`teamtest:${state.code}:token`, state.token);
  $("teamCode").textContent = state.code;
  $("roomLabel").textContent = `TEAM ${state.code}`;
  $("myColorLabel").innerHTML = `YOU ARE <strong style="color:${state.color.hex}">${state.color.label}</strong>`;
  renderLobby();
  if (payload.state.started) enterGame(payload.state.startAt);
  else screen("lobby");
});

socket.on("roomState", room => {
  state.room = room;
  if (!room.started) renderLobby();
  else {
    if (!$("game").classList.contains("active")) enterGame(room.startAt);
    renderGame();
  }
});

socket.on("gameStarting", ({ startAt }) => enterGame(startAt));

function renderLobby() {
  if (!state.room) return;
  $("teamCode").textContent = state.code;
  const host = $("playersLobby");
  host.innerHTML = "";
  for (let i=0;i<4;i++) {
    const p = state.room.players[i];
    const color = ["#df2d2d","#2d67df","#e9b718","#33ad55"][i];
    const card = document.createElement("div");
    card.className = "player-lobby-card";
    card.style.setProperty("--c", color);
    card.innerHTML = p
      ? `<strong>${escapeHtml(p.name)}</strong><span>${p.color.label}${i===state.slot ? " — YOU" : ""}</span>`
      : `<strong>AWAITING</strong><span>POSITION ${i+1}</span>`;
    host.appendChild(card);
  }
}

function enterGame(startAt) {
  state.startedAt = startAt;
  screen("game");
  renderGame();
  runClock();
  runCountdown();
}

function runCountdown() {
  const el = $("countdown");
  const tick = () => {
    const diff = state.startedAt - Date.now();
    if (diff <= 0) {
      el.classList.add("hidden");
      beep(820, .11, .04, "square");
      return;
    }
    const n = Math.ceil(diff / 1000);
    el.textContent = n;
    el.classList.remove("hidden");
    beep(320 + n*40, .04, .02, "square");
    setTimeout(tick, 180);
  };
  tick();
}

function runClock() {
  cancelAnimationFrame(state.timerRAF);
  const step = () => {
    if ($("game").classList.contains("active")) {
      $("totalTime").querySelector("strong").textContent = displayTime(Date.now() - state.startedAt);
      renderTimerDots();
      renderTeamTimer();
      state.timerRAF = requestAnimationFrame(step);
    }
  };
  state.timerRAF = requestAnimationFrame(step);
}

function renderGame() {
  if (!state.room) return;
  document.documentElement.style.setProperty("--my-color", state.color.hex);
  for (let i=0;i<4;i++) {
    const q = $(`quad${i}`);
    q.classList.toggle("mine", i===state.slot);
    q.style.setProperty("--owner-color", state.room.players[i]?.color?.hex || "#555");
    renderChallenge(q, state.room.challenges[i], i);
  }
  renderLife();
  renderTeamRound(state.room.teamRound);
}

function renderChallenge(q, c, slot) {
  if (!c) {
    q.innerHTML = `<div class="task disabled"><h4>WAITING</h4></div>`;
    return;
  }
  if (state.renderedChallengeIds[slot] === c.id && q.dataset.cid === c.id) return;
  state.renderedChallengeIds[slot] = c.id;
  q.dataset.cid = c.id;
  const mine = slot === state.slot;
  const p = state.room.players[slot];
  const color = p?.color?.hex || "#777";
  const disabled = mine ? "" : "disabled";
  let html = `<div class="task ${disabled}" data-challenge="${c.id}" style="--owner-color:${color}">`;

  if (c.type === "oddDigit") {
    const side = Math.sqrt(c.grid.length);
    html += `<h4>FIND THE DIFFERENT NUMBER</h4><div class="instruction">Click the number that does not belong.</div>`;
    html += `<div class="digit-grid" style="grid-template-columns:repeat(${side},1fr)">`;
    c.grid.forEach((d, idx) => html += `<button class="digit-cell" data-answer="${idx}">${d}</button>`);
    html += `</div>`;
  }

  if (c.type === "numberColor") {
    html += `<h4>REMEMBER THE CONNECTION</h4>`;
    html += `<div class="memory-stage" data-reveal="${c.revealAt}">`;
    html += `<div class="memory-show">` + c.mapping.map(x => `<div class="memory-pair"><b>${x.n}</b><i class="dot" style="background:${COLORS[x.color]}"></i></div>`).join("") + `</div>`;
    html += `<div class="memory-question hidden"><div class="instruction">WHICH COLOUR BELONGED TO THE NUMBER?</div><div class="prompt-big">${c.promptNumber}</div><div class="choice-row">`;
    c.choices.forEach(col => html += `<button class="choice color-choice" data-answer="${col}" style="background:${COLORS[col]}"></button>`);
    html += `</div></div></div>`;
  }

  if (c.type === "shapeColor") {
    html += `<h4>REMEMBER SHAPE AND COLOUR</h4>`;
    html += `<div class="memory-stage" data-reveal="${c.revealAt}">`;
    html += `<div class="memory-show">` + c.mapping.map(x => `<div class="memory-pair"><i class="shape ${x.shape}" style="color:${COLORS[x.color]}"></i></div>`).join("") + `</div>`;
    html += `<div class="memory-question hidden"><div class="instruction">WHICH COLOUR BELONGED TO THIS SHAPE?</div><div class="prompt-big"><i class="shape ${c.promptShape}" style="color:white"></i></div><div class="choice-row">`;
    c.choices.forEach(col => html += `<button class="choice color-choice" data-answer="${col}" style="background:${COLORS[col]}"></button>`);
    html += `</div></div></div>`;
  }

  if (c.type === "rotation") {
    html += `<h4>SPATIAL THINKING</h4><div class="instruction">Rotate the arrow ${c.base.turn}° clockwise.</div>`;
    html += `<div class="prompt-big"><span class="rotation-arrow" style="--a:${c.base.angle}deg">↑</span></div><div class="choice-row">`;
    c.options.forEach(a => html += `<button class="choice rotation-option" data-answer="${a}"><span style="display:inline-block;transform:rotate(${a}deg)">↑</span></button>`);
    html += `</div>`;
  }

  if (c.type === "stroop") {
    html += `<h4>MULTITASKING</h4><div class="instruction">Choose the ${c.promptMode === "ink" ? "INK COLOUR" : "WORD"}.</div>`;
    html += `<div class="stroop-word" style="color:${COLORS[c.ink]}">${c.word}</div><div class="choice-row">`;
    c.options.forEach(col => html += `<button class="choice color-choice" data-answer="${col}" title="${col}" style="background:${COLORS[col]}"></button>`);
    html += `</div>`;
  }

  html += `<div class="timer-dots" data-exp="${c.expiresAt}">` + Array.from({length:10},()=>`<i></i>`).join("") + `</div></div>`;
  q.innerHTML = html;

  if (mine) {
    q.querySelectorAll("[data-answer]").forEach(btn => {
      btn.addEventListener("click", () => {
        socket.emit("answer", { challengeId: c.id, value: btn.dataset.answer });
      });
    });
  }
  scheduleMemoryReveal(q);
}

function scheduleMemoryReveal(q) {
  const stage = q.querySelector(".memory-stage");
  if (!stage) return;
  const reveal = Number(stage.dataset.reveal);
  const fn = () => {
    const show = stage.querySelector(".memory-show");
    const question = stage.querySelector(".memory-question");
    if (!show || !question) return;
    if (Date.now() >= reveal) {
      show.classList.add("hidden");
      question.classList.remove("hidden");
    } else {
      setTimeout(fn, 80);
    }
  };
  fn();
}

function renderTimerDots() {
  document.querySelectorAll(".timer-dots").forEach(row => {
    const exp = Number(row.dataset.exp);
    const task = row.closest(".task");
    const cId = task?.dataset.challenge;
    let c;
    if (state.room) c = state.room.challenges.find(x => x && x.id === cId);
    if (!c) return;
    const max = Math.max(1, c.expiresAt - (c.revealAt ? c.revealAt - 1800 : (c.expiresAt - 8000)));
    const remaining = Math.max(0, exp - Date.now());
    const ratio = Math.min(1, remaining / Math.max(3500, max));
    const lit = Math.ceil(ratio * 10);
    [...row.children].forEach((d,i) => d.classList.toggle("on", i < lit));
  });
}

function renderLife() {
  const host = $("lifeBar");
  host.innerHTML = "";
  for (let i=0;i<4;i++) {
    const p = state.room.players[i];
    const c = p?.color?.hex || "#555";
    const n = state.room.life[i];
    const div = document.createElement("div");
    div.className = "life-slot";
    div.style.setProperty("--c", c);
    div.innerHTML = `<strong>${p ? escapeHtml(p.name) : `PLAYER ${i+1}`}${i===state.slot ? " — YOU" : ""}</strong><div class="life-dots">` +
      Array.from({length:10}, (_,k)=>`<i class="${k<n ? "on":""}"></i>`).join("") + `</div>`;
    host.appendChild(div);
  }
}

function renderTeamRound(tr) {
  const host = $("teamOverlay");
  if (!tr || !tr.active) {
    host.classList.add("hidden");
    host.innerHTML = "";
    return;
  }
  host.classList.remove("hidden");
  host.dataset.expires = tr.expiresAt;
  host.innerHTML = `<h3>CLICK AWAY THE CIRCLES IN TURN — ONLY CLICK YOUR COLOUR</h3>` +
    tr.circles.map(c => {
      const done = c.n < tr.current ? "done" : "";
      const current = c.n === tr.current ? "current" : "";
      return `<button class="team-circle ${done} ${current}" data-n="${c.n}" data-owner="${c.owner}" style="left:${c.x}%;top:${c.y}%;color:${COLORS[c.color]}">${c.n}</button>`;
    }).join("") +
    `<div class="team-round-timer" id="teamRoundTimer"></div>`;
  host.querySelectorAll(".team-circle").forEach(btn => {
    if (Number(btn.dataset.owner) === state.slot) {
      btn.addEventListener("click", () => socket.emit("teamClick", { number: Number(btn.dataset.n) }));
    } else {
      btn.style.cursor = "default";
    }
  });
}

function renderTeamTimer() {
  const host = $("teamOverlay");
  if (host.classList.contains("hidden")) return;
  const el = $("teamRoundTimer");
  if (!el) return;
  const left = Math.max(0, Number(host.dataset.expires) - Date.now());
  el.textContent = `${(left/1000).toFixed(1)}s`;
}

socket.on("teamRoundStart", tr => {
  if (state.room) state.room.teamRound = tr;
  renderTeamRound(tr);
  beep(210, .18, .045, "sawtooth");
});

socket.on("teamRoundProgress", ({ current }) => {
  if (!state.room?.teamRound) return;
  state.room.teamRound.current = current;
  renderTeamRound(state.room.teamRound);
  beep(700 + current*8, .025, .018);
});

socket.on("teamRoundEnd", ({ ok }) => {
  if (state.room) state.room.teamRound = null;
  $("teamOverlay").classList.add("hidden");
  flash(ok);
});

socket.on("feedback", ({ slot, ok }) => {
  if (slot === state.slot) flash(ok);
});

socket.on("playerDisconnected", ({ slot }) => {
  const p = state.room?.players?.[slot];
  if (p) p.connected = false;
});

function flash(ok) {
  const el = $("feedbackFlash");
  el.className = `feedback-flash ${ok ? "ok" : "bad"}`;
  void el.offsetWidth;
  if (ok) {
    beep(760, .05, .025);
    setTimeout(() => beep(930, .055, .02), 45);
  } else {
    beep(125, .14, .05, "sawtooth");
  }
}

socket.on("gameOver", result => {
  state.final = result;
  screen("results");
  const elapsed = result.elapsedMs;
  $("resultTitle").textContent = `RESULT FOR TEAM ${state.code}`;
  $("finalTime").textContent = displayTime(elapsed);
  $("timeMeterFill").style.height = `${Math.min(100, elapsed / 360000 * 100)}%`;
  document.querySelectorAll(".result-bars [data-cat]").forEach(row => {
    const v = result.categoryScores[row.dataset.cat] || 0;
    row.querySelector("i").style.width = `${Math.round(v*100)}%`;
  });
  beep(120, .35, .045, "sawtooth");
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

// shared cursors
let lastCursorSend = 0;
$("board").addEventListener("pointermove", e => {
  const now = performance.now();
  if (now - lastCursorSend < 45) return;
  lastCursorSend = now;
  const r = $("board").getBoundingClientRect();
  socket.emit("cursor", { x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height });
});

socket.on("cursor", ({ slot, x, y }) => {
  let el = state.remoteCursors[slot];
  if (!el) {
    el = document.createElement("div");
    el.className = "remote-cursor";
    const hex = ["#df2d2d","#2d67df","#e9b718","#33ad55"][slot];
    el.style.color = hex;
    $("cursors").appendChild(el);
    state.remoteCursors[slot] = el;
  }
  el.style.left = `${x*100}%`;
  el.style.top = `${y*100}%`;
});

// If someone opens an invite URL, prefill and join it.
window.addEventListener("load", () => {
  const code = parseHashRoom();
  if (code) {
    $("roomInput").value = code;
  }
});
