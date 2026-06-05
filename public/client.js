const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const BUILD_STAMP = "Build 20260605-2249";
const BUILD_DATE = "05/06/2026 - 10:49PM";
let socket;
let state;
let selected = new Set();
let groups = [];
let sortMode = localStorage.getItem("frustration-sort") || "suit";
let lastDrawPile = null;
let intentTimer = null;
let targetMeldId = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let connectionMessage = "Connecting...";
let lastTurnNoticeKey = null;

connect();
renderWelcome();

function connect() {
  window.clearTimeout(reconnectTimer);
  connectionMessage = reconnectAttempts ? "Reconnecting..." : "Connecting...";
  renderConnectionStatus();
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
  socket.addEventListener("open", () => {
    reconnectAttempts = 0;
    connectionMessage = "Connected";
    renderConnectionStatus();
  });
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "state") {
      const shouldNotifyTurn = isNewTurnForMe(data.state);
      preserveValidGroups(data.state);
      preserveValidSelection(data.state);
      state = data.state;
      renderTable();
      if (shouldNotifyTurn) notifyMyTurn();
    }
    if (data.type === "error") showToast(data.message);
  });
  socket.addEventListener("error", () => {
    connectionMessage = "Connection failed. Retrying...";
    renderConnectionStatus();
  });
  socket.addEventListener("close", () => {
    connectionMessage = "Connection lost. Retrying...";
    renderConnectionStatus();
    scheduleReconnect();
  });
}

function send(payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    showToast("Still connecting. Try again in a moment.");
    return;
  }
  socket.send(JSON.stringify(payload));
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectAttempts += 1;
  const delay = Math.min(1200 + reconnectAttempts * 600, 5000);
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function renderConnectionStatus() {
  const status = document.querySelector("#connectionStatus");
  if (!status) return;
  status.textContent = connectionMessage;
  status.className = `connection-status ${connectionMessage === "Connected" ? "online" : "offline"}`;
}

function isNewTurnForMe(nextState) {
  if (nextState.status !== "playing" || nextState.currentPlayerId !== nextState.you) return false;
  const turnKey = `${nextState.round}:${nextState.currentPlayerId}:${nextState.mustDraw ? "draw" : "play"}`;
  const wasMyTurn = state?.status === "playing" && state.currentPlayerId === nextState.you;
  const isNew = !wasMyTurn && lastTurnNoticeKey !== turnKey;
  if (isNew) lastTurnNoticeKey = turnKey;
  return isNew;
}

function notifyMyTurn() {
  showToast(state.mustDraw ? "Your turn. Pick up a card." : "Your turn.");
  document.title = "Your turn - Frustration Rummy";
  window.setTimeout(() => {
    if (state?.status === "playing" && state.currentPlayerId === state.you) return;
    document.title = "Frustration Rummy";
  }, 2400);
}

function preserveValidSelection(nextState) {
  const me = nextState.players.find((player) => player.id === nextState.you);
  if (!me?.hand) {
    selected.clear();
    return;
  }
  const valid = new Set(me.hand.map((card) => card.id));
  selected = new Set([...selected].filter((id) => valid.has(id)));
}

function preserveValidGroups(nextState) {
  const me = nextState.players.find((player) => player.id === nextState.you);
  if (!me?.hand) {
    groups = [];
    return;
  }
  const valid = new Set(me.hand.map((card) => card.id));
  groups = groups
    .map((group) => ({
      ...group,
      cards: group.cards.filter((id) => valid.has(id))
    }))
    .filter((group) => group.cards.length);
}

