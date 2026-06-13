const rarityData = {
  common: { label: "Common", color: "#4aa3ff", value: 3, stat: 1 },
  rare: { label: "Rare", color: "#a46cff", value: 5, stat: 2 },
  legendary: { label: "Legendary", color: "#f1c44e", value: 9, stat: 4 },
  eternal: { label: "Eternal", color: "#b9fff4", value: 14, stat: 6 }
};

const names = [
  "Moss Templar", "Pickle Squire", "Button Witch", "Fog Drummer", "Glass Knight",
  "Juniper Monk", "Tiny Count", "Cinder Courier", "Marble Imp", "Turnip Bard",
  "Velvet Sneak", "Puddle Oracle", "Quartz Cook", "Gumdrop Guard", "Mirth Miner",
  "Copper Jester", "Saffron Smith", "Moonlit Clerk", "Brisk Herald", "Lantern Duke"
];

const enemyNames = [
  "Cracked Helm", "Bog Nipper", "Spite Lantern", "Hungry Barrel", "Ash Goblet",
  "Bristle Mite", "Oathless Pawn", "Moldy Banner", "Tin Warden", "Crooked Mask"
];

const traits = [
  "First strike: acts early in every clash.",
  "Bulwark: carries extra HP into battle.",
  "Snack pact: gives Lordoran +1 attack when hired.",
  "Backline zap: clips the last foe after attacking.",
  "Lucky paws: improves post-fight coin rewards.",
  "Medic: heals the weakest ally after a win.",
  "Brawler: gains attack when surviving a hit.",
  "Collector: adds a reroll coin after rewards."
];

const routeTemplates = [
  { type: "fight", label: "Skirmish", title: "Crooked Path", detail: "A fair fight with normal coin and recruit rewards." },
  { type: "fight", label: "Skirmish", title: "Lantern Road", detail: "A balanced encounter and a clean branch onward." },
  { type: "elite", label: "Elite", title: "Hard Zone", detail: "Tougher enemies, better coin payout, stronger reward odds." },
  { type: "shop", label: "Shop", title: "Pocket Market", detail: "Spend coins on buffs, healing, and fresh recruits." },
  { type: "mystery", label: "Event", title: "Odd Door", detail: "A strange stop that may pay out or turn dangerous." }
];

const state = {
  stage: 1,
  coins: 10,
  threat: 1,
  phase: "route",
  team: [],
  enemies: [],
  routes: [],
  rewards: [],
  shop: [],
  log: [],
  seed: Math.floor(Math.random() * 1000000)
};

const els = {
  stageText: document.querySelector("#stageText"),
  coinText: document.querySelector("#coinText"),
  threatText: document.querySelector("#threatText"),
  teamCount: document.querySelector("#teamCount"),
  teamList: document.querySelector("#teamList"),
  allyBoard: document.querySelector("#allyBoard"),
  enemyBoard: document.querySelector("#enemyBoard"),
  phaseTitle: document.querySelector("#phaseTitle"),
  routeChoices: document.querySelector("#routeChoices"),
  rewardChoices: document.querySelector("#rewardChoices"),
  shopPanel: document.querySelector("#shopPanel"),
  battleLog: document.querySelector("#battleLog"),
  newRunButton: document.querySelector("#newRunButton"),
  lordoranBadge: document.querySelector("#lordoranBadge"),
  unitTemplate: document.querySelector("#unitCardTemplate")
};

function makeLordoran() {
  return {
    id: crypto.randomUUID(),
    name: "Lordoran",
    rarity: "eternal",
    trait: "Main character: cannot be sold and grows rounder with every win.",
    hp: 18,
    maxHp: 18,
    atk: 4,
    spd: 2,
    seed: 777,
    type: "lordoran",
    locked: true
  };
}

function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick(list, rnd = Math.random) {
  return list[Math.floor(rnd() * list.length)];
}

function rarityOdds(stage, bonus = 0) {
  const lift = Math.min(18, stage * 1.35 + bonus);
  return [
    { rarity: "eternal", chance: Math.min(1.5 + lift * 0.12, 7) },
    { rarity: "legendary", chance: Math.min(5 + lift * 0.45, 22) },
    { rarity: "rare", chance: Math.min(22 + lift * 0.9, 48) },
    { rarity: "common", chance: 100 }
  ];
}

function rollRarity(stage, bonus = 0, rnd = Math.random) {
  const roll = rnd() * 100;
  let running = 0;
  for (const entry of rarityOdds(stage, bonus)) {
    running += entry.chance;
    if (roll <= running) return entry.rarity;
  }
  return "common";
}