function renderWelcome() {
  app.innerHTML = `
    <section class="screen welcome">
      <div class="welcome-inner">
        <div class="title">
          <h1>Frustration Rummy</h1>
          <p>Create a private table, text the short code, and play with hidden hands, shared piles, contracts, and scoring.</p>
          <div class="build-stamp">${BUILD_STAMP} <span>${BUILD_DATE}</span></div>
        </div>
        <form class="entry" id="joinForm">
          <h2>Join a table</h2>
          <div class="connection-status offline" id="connectionStatus">${connectionMessage}</div>
          <label class="field">Your name
            <input id="name" autocomplete="name" maxlength="24" required>
          </label>
          <label class="field">Game code
            <input id="code" maxlength="5" autocapitalize="characters" placeholder="Leave blank to create">
          </label>
          <div class="actions">
            <button type="submit">Join Game</button>
            <button class="secondary" type="button" id="createBtn">Create Game</button>
          </div>
        </form>
      </div>
    </section>
  `;
  document.querySelector("#joinForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#name").value;
    const code = document.querySelector("#code").value.trim().toUpperCase();
    if (!code) {
      send({ type: "create", name });
    } else {
      send({ type: "join", name, code });
    }
  });
  document.querySelector("#createBtn").addEventListener("click", () => {
    const name = document.querySelector("#name").value;
    if (!name.trim()) {
      showToast("Enter your name first.");
      return;
    }
    send({ type: "create", name });
  });
}

function renderTable() {
  const previousCardPositions = captureCardPositions();
  const me = state.players.find((player) => player.id === state.you);
  const isHost = state.hostId === state.you;
  const isMyTurn = state.currentPlayerId === state.you;
  const current = state.players.find((player) => player.id === state.currentPlayerId);
  const staged = groupedCardIds();
  const availableHand = sortHand(me.hand.filter((card) => !staged.has(card.id)));
  const opponents = state.players.filter((player) => player.id !== state.you);
  const myMelds = state.melds.filter((meld) => meld.ownerId === state.you);
  const addableCards = cardsAddableToTarget(availableHand);
  const passiveAddableCards = me.laidDown && !targetMeldId ? cardsAddableToAnyMeld(availableHand) : new Set();
  document.title = isMyTurn ? "Your turn - Frustration Rummy" : "Frustration Rummy";
  app.innerHTML = `
    <section class="screen table ${isMyTurn ? "my-turn" : ""}">
      <header class="topbar ${isMyTurn ? "my-turn" : ""}">
        <div>
          <div class="small">Text this code to friends</div>
          <div class="code">${state.code}</div>
        </div>
        <div>
          <strong>${statusText(current)}</strong>
          ${isMyTurn ? `<span class="turn-pill">${state.mustDraw ? "Pick up" : "Play"}</span>` : ""}
          <div class="small">Your contract: ${state.contracts[me.contractIndex]?.label || "Complete"}</div>
        </div>
        <div class="actions">
          ${state.status === "lobby" && isHost ? `<button id="startBtn">Start Game</button>` : ""}
          ${state.status === "roundOver" && isHost ? `<button id="nextRoundBtn">Next Round</button>` : ""}
        </div>
      </header>

      <div class="layout">
        <aside class="panel">
          <h2>Players</h2>
          <div class="players">${state.players.map(renderPlayer).join("")}</div>
        </aside>

        <section>
          <div class="felt ${isMyTurn ? "my-turn" : ""}">
            <div class="table-rail">
              ${opponents.map((player, index) => renderOpponentSeat(player, index, opponents.length)).join("")}
            </div>
            <div class="piles">
              <button class="pile" id="drawStock" ${!canDraw(isMyTurn) ? "disabled" : ""}>
                <span class="deck-stack" aria-hidden="true">
                  <span></span><span></span><span></span>
                </span>
                <span>Pick Up</span>
                <span class="small">${state.stockCount} cards</span>
              </button>
              <button class="pile" id="drawDiscard" ${!canDraw(isMyTurn) || !state.topDiscard ? "disabled" : ""}>
                ${renderDiscardPile()}
                <span class="small">${state.discardCount} cards</span>
              </button>
            </div>
            <div class="near-melds ${myMelds.length ? "" : "empty"}">
              ${myMelds.length ? myMelds.map(renderMeld).join("") : `<span class="table-empty">Your laid-down cards will sit here.</span>`}
            </div>
          </div>

          <div class="hand-area">
            <div class="hand-controls ${isMyTurn ? "my-turn" : ""}">
              <div class="hand-head">
                <strong>Your hand (${availableHand.length}${staged.size ? ` free, ${staged.size} grouped` : ""})</strong>
                <div class="hand-tools">
                  <div class="segmented" role="group" aria-label="Sort cards">
                    <button class="segment ${sortMode === "suit" ? "active" : ""}" data-sort="suit" aria-pressed="${sortMode === "suit"}">Suit</button>
                    <button class="segment ${sortMode === "number" ? "active" : ""}" data-sort="number" aria-pressed="${sortMode === "number"}">Number</button>
                  </div>
                  <div class="play-actions">
                    <button id="layDownBtn" ${!isMyTurn || state.mustDraw || me.laidDown || groups.length === 0 ? "disabled" : ""}>Lay Down</button>
                    <button class="danger" id="discardBtn" ${!isMyTurn || state.mustDraw || selected.size !== 1 ? "disabled" : ""}>Discard</button>
                  </div>
                </div>
              </div>
              ${targetMeldId ? `<div class="add-mode-note">Choose a highlighted card to add to that meld.</div>` : ""}
              <div class="cards hand-cards" style="--count:${availableHand.length}">
                ${availableHand.map((card, index) => renderCard(card, selected.has(card.id), true, index, availableHand.length, addableCards.has(card.id), passiveAddableCards.has(card.id))).join("")}
              </div>
              <div class="prep-tray">
                <div class="group-builder">
                  <button class="secondary" id="addGroup" ${selected.size === 0 ? "disabled" : ""}>Make Group</button>
                  <button class="secondary" id="clearGroups" ${groups.length === 0 ? "disabled" : ""}>Clear</button>
                </div>
                <div class="pending-groups">${groups.length ? groups.map(renderPendingGroup).join("") : `<span class="small empty-prep">Select cards, make groups, then lay down.</span>`}</div>
              </div>
            </div>
          </div>
        </section>

        <aside class="panel">
          <h2>Contracts</h2>
          <div class="contracts">${state.contracts.map((contract, index) => renderContract(contract, index, me.contractIndex)).join("")}</div>
          <h3>Table Log</h3>
          <div class="log">${state.log.slice(0, 5).map((item) => `<div class="log-item">${escapeHtml(item.message)}</div>`).join("")}</div>
        </aside>
      </div>
    </section>
  `;

  byId("startBtn")?.addEventListener("click", () => send({ type: "start" }));
  byId("nextRoundBtn")?.addEventListener("click", () => send({ type: "nextRound" }));
  byId("drawStock")?.addEventListener("click", () => drawWithMotion("stock"));
  byId("drawDiscard")?.addEventListener("click", () => drawWithMotion("discard"));
  byId("addGroup")?.addEventListener("click", addSelectedGroup);
  byId("clearGroups")?.addEventListener("click", () => {
    groups = [];
    selected.clear();
    renderTable();
  });
  byId("layDownBtn")?.addEventListener("click", () => {
    send({ type: "layDown", groups });
    sendIntent();
  });
  byId("discardBtn")?.addEventListener("click", () => {
    discardWithMotion([...selected][0]);
  });
  document.querySelectorAll("[data-card]").forEach((button) => {
    button.addEventListener("click", () => toggleCard(button.dataset.card));
    button.addEventListener("mouseenter", () => sendIntent(button.dataset.card));
    button.addEventListener("mouseleave", () => sendIntent(null));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.dataset.card);
      event.dataTransfer.effectAllowed = "move";
    });
  });
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      sortMode = button.dataset.sort;
      localStorage.setItem("frustration-sort", sortMode);
      renderTable();
    });
  });
  document.querySelectorAll("[data-remove-group]").forEach((button) => {
    button.addEventListener("click", () => {
      groups.splice(Number(button.dataset.removeGroup), 1);
      selected.clear();
      sendIntent();
      renderTable();
    });
  });
  document.querySelectorAll("[data-add-to-group]").forEach((button) => {
    button.addEventListener("click", () => addSelectedToGroup(Number(button.dataset.addToGroup)));
  });
  document.querySelectorAll("[data-return-card]").forEach((button) => {
    button.addEventListener("click", () => returnCardFromGroup(Number(button.dataset.group), button.dataset.returnCard));
  });
  document.querySelectorAll("[data-drop-group]").forEach((target) => {
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
      target.classList.add("drop-ready");
    });
    target.addEventListener("dragleave", () => target.classList.remove("drop-ready"));
    target.addEventListener("drop", (event) => {
      event.preventDefault();
      target.classList.remove("drop-ready");
      addCardsToGroup(Number(target.dataset.dropGroup), [event.dataTransfer.getData("text/plain")]);
    });
  });
  document.querySelectorAll("[data-meld]").forEach((button) => {
    button.addEventListener("click", () => {
      const meld = state.melds.find((item) => item.id === button.dataset.meld);
      if (!meld) return;
      if (selected.size) {
        addSelectedCardsToMeld(meld);
        return;
      }
      targetMeldId = meld.id;
      const me = state.players.find((player) => player.id === state.you);
      const staged = groupedCardIds();
      const availableHand = sortHand(me.hand.filter((card) => !staged.has(card.id)));
      const addable = cardsAddableToTarget(availableHand);
      if (!addable.size) {
        targetMeldId = null;
        showToast("No cards in your hand fit that meld.");
        return;
      }
      showToast("Now choose a highlighted card to add.");
      renderTable();
    });
  });
  document.querySelectorAll("[data-meld-drop]").forEach((target) => {
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
      target.classList.add("drop-ready");
    });
    target.addEventListener("dragleave", () => target.classList.remove("drop-ready"));
    target.addEventListener("drop", (event) => {
      event.preventDefault();
      target.classList.remove("drop-ready");
      const cardId = event.dataTransfer.getData("text/plain");
      const meld = state.melds.find((item) => item.id === target.dataset.meldDrop);
      const cardIds = selected.has(cardId) ? [...selected] : [cardId];
      if (!meld || !canAddCardsToMeld(cardIds, meld)) {
        showToast(cardIds.length > 1 ? "Those cards do not fit this meld together." : "That card does not fit this meld.");
        return;
      }
      sendAddCardsToMeld(cardIds, meld.id);
    });
  });
  animateMovedCards(previousCardPositions);
  if (lastDrawPile) {
    requestAnimationFrame(() => playDrawArrival(lastDrawPile));
    lastDrawPile = null;
  }
}