function makeHero(stage = state.stage, bonus = 0) {
  const seed = Math.floor(Math.random() * 9999999);
  const rnd = mulberry32(seed);
  const rarity = rollRarity(stage, bonus, rnd);
  const stat = rarityData[rarity].stat;
  const speedBias = Math.floor(rnd() * 3);
  const maxHp = 6 + stage + stat * 2 + Math.floor(rnd() * 5);
  return {
    id: crypto.randomUUID(),
    name: pick(names, rnd),
    rarity,
    trait: pick(traits, rnd),
    hp: maxHp,
    maxHp,
    atk: 2 + Math.floor(stage / 2) + stat + Math.floor(rnd() * 3),
    spd: 1 + speedBias + Math.floor(stat / 2),
    seed,
    type: "hero"
  };
}

function makeEnemy(stage, elite = false) {
  const seed = Math.floor(Math.random() * 9999999);
  const rnd = mulberry32(seed);
  const boost = elite ? 3 : 0;
  const hp = 5 + stage * 2 + boost + Math.floor(rnd() * (3 + stage));
  return {
    id: crypto.randomUUID(),
    name: pick(enemyNames, rnd),
    rarity: elite ? "rare" : "common",
    trait: elite ? "Elite pressure." : "Stage threat.",
    hp,
    maxHp: hp,
    atk: 2 + Math.ceil(stage * 0.8) + boost + Math.floor(rnd() * 2),
    spd: 1 + Math.floor(rnd() * 4) + (elite ? 1 : 0),
    seed,
    type: "enemy"
  };
}

function cloneUnit(unit) {
  return { ...unit };
}

function healTeam(full = true) {
  state.team.forEach((unit) => {
    unit.maxHp = Math.max(unit.maxHp, unit.hp, 1);
    unit.hp = full ? unit.maxHp : Math.min(unit.maxHp, unit.hp + 4);
  });
}

function generateRoutes() {
  const pool = [...routeTemplates];
  const routes = [];
  while (routes.length < 3) {
    const index = Math.floor(Math.random() * pool.length);
    const route = pool.splice(index, 1)[0];
    routes.push({ ...route, id: crypto.randomUUID() });
  }
  if (!routes.some((route) => route.type === "fight" || route.type === "elite")) {
    routes[0] = { ...routeTemplates[0], id: crypto.randomUUID() };
  }
  state.routes = routes;
}

function startRoute(route) {
  state.routes = [];
  clearChoices();
  if (route.type === "shop") {
    openShop();
    return;
  }
  if (route.type === "mystery") {
    runMystery();
    return;
  }
  startBattle(route.type === "elite");
}

function startBattle(elite = false) {
  state.phase = "battle";
  const count = Math.min(5, 2 + Math.floor(state.stage / 2) + (elite ? 1 : 0));
  state.enemies = Array.from({ length: count }, () => makeEnemy(state.stage + state.threat, elite));
  state.log = [`Stage ${state.stage}: ${elite ? "Elite zone" : "Skirmish"} begins.`];
  render();
  window.setTimeout(() => resolveBattle(elite), 420);
}

function resolveBattle(elite = false) {
  const allies = state.team.map(cloneUnit);
  const enemies = state.enemies.map(cloneUnit);
  let round = 1;
  const log = [...state.log];

  while (living(allies).length && living(enemies).length && round < 30) {
    const actors = [...living(allies).map((unit) => ({ unit, side: "ally" })), ...living(enemies).map((unit) => ({ unit, side: "enemy" }))]
      .sort((a, b) => b.unit.spd - a.unit.spd || b.unit.atk - a.unit.atk);

    log.push(`Round ${round}`);
    for (const actor of actors) {
      if (actor.unit.hp <= 0) continue;
      const targets = actor.side === "ally" ? living(enemies) : living(allies);
      if (!targets.length) break;
      const target = targets[0];
      target.hp -= actor.unit.atk;
      log.push(`${actor.unit.name} hits ${target.name} for ${actor.unit.atk}.`);
      if (target.hp <= 0) {
        log.push(`${target.name} falls.`);
      }

      if (actor.unit.trait.includes("Backline") && targets.length > 1) {
        const back = targets[targets.length - 1];
        if (back !== target) {
          back.hp -= 1;
          log.push(`${actor.unit.name} zaps ${back.name}.`);
        }
      }
      if (actor.unit.trait.includes("Brawler") && actor.unit.hp > 0) {
        actor.unit.atk += 1;
      }
    }
    round += 1;
  }

  const won = living(allies).length > 0;
  state.enemies = enemies;
  state.team.forEach((unit) => {
    const after = allies.find((ally) => ally.id === unit.id);
    unit.hp = Math.max(1, after ? after.hp : 1);
  });

  if (won) {
    const bonusCoins = state.team.filter((unit) => unit.trait.includes("Lucky")).length;
    const coins = 5 + state.stage + (elite ? 6 : 0) + bonusCoins;
    state.coins += coins;
    state.threat += elite ? 2 : 1;
    state.team[0].maxHp += 1;
    state.team[0].hp = state.team[0].maxHp;
    state.team[0].atk += state.stage % 2 === 0 ? 1 : 0;
    state.team.forEach((unit) => {
      if (unit.trait.includes("Medic")) healWeakest(3);
    });
    log.push(`Victory. The squad pockets ${coins} coins.`);
    state.log = log.slice(-18);
    openRewards(elite ? 7 : 0);
  } else {
    log.push("Defeat. Lordoran retreats, bruised but indignant.");
    state.log = log.slice(-18);
    state.coins = Math.max(0, state.coins - 4);
    healTeam(false);
    state.phase = "route";
    generateRoutes();
  }
  render();
}

function living(units) {
  return units.filter((unit) => unit.hp > 0);
}

function healWeakest(amount) {
  const target = [...state.team].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (target) target.hp = Math.min(target.maxHp, target.hp + amount);
}

function openRewards(bonus = 0) {
  state.phase = "reward";
  healTeam(false);
  state.rewards = Array.from({ length: 3 }, () => makeHero(state.stage, bonus));
}

function recruit(hero) {
  if (state.team.length >= 5) {
    addLog("Team is full. Sell a member first.");
    return;
  }
  state.team.push(hero);
  applyHireTrait(hero);
  state.rewards = state.rewards.filter((reward) => reward.id !== hero.id);
  addLog(`${hero.name} joins Lordoran.`);
  continueRun();
}

function applyHireTrait(hero) {
  if (hero.trait.includes("Snack")) {
    state.team[0].atk += 1;
    addLog("Lordoran accepts a snack pact and gains +1 attack.");
  }
  if (hero.trait.includes("Collector")) {
    state.coins += 1;
  }
}

function sell(unitId) {
  const unit = state.team.find((member) => member.id === unitId);
  if (!unit || unit.locked) return;
  state.coins += rarityData[unit.rarity].value;
  state.team = state.team.filter((member) => member.id !== unitId);
  addLog(`${unit.name} leaves for ${rarityData[unit.rarity].value} coins.`);
  render();
}

function continueRun() {
  state.stage += 1;
  state.phase = "route";
  state.rewards = [];
  state.shop = [];
  healTeam(true);
  generateRoutes();
  render();
}

function openShop() {
  state.phase = "shop";
  state.shop = [
    { id: "heal", title: "Warm Saucer", detail: "Heal the full team.", cost: 5, action: () => healTeam(true) },
    { id: "buff", title: "Polished Button", detail: "Give a random ally +2 attack and +2 HP.", cost: 8, action: buffRandom },
    { id: "hire", title: "Stray Contract", detail: "Add a recruit rolled at shop odds.", cost: 10, action: hireFromShop }
  ];
  state.log = [`A market appears between branches.`];
  render();
}

function buy(item) {
  if (state.coins < item.cost) {
    addLog("Not enough coins.");
    return;
  }
  if (item.id === "hire" && state.team.length >= 5) {
    addLog("Team is full. Sell a member first.");
    return;
  }
  state.coins -= item.cost;
  item.action();
  addLog(`${item.title} purchased.`);
  render();
}

function buffRandom() {
  const target = pick(state.team);
  target.atk += 2;
  target.maxHp += 2;
  target.hp += 2;
}

function hireFromShop() {
  const hero = makeHero(state.stage, 4);
  state.team.push(hero);
  applyHireTrait(hero);
}

function leaveShop() {
  state.stage += 1;
  state.phase = "route";
  state.shop = [];
  generateRoutes();
  render();
}

function runMystery() {
  const roll = Math.random();
  if (roll < 0.34) {
    const coins = 7 + state.stage;
    state.coins += coins;
    state.stage += 1;
    state.phase = "route";
    generateRoutes();
    state.log = [`Lordoran found a jingling shrine. +${coins} coins.`];
    render();
    return;
  }
  if (roll < 0.68) {
    state.log = ["A soft bell calls a wanderer to the party."];
    openRewards(4);
    render();
    return;
  }
  state.log = ["The odd door was absolutely a trap."];
  startBattle(true);
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 18);
}

function clearChoices() {
  els.routeChoices.innerHTML = "";
}