function statusText(current) {
  if (state.status === "lobby") return "Waiting for players";
  if (state.status === "roundOver") return "Round over";
  if (state.status === "finished") return "Game finished";
  return `${current?.name || "Player"}'s turn ${state.mustDraw ? "(draw)" : "(play or discard)"}`;
}

function canDraw(isMyTurn) {
  return state.status === "playing" && isMyTurn && state.mustDraw;
}

function renderPlayer(player) {
  const contract = state.contracts[player.contractIndex]?.label || "Complete";
  return `
    <div class="player ${player.id === state.currentPlayerId ? "current" : ""}">
      <div class="player-name"><span>${escapeHtml(player.name)}</span><span>${player.handCount}</span></div>
      <div class="small">${player.isHost ? "Host &middot; " : ""}${player.connected ? "Online" : "Disconnected"} &middot; Score ${player.score}</div>
      <div class="small">${contract}${player.laidDown ? " &middot; down" : ""}</div>
    </div>
  `;
}

function renderOpponentSeat(player, index, total) {
  const intent = player.tableIntent || {};
  const selected = new Set(intent.selectedIndices || []);
  const melds = state.melds.filter((meld) => meld.ownerId === player.id);
  const cards = Array.from({ length: player.handCount }, (_, cardIndex) => {
    const isActive = selected.has(cardIndex) || intent.hoverIndex === cardIndex;
    return renderCardBack(cardIndex, player.handCount, isActive);
  });
  return `
    <div class="opponent-seat seat-${index} ${player.id === state.currentPlayerId ? "current" : ""}" style="--seat-count:${total}">
      <div class="opponent-name">${escapeHtml(player.name)}</div>
      <div class="opponent-hand" style="--count:${player.handCount}">
        ${cards.join("")}
      </div>
      ${melds.length ? `<div class="seat-melds">${melds.map(renderMeld).join("")}</div>` : ""}
      <div class="small">${player.handCount} cards</div>
    </div>
  `;
}

function renderMeld(meld) {
  const addLabel = selected.size ? `Add ${selected.size}` : "Add";
  return `
    <div class="meld" data-meld-drop="${meld.id}">
      <div class="meld-head">
        <span>${meld.type}</span>
        <button class="secondary mini ${targetMeldId === meld.id ? "active-add" : ""}" data-meld="${meld.id}">${addLabel}</button>
      </div>
      <div class="cards stacked-cards">${meld.cards.map((card) => renderCard(card, false, false)).join("")}</div>
    </div>
  `;
}

function renderCard(card, isSelected = false, interactive = false, index = 0, count = 1, canAdd = false, canAddSoft = false) {
  const red = card.suit === "hearts" || card.suit === "diamonds";
  const suit = suitSymbol(card.suit);
  const rank = card.rank;
  const content = `${card.rank} ${card.suit}${card.wild ? " wild" : ""}`;
  const middle = (count - 1) / 2;
  const angle = ((index - middle) * 2.4).toFixed(2);
  const arc = (Math.abs(index - middle) * 2).toFixed(1);
  const style = `--angle:${angle}deg;--arc:${arc}px;--z:${index + 1};`;
  const addHint = canAdd ? " can be added to the selected meld" : canAddSoft ? " can be added to a meld" : "";
  const className = `card ${red ? "red" : ""} ${card.wild ? "wild-card" : ""} ${isSelected ? "selected" : ""} ${canAdd ? "can-add" : ""} ${canAddSoft ? "can-add-soft" : ""}`;
  const rankMarkup = card.wild ? `<span>${rank}</span><small>Wild</small>` : `<span>${rank}</span>`;
  const face = `
    <span class="corner top">${rankMarkup}<span>${suit}</span></span>
    <span class="pip">${suit}</span>
    <span class="corner bottom">${rankMarkup}<span>${suit}</span></span>
  `;
  if (!interactive) return `<span class="${className}" aria-label="${content}${addHint}">${face}</span>`;
  return `<button class="${className}" style="${style}" data-card="${card.id}" draggable="true" aria-pressed="${isSelected}" aria-label="${isSelected ? "Selected" : "Select"} ${content}${addHint}">${face}</button>`;
}

function renderCardBack(index, count, isActive = false) {
  const middle = (count - 1) / 2;
  const angle = ((index - middle) * 1.7).toFixed(2);
  const arc = (Math.abs(index - middle) * 1.4).toFixed(1);
  return `<span class="card-back ${isActive ? "active" : ""}" style="--angle:${angle}deg;--arc:${arc}px;--z:${index + 1};"></span>`;
}

function renderDiscardPile() {
  if (!state.topDiscard) return `<span class="discard-stack"><span class="empty-discard">Discard</span></span>`;
  const backCount = Math.min(Math.max(state.discardCount - 1, 0), 4);
  const backs = Array.from({ length: backCount }, (_, index) => `<span class="discard-back layer-${index}"></span>`).join("");
  return `
    <span class="discard-stack built">
      ${backs}
      ${renderCard(state.topDiscard, false, false)}
    </span>
  `;
}

function renderPendingGroup(group, index) {
  const me = state.players.find((player) => player.id === state.you);
  const hand = new Map(me.hand.map((card) => [card.id, card]));
  const cards = sortGroupCards(group.cards.map((id) => hand.get(id)).filter(Boolean));
  const hint = pendingGroupHint(cards);
  return `
    <div class="pending-group mini-hand-group ${hint.ok ? "valid-group" : "invalid-group"}" data-drop-group="${index}">
      <div class="pending-head">
        <strong>${index + 1}. ${describePendingGroup(cards)}</strong>
        <button class="secondary mini return-all" data-remove-group="${index}" aria-label="Return all cards from group ${index + 1}">Return</button>
      </div>
      <div class="cards staged-cards mini-hand">${cards.map((card) => renderStagedCard(card, index)).join("")}</div>
      <div class="group-hint">${hint.text}</div>
      <button class="secondary mini add-to-mini" data-add-to-group="${index}" ${selected.size === 0 ? "disabled" : ""}>Add</button>
    </div>
  `;
}

function renderStagedCard(card, groupIndex) {
  return `
    <span class="staged-card-wrap">
      ${renderCard(card, false, false)}
      <button class="return-card" data-group="${groupIndex}" data-return-card="${card.id}" aria-label="Return ${cardLabel(card)} to hand">&#8617;</button>
    </span>
  `;
}

function describePendingGroup(cards) {
  const possible = [];
  if (looksLikeSet(cards)) possible.push("set");
  if (currentContractNeedsColorRun()) {
    if (looksLikeColorRun(cards)) possible.push("black/red run");
  } else if (looksLikeRun(cards)) {
    possible.push("run");
  }
  return possible.length ? possible.join(" / ") : "group";
}