function render() {
  els.stageText.textContent = state.stage;
  els.coinText.textContent = state.coins;
  els.threatText.textContent = state.threat;
  els.teamCount.textContent = `${state.team.length}/5`;
  renderTeam();
  renderBoard();
  renderPhase();
  renderLog();
  drawLordoran(els.lordoranBadge, 777);
}

function renderTeam() {
  els.teamList.innerHTML = "";
  state.team.forEach((unit) => {
    const card = makeUnitCard(unit);
    if (!unit.locked && ["reward", "shop"].includes(state.phase)) {
      const button = document.createElement("button");
      button.className = "sell-btn";
      button.type = "button";
      button.textContent = `Sell for ${rarityData[unit.rarity].value}`;
      button.addEventListener("click", () => sell(unit.id));
      card.append(button);
    }
    els.teamList.append(card);
  });
}

function renderBoard() {
  els.allyBoard.innerHTML = "";
  els.enemyBoard.innerHTML = "";
  state.team.forEach((unit) => els.allyBoard.append(makeFighter(unit)));
  const enemies = state.enemies.length ? state.enemies : previewEnemies();
  enemies.forEach((unit) => els.enemyBoard.append(makeFighter(unit)));
}

function previewEnemies() {
  if (state.phase !== "route") return [];
  return Array.from({ length: Math.min(4, 2 + Math.floor(state.stage / 2)) }, (_, index) => ({
    ...makeEnemy(state.stage + state.threat, false),
    id: `preview-${index}`
  }));
}

function renderPhase() {
  els.routeChoices.classList.toggle("is-hidden", state.phase !== "route");
  els.rewardChoices.classList.toggle("is-hidden", state.phase !== "reward");
  els.shopPanel.classList.toggle("is-hidden", state.phase !== "shop");

  if (state.phase === "route") {
    els.phaseTitle.textContent = "Choose a Route";
    renderRoutes();
  } else if (state.phase === "reward") {
    els.phaseTitle.textContent = "Recruit Reward";
    renderRewards();
  } else if (state.phase === "shop") {
    els.phaseTitle.textContent = "Pocket Market";
    renderShop();
  } else {
    els.phaseTitle.textContent = "Auto Battle";
  }
}

function renderRoutes() {
  els.routeChoices.innerHTML = "";
  state.routes.forEach((route) => {
    const button = document.createElement("button");
    button.className = `route-card ${route.type}`;
    button.type = "button";
    button.innerHTML = `<span class="route-kind">${route.label}</span><strong>${route.title}</strong><p>${route.detail}</p>`;
    button.addEventListener("click", () => startRoute(route));
    els.routeChoices.append(button);
  });
}

function renderRewards() {
  els.rewardChoices.innerHTML = "";
  state.rewards.forEach((hero) => {
    const wrap = document.createElement("div");
    wrap.className = "reward-card";
    wrap.append(makeUnitCard(hero));
    const button = document.createElement("button");
    button.className = "primary-btn";
    button.type = "button";
    button.disabled = state.team.length >= 5;
    button.textContent = state.team.length >= 5 ? "Sell a member first" : "Recruit";
    button.addEventListener("click", () => recruit(hero));
    wrap.append(button);
    els.rewardChoices.append(wrap);
  });

  const skip = document.createElement("button");
  skip.className = "primary-btn gold";
  skip.type = "button";
  skip.textContent = "Take 3 Coins";
  skip.addEventListener("click", () => {
    state.coins += 3;
    continueRun();
  });
  els.rewardChoices.append(skip);
}

function renderShop() {
  els.shopPanel.innerHTML = "";
  state.shop.forEach((item) => {
    const button = document.createElement("button");
    button.className = "shop-card";
    button.type = "button";
    button.disabled = state.coins < item.cost || (item.id === "hire" && state.team.length >= 5);
    button.innerHTML = `<strong>${item.title}</strong><p>${item.detail}</p><div class="stat-row"><span>${item.cost} coins</span></div>`;
    button.addEventListener("click", () => buy(item));
    els.shopPanel.append(button);
  });

  const leave = document.createElement("button");
  leave.className = "primary-btn";
  leave.type = "button";
  leave.textContent = "Leave Shop";
  leave.addEventListener("click", leaveShop);
  els.shopPanel.append(leave);
}

function renderLog() {
  els.battleLog.innerHTML = "";
  state.log.slice(0, 14).forEach((entry) => {
    const p = document.createElement("p");
    p.textContent = entry;
    els.battleLog.append(p);
  });
}