function pendingGroupHint(cards) {
  if (!cards.length) return { ok: false, text: "Add cards" };
  if (looksLikeSet(cards)) return { ok: true, text: "Can count as a set" };
  if (currentContractNeedsColorRun()) {
    if (looksLikeColorRun(cards)) return { ok: true, text: "Can count as a black/red run" };
    if (looksLikeRun(cards)) return { ok: false, text: "Run needs all black or all red" };
  }
  if (looksLikeRun(cards)) return { ok: true, text: "Can count as a run" };
  const natural = cards.filter((card) => !card.wild);
  const values = [...new Set(natural.map((card) => card.value))].sort((a, b) => a - b);
  if (values.length !== natural.length) {
    return { ok: false, text: "Run has duplicate numbers" };
  }
  return { ok: false, text: "Not a set or run" };
}

function looksLikeSet(cards) {
  if (!hasEnoughNaturals(cards)) return false;
  const natural = cards.filter((card) => !card.wild);
  if (!natural.length) return false;
  return natural.every((card) => card.rank === natural[0].rank);
}

function looksLikeRun(cards) {
  return validRun(cards, "any");
}

function looksLikeColorRun(cards) {
  return validRun(cards, "color");
}

function validRun(cards, mode) {
  if (!hasEnoughNaturals(cards)) return false;
  const natural = cards.filter((card) => !card.wild);
  if (!natural.length) return false;
  if (mode === "color") {
    const colors = new Set(natural.map(cardColor));
    if (colors.size > 1) return false;
  }
  const values = [...new Set(natural.map((card) => card.value))].sort((a, b) => a - b);
  if (values.length !== natural.length) return false;
  const wildCount = cards.length - natural.length;
  for (let start = 1; start <= 14 - cards.length; start += 1) {
    let missing = 0;
    for (let value = start; value < start + cards.length; value += 1) {
      if (!values.includes(value)) missing += 1;
    }
    if (missing <= wildCount) return true;
  }
  return false;
}

function hasEnoughNaturals(cards) {
  const naturalCount = cards.filter((card) => !card.wild).length;
  const wildCount = cards.length - naturalCount;
  if (cards.length === 2) return naturalCount >= 1;
  return naturalCount > wildCount;
}

function cardColor(card) {
  return card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
}

function currentContractNeedsColorRun() {
  const me = state?.players?.find((player) => player.id === state.you);
  const label = state?.contracts?.[me?.contractIndex]?.label || "";
  return label.includes("black or all red");
}

function couldBeRunByValue(cards) {
  const natural = cards.filter((card) => !card.wild);
  if (!natural.length) return cards.length > 0;
  const values = [...new Set(natural.map((card) => card.value))].sort((a, b) => a - b);
  if (values.length !== natural.length) return false;
  const wildCount = cards.length - natural.length;
  for (let start = 1; start <= 14 - cards.length; start += 1) {
    let missing = 0;
    for (let value = start; value < start + cards.length; value += 1) {
      if (!values.includes(value)) missing += 1;
    }
    if (missing <= wildCount) return true;
  }
  return false;
}

function cardsAddableToTarget(hand) {
  const addable = new Set();
  const meld = state.melds.find((item) => item.id === targetMeldId);
  if (!meld) return addable;
  hand.forEach((card) => {
    if (canAddCardToMeld(card, meld)) addable.add(card.id);
  });
  return addable;
}

function cardsAddableToAnyMeld(hand) {
  const addable = new Set();
  hand.forEach((card) => {
    if (state.melds.some((meld) => canAddCardToMeld(card, meld))) addable.add(card.id);
  });
  return addable;
}

function addSelectedCardsToMeld(meld) {
  const cardIds = [...selected];
  if (!canAddCardsToMeld(cardIds, meld)) {
    showToast(cardIds.length > 1 ? "Those cards do not fit this meld together." : "That card does not fit this meld.");
    return;
  }
  sendAddCardsToMeld(cardIds, meld.id);
}

function sendAddCardsToMeld(cardIds, meldId) {
  send({ type: "addCardsToMeld", cardIds, meldId });
  targetMeldId = null;
  selected.clear();
  sendIntent();
}

function canAddCardToMeld(card, meld) {
  return isValidGroup({ type: meld.type, mode: meld.mode, cards: [...meld.cards, card] });
}

function canAddCardsToMeld(cardIds, meld) {
  const uniqueIds = [...new Set(cardIds)];
  const cards = uniqueIds.map(getMyCard);
  if (!meld || !cards.length || cards.some((card) => !card)) return false;
  return isValidGroup({ type: meld.type, mode: meld.mode, cards: [...meld.cards, ...cards] });
}

function getMyCard(cardId) {
  const me = state.players.find((player) => player.id === state.you);
  return me?.hand?.find((card) => card.id === cardId);
}

function isValidGroup(group) {
  if (group.type === "set") return looksLikeSet(group.cards);
  return group.mode === "color" ? looksLikeColorRun(group.cards) : looksLikeRun(group.cards);
}

function renderContract(contract, index, active) {
  return `<div class="contract-row ${index === active ? "active" : ""}">${index + 1}. ${contract.label}</div>`;
}

function addSelectedGroup() {
  const me = state.players.find((player) => player.id === state.you);
  const hand = new Map(me.hand.map((card) => [card.id, card]));
  const sortedCards = sortGroupCards([...selected].map((id) => hand.get(id)).filter(Boolean));
  groups.push({
    type: "auto",
    cards: sortedCards.map((card) => card.id)
  });
  selected.clear();
  sendIntent();
  renderTable();
}

function addSelectedToGroup(groupIndex) {
  addCardsToGroup(groupIndex, [...selected]);
}

function addCardsToGroup(groupIndex, cardIds) {
  const group = groups[groupIndex];
  if (!group) return;
  const alreadyGrouped = groupedCardIds();
  const additions = cardIds.filter((id) => id && !alreadyGrouped.has(id));
  if (!additions.length) return;
  group.cards.push(...additions);
  group.cards = sortGroupCardIds(group.cards);
  additions.forEach((id) => selected.delete(id));
  sendIntent();
  renderTable();
}

function returnCardFromGroup(groupIndex, cardId) {
  const group = groups[groupIndex];
  if (!group) return;
  group.cards = group.cards.filter((id) => id !== cardId);
  if (group.cards.length === 0) groups.splice(groupIndex, 1);
  selected.delete(cardId);
  sendIntent();
  renderTable();
}

function sortGroupCardIds(cardIds) {
  const me = state.players.find((player) => player.id === state.you);
  const hand = new Map(me.hand.map((card) => [card.id, card]));
  return sortGroupCards(cardIds.map((id) => hand.get(id)).filter(Boolean)).map((card) => card.id);
}