function makeUnitCard(unit) {
  const node = els.unitTemplate.content.firstElementChild.cloneNode(true);
  node.classList.add(unit.rarity);
  node.querySelector("h3").textContent = unit.name;
  node.querySelector(".rarity-pill").textContent = rarityData[unit.rarity].label;
  node.querySelector(".trait").textContent = unit.trait;
  node.querySelector(".hp").textContent = `HP ${Math.max(0, unit.hp)}/${unit.maxHp}`;
  node.querySelector(".atk").textContent = `ATK ${unit.atk}`;
  node.querySelector(".spd").textContent = `SPD ${unit.spd}`;
  drawSprite(node.querySelector("canvas"), unit);
  return node;
}

function makeFighter(unit) {
  const token = document.createElement("article");
  token.className = `fighter-token ${unit.hp <= 0 ? "defeated" : ""}`;
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  drawSprite(canvas, unit);
  const name = document.createElement("strong");
  name.textContent = unit.name;
  const hpbar = document.createElement("div");
  hpbar.className = "hpbar";
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(100, unit.hp / unit.maxHp * 100))}%`;
  hpbar.append(fill);
  const stats = document.createElement("div");
  stats.className = "token-stats";
  stats.textContent = `HP ${Math.max(0, unit.hp)}  ATK ${unit.atk}`;
  token.append(canvas, name, hpbar, stats);
  return token;
}

function drawSprite(canvas, unit) {
  if (unit.type === "lordoran") {
    drawLordoran(canvas, unit.seed);
    return;
  }
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0d1016";
  ctx.fillRect(0, 0, size, size);

  const rnd = mulberry32(unit.seed);
  const palette = unit.type === "enemy"
    ? ["#7b8496", "#d25d5d", "#e2d3a3", "#343946"]
    : [rarityData[unit.rarity].color, "#f6f2e8", "#252936", "#ffb26b"];
  const scale = size / 16;

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
  }

  const bodyColor = palette[0];
  const trim = palette[1];
  const dark = palette[2];
  const accent = palette[3];
  const hat = Math.floor(rnd() * 4);
  const width = 5 + Math.floor(rnd() * 3);
  const left = 8 - Math.floor(width / 2);

  px(left, 6, width, 7, bodyColor);
  px(left + 1, 4, width - 2, 3, trim);
  px(left, 10, width, 3, dark);
  px(left - 1, 13, 2, 1, dark);
  px(left + width - 1, 13, 2, 1, dark);
  px(left + 1, 7, 1, 1, "#0d1016");
  px(left + width - 2, 7, 1, 1, "#0d1016");
  px(left + Math.floor(width / 2), 8, 1, 1, accent);
  px(left - 1, 8, 1, 3, trim);
  px(left + width, 8, 1, 3, trim);

  if (hat === 0) px(left + 1, 2, width - 2, 2, accent);
  if (hat === 1) px(left, 3, width, 1, accent);
  if (hat === 2) {
    px(left + 1, 2, 1, 2, accent);
    px(left + width - 2, 2, 1, 2, accent);
  }
  if (hat === 3) px(left + Math.floor(width / 2), 2, 1, 2, accent);

  if (unit.type === "enemy") {
    px(left + 1, 7, 1, 1, "#ffef8f");
    px(left + width - 2, 7, 1, 1, "#ffef8f");
  }
}

function drawLordoran(canvas) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const scale = size / 16;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0d1016";
  ctx.fillRect(0, 0, size, size);

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
  }

  px(5, 2, 2, 3, "#f08c62");
  px(10, 2, 2, 3, "#f08c62");
  px(4, 4, 9, 8, "#f6a96c");
  px(3, 7, 11, 6, "#f6a96c");
  px(5, 6, 2, 1, "#11151d");
  px(10, 6, 2, 1, "#11151d");
  px(8, 7, 1, 1, "#dc6f6f");
  px(7, 8, 3, 1, "#f6f2e8");
  px(6, 10, 5, 2, "#f9c58f");
  px(2, 9, 2, 2, "#f08c62");
  px(13, 9, 2, 2, "#f08c62");
  px(5, 13, 2, 1, "#47312a");
  px(10, 13, 2, 1, "#47312a");
  px(4, 5, 1, 1, "#f6f2e8");
  px(12, 5, 1, 1, "#f6f2e8");
}

function newRun() {
  state.stage = 1;
  state.coins = 10;
  state.threat = 1;
  state.phase = "route";
  state.team = [makeLordoran()];
  state.enemies = [];
  state.rewards = [];
  state.shop = [];
  state.log = ["Lordoran begins the branchbound march."];
  generateRoutes();
  render();
}

els.newRunButton.addEventListener("click", newRun);
newRun();