function sortGroupCards(cards) {
  const type = inferGroupType(cards);
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

function inferGroupType(cards) {
  if (currentContractNeedsColorRun() && looksLikeColorRun(cards) && !looksLikeSet(cards)) return "run";
  const isRun = looksLikeRun(cards);
  const isSet = looksLikeSet(cards);
  if (isRun && !isSet) return "run";
  if (isSet && !isRun) return "set";
  if (isRun) return "run";
  return "set";
}

function toggleCard(id) {
  if (targetMeldId) {
    const me = state.players.find((player) => player.id === state.you);
    const card = me?.hand?.find((item) => item.id === id);
    const meld = state.melds.find((item) => item.id === targetMeldId);
    if (card && meld && canAddCardToMeld(card, meld)) {
      send({ type: "addToMeld", cardId: id, meldId: targetMeldId });
      targetMeldId = null;
      selected.clear();
      return;
    }
    showToast("That card does not fit the selected meld.");
    return;
  }
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  sendIntent(id);
  renderTable();
}

function groupedCardIds() {
  return new Set(groups.flatMap((group) => group.cards));
}

function drawWithMotion(pile) {
  lastDrawPile = pile;
  const button = byId(pile === "discard" ? "drawDiscard" : "drawStock");
  button?.classList.add("drawing");
  if (button) button.disabled = true;
  playDrawDeparture(button);
  window.setTimeout(() => send({ type: "draw", pile }), 120);
}

function discardWithMotion(cardId) {
  const card = document.querySelector(`[data-card="${cardId}"]`);
  selected.clear();
  sendIntent();
  playDiscardDeparture(card);
  window.setTimeout(() => send({ type: "discard", cardId }), 160);
}

function sortHand(hand) {
  const suitOrder = { hearts: 0, diamonds: 1, clubs: 2, spades: 3, joker: 4 };
  const sorted = hand.slice();
  sorted.sort((a, b) => {
    if (sortMode === "number") {
      return a.value - b.value || suitOrder[a.suit] - suitOrder[b.suit] || a.label.localeCompare(b.label);
    }
    return suitOrder[a.suit] - suitOrder[b.suit] || a.value - b.value || a.label.localeCompare(b.label);
  });
  return sorted;
}

function sendIntent(hoverCardId = null) {
  if (!state) return;
  window.clearTimeout(intentTimer);
  intentTimer = window.setTimeout(() => {
    const me = state.players.find((player) => player.id === state.you);
    if (!me?.hand) return;
    const staged = groupedCardIds();
    const availableHand = sortHand(me.hand.filter((card) => !staged.has(card.id)));
    const indexById = new Map(availableHand.map((card, index) => [card.id, index]));
    send({
      type: "intent",
      hoverIndex: hoverCardId && indexById.has(hoverCardId) ? indexById.get(hoverCardId) : null,
      selectedIndices: [...selected].map((id) => indexById.get(id)).filter(Number.isInteger)
    });
  }, 40);
}

function captureCardPositions() {
  const positions = new Map();
  document.querySelectorAll(".hand-cards [data-card]").forEach((card) => {
    positions.set(card.dataset.card, card.getBoundingClientRect());
  });
  return positions;
}

function animateMovedCards(previousPositions) {
  if (prefersReducedMotion()) return;
  if (!previousPositions.size) return;
  document.querySelectorAll(".hand-cards [data-card]").forEach((card) => {
    const previous = previousPositions.get(card.dataset.card);
    if (!previous) return;
    const next = card.getBoundingClientRect();
    const dx = previous.left - next.left;
    const dy = previous.top - next.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    card.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(var(--angle))` },
        { transform: "" }
      ],
      { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" }
    );
  });
}

function playDrawDeparture(source) {
  if (prefersReducedMotion()) return;
  if (!source) return;
  const from = source.getBoundingClientRect();
  const to = document.querySelector(".hand-cards")?.getBoundingClientRect();
  if (!to) return;
  const ghost = document.createElement("div");
  ghost.className = "draw-ghost";
  ghost.style.left = `${from.left + from.width / 2 - 28}px`;
  ghost.style.top = `${from.top + from.height / 2 - 39}px`;
  document.body.appendChild(ghost);
  ghost.animate(
    [
      { transform: "translate(0, 0) scale(0.85) rotate(-4deg)", opacity: 0.9 },
      { transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + 22 - from.top - from.height / 2}px) scale(1) rotate(5deg)`, opacity: 0 }
    ],
    { duration: 430, easing: "cubic-bezier(.2,.75,.25,1)" }
  ).addEventListener("finish", () => ghost.remove());
}

function playDrawArrival() {
  if (prefersReducedMotion()) return;
  const cards = document.querySelectorAll(".hand-cards [data-card]");
  const card = cards[cards.length - 1];
  if (!card) return;
  card.classList.add("arrived");
  window.setTimeout(() => card.classList.remove("arrived"), 520);
}

function playDiscardDeparture(card) {
  if (prefersReducedMotion()) return;
  const to = byId("drawDiscard")?.getBoundingClientRect();
  if (!card || !to) return;
  const from = card.getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.classList.add("discard-ghost");
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  document.body.appendChild(ghost);
  ghost.animate(
    [
      { transform: "translate(0, 0) rotate(var(--angle, 0deg))", opacity: 1 },
      { transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) rotate(8deg) scale(0.92)`, opacity: 0.2 }
    ],
    { duration: 420, easing: "cubic-bezier(.2,.75,.25,1)" }
  ).addEventListener("finish", () => ghost.remove());
}

function suitSymbol(suit) {
  return { hearts: "&hearts;", diamonds: "&diams;", clubs: "&clubs;", spades: "&spades;" }[suit] || "";
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function byId(id) {
  return document.getElementById(id);
}

function cardLabel(card) {
  return card?.label || "";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

