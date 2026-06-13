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
  { type: "fight", label: "Skirmish", title: "Crooked Path", detail: "Normal enemy team. Pays coins and a choice of three recruits.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "fight", label: "Skirmish", title: "Lantern Road", detail: "Balanced battle with a clean branch onward.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "fight", label: "Skirmish", title: "Moss Bridge", detail: "A direct enemy team blocks the next step.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "elite", label: "Elite", title: "Hard Zone", detail: "Stronger enemy team. Better payout and higher reward rarity odds.", coins: "+6", danger: "high", odds: "+rarity" },
  { type: "elite", label: "Elite", title: "Iron Fork", detail: "A risky route with stronger foes and better post-battle odds.", coins: "+6", danger: "high", odds: "+rarity" },
  { type: "shop", label: "Shop", title: "Pocket Market", detail: "Spend coins on healing, buffs, or another recruit.", coins: "spend", danger: "none", odds: "shop" },
  { type: "mystery", label: "Event", title: "Odd Door", detail: "May become coins, a recruit choice, or a dangerous ambush.", coins: "swingy", danger: "unknown", odds: "varies" }
];

const laneNames = ["High Road", "Upper Fork", "Lower Fork", "Deep Road"];

const state = {
  stage: 1,
  coins: 10,
  threat: 0,
  earnedCoins: 0,
  levelsCleared: 0,
  currentScore: 0,
  lastScore: null,
  phase: "route",
  team: [],
  enemies: [],
  routes: [],
  pathHistory: [],
  currentNode: "Camp",
  rewards: [],
  shop: [],
  log: [],
  combat: {
    activeId: null,
    targetId: null,
    damage: "",
    banner: "Pick a branch to begin the next fight.",
    locked: false
  },
  soundOn: true,
  audio: null,
  battleToken: 0,
  lastRewardBonus: 0,
  seed: Math.floor(Math.random() * 1000000)
};

const els = {
  stageText: document.querySelector("#stageText"),
  coinText: document.querySelector("#coinText"),
  threatText: document.querySelector("#threatText"),
  scoreText: document.querySelector("#scoreText"),
  teamCount: document.querySelector("#teamCount"),
  teamList: document.querySelector("#teamList"),
  allyBoard: document.querySelector("#allyBoard"),
  enemyBoard: document.querySelector("#enemyBoard"),
  phaseTitle: document.querySelector("#phaseTitle"),
  routeChoices: document.querySelector("#routeChoices"),
  rewardChoices: document.querySelector("#rewardChoices"),
  shopPanel: document.querySelector("#shopPanel"),
  battleLog: document.querySelector("#battleLog"),
  battleBanner: document.querySelector("#battleBanner"),
  phaseStatus: document.querySelector("#phaseStatus"),
  oddsBar: document.querySelector("#oddsBar"),
  soundButton: document.querySelector("#soundButton"),
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
  const eternal = Math.min(0.8 + lift * 0.18, 7);
  const legendary = Math.min(4 + lift * 0.58, 23);
  const rare = Math.min(18 + lift * 1.15, 48);
  const common = Math.max(100 - eternal - legendary - rare, 22);
  return [
    { rarity: "eternal", chance: eternal },
    { rarity: "legendary", chance: legendary },
    { rarity: "rare", chance: rare },
    { rarity: "common", chance: common }
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
  const trait = pick(traits, rnd);
  const maxHp = 6 + stage + stat * 2 + Math.floor(rnd() * 5) + (trait.includes("Bulwark") ? 5 : 0);
  return {
    id: crypto.randomUUID(),
    name: pick(names, rnd),
    rarity,
    trait,
    hp: maxHp,
    maxHp,
    atk: 2 + Math.floor(stage / 2) + stat + Math.floor(rnd() * 3),
    spd: 1 + speedBias + Math.floor(stat / 2) + (trait.includes("First strike") ? 3 : 0),
    seed,
    type: "hero"
  };
}

function makeEnemy(difficulty, elite = false) {
  const seed = Math.floor(Math.random() * 9999999);
  const rnd = mulberry32(seed);
  const boost = elite ? Math.max(1, Math.floor(difficulty * 0.32)) : 0;
  const hp = Math.round(4 + difficulty * 1.25 + boost * 1.4 + Math.floor(rnd() * (2 + difficulty * 0.65)));
  return {
    id: crypto.randomUUID(),
    name: pick(enemyNames, rnd),
    rarity: elite ? "rare" : "common",
    trait: elite ? "Elite pressure." : "Stage threat.",
    hp,
    maxHp: hp,
    atk: 1 + Math.floor(difficulty * 0.45) + boost + Math.floor(rnd() * 2),
    spd: 1 + Math.floor(rnd() * 3) + (elite ? 1 : 0),
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
    unit.hp = full ? unit.maxHp : Math.min(unit.maxHp, Math.max(0, unit.hp) + 4);
  });
}

function generateRoutes() {
  const specialType = rollSpecialRoute();
  const specialLane = specialType ? Math.floor(Math.random() * 4) : -1;
  state.routes = laneNames.map((lane, laneIndex) => {
    const type = laneIndex === specialLane ? specialType : rollCombatRoute();
    const route = randomRouteTemplate(type);
    return {
      ...route,
      id: crypto.randomUUID(),
      lane,
      laneIndex,
      depth: state.stage + 1
    };
  });
}

function rollCombatRoute() {
  if (state.stage <= 1) return "fight";
  const eliteChance = Math.min(0.08 + state.stage * 0.018, 0.32);
  return Math.random() < eliteChance ? "elite" : "fight";
}

function rollSpecialRoute() {
  const roll = Math.random();
  const shopChance = state.stage <= 1 ? 0.06 : 0.11;
  const eventChance = state.stage <= 1 ? 0.06 : 0.10;
  if (roll < shopChance) return "shop";
  if (roll < shopChance + eventChance) return "mystery";
  return null;
}

function randomRouteTemplate(type) {
  const matches = routeTemplates.filter((route) => route.type === type);
  return pick(matches);
}

function awardCoins(amount) {
  state.coins += amount;
  state.earnedCoins += amount;
  updateCurrentScore();
}

function updateCurrentScore() {
  state.currentScore = calculateScore(state.earnedCoins, state.levelsCleared);
}

function calculateScore(coins, levels) {
  return coins * 10 + levels * 100 + Math.max(0, levels - 2) * 25;
}

function endRun() {
  const score = calculateScore(state.earnedCoins, state.levelsCleared);
  const earned = state.earnedCoins;
  const cleared = state.levelsCleared;
  resetRunState({
    banner: `Run ended. Score ${score}: ${cleared} fights cleared, ${earned} coins earned.`,
    log: [
      `Run score: ${score}`,
      `Fights cleared: ${cleared}`,
      `Coins earned: ${earned}`,
      "Lordoran returns to the start."
    ],
    lastScore: { score, earnedCoins: earned, levelsCleared: cleared }
  });
}

function resetRunState(options = {}) {
  state.battleToken += 1;
  state.stage = 1;
  state.coins = 10;
  state.threat = 0;
  state.earnedCoins = 0;
  state.levelsCleared = 0;
  state.currentScore = 0;
  state.phase = "route";
  state.team = [makeLordoran()];
  state.enemies = [];
  state.pathHistory = [];
  state.currentNode = "Camp";
  state.rewards = [];
  state.shop = [];
  state.combat = {
    activeId: null,
    targetId: null,
    damage: "",
    banner: options.banner || "Pick a branch to begin the next fight.",
    locked: false
  };
  state.lastRewardBonus = 0;
  state.log = options.log || ["Lordoran begins the branchbound march."];
  if (Object.prototype.hasOwnProperty.call(options, "lastScore")) {
    state.lastScore = options.lastScore;
  }
  generateRoutes();
}

function startRoute(route) {
  if (state.combat.locked) return;
  state.currentNode = route.title;
  state.pathHistory = [...state.pathHistory, route].slice(-6);
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
  state.battleToken += 1;
  const token = state.battleToken;
  const count = enemyCount(elite);
  const difficulty = enemyDifficulty(elite);
  state.enemies = Array.from({ length: count }, () => makeEnemy(difficulty, elite));
  state.combat = {
    activeId: null,
    targetId: null,
    damage: "",
    banner: `${elite ? "Elite zone" : "Skirmish"} begins. Teams line up.`,
    locked: true
  };
  state.log = [`Stage ${state.stage}: ${elite ? "Elite zone" : "Skirmish"} begins.`];
  render();
  window.setTimeout(() => playBattle(elite, token), 420);
}

function enemyDifficulty(elite = false) {
  const partyBonus = Math.max(0, state.team.length - 1) * 0.35;
  const threatBonus = state.threat * 0.35;
  const eliteBonus = elite ? 1.25 : 0;
  return Math.max(1, state.stage * 0.72 + partyBonus + threatBonus + eliteBonus);
}

function enemyCount(elite = false) {
  const base = state.stage <= 1 ? 1 : 1 + Math.floor((state.stage + 1) / 3);
  const teamMatched = Math.min(base, Math.max(1, state.team.length));
  return Math.min(5, teamMatched + (elite ? 1 : 0));
}

async function playBattle(elite = false, token = state.battleToken) {
  let round = 1;

  while (token === state.battleToken && living(state.team).length && living(state.enemies).length && round < 30) {
    pushLog(`Round ${round}`);
    const actors = [...living(state.team).map((unit) => ({ id: unit.id, unit, side: "ally" })), ...living(state.enemies).map((unit) => ({ id: unit.id, unit, side: "enemy" }))]
      .sort((a, b) => battleSpeed(b.unit) - battleSpeed(a.unit) || b.unit.atk - a.unit.atk);

    for (const actor of actors) {
      if (token !== state.battleToken) return;
      const unit = getBattleUnit(actor.id);
      if (!unit || unit.hp <= 0) continue;
      const targets = actor.side === "ally" ? living(state.enemies) : living(state.team);
      if (!targets.length) break;
      const target = targets[0];

      state.combat.activeId = unit.id;
      state.combat.targetId = target.id;
      state.combat.damage = "";
      state.combat.banner = `${unit.name} prepares to strike ${target.name}.`;
      playSound("attack");
      render();
      await wait(360);
      if (token !== state.battleToken) return;

      target.hp -= unit.atk;
      state.combat.damage = `-${unit.atk}`;
      state.combat.banner = `${unit.name} hits ${target.name} for ${unit.atk}.`;
      playSound("hit");
      pushLog(`${unit.name} hits ${target.name} for ${unit.atk}.`);
      if (target.hp <= 0) {
        pushLog(`${target.name} falls.`);
      }

      if (unit.trait.includes("Backline") && targets.length > 1) {
        const back = targets[targets.length - 1];
        if (back !== target) {
          back.hp -= 1;
          pushLog(`${unit.name} zaps ${back.name}.`);
        }
      }
      if (unit.trait.includes("Brawler") && unit.hp > 0) {
        unit.atk += 1;
        pushLog(`${unit.name} brawls up to ${unit.atk} attack.`);
      }
      render();
      await wait(620);
    }
    round += 1;
  }

  if (token !== state.battleToken) return;
  finishBattle(living(state.team).length > 0, elite);
}

function finishBattle(won, elite = false) {
  state.combat.activeId = null;
  state.combat.targetId = null;
  state.combat.damage = "";
  state.combat.locked = false;
  if (won) {
    const bonusCoins = state.team.filter((unit) => unit.trait.includes("Lucky")).length;
    const coins = 5 + state.stage + (elite ? 6 : 0) + bonusCoins;
    awardCoins(coins);
    state.levelsCleared += 1;
    updateCurrentScore();
    state.threat += elite ? 1 : 0.5;
    state.team[0].maxHp += 1;
    state.team[0].hp = state.team[0].maxHp;
    state.team[0].atk += state.stage % 2 === 0 ? 1 : 0;
    state.team.forEach((unit) => {
      if (unit.trait.includes("Medic")) healWeakest(3);
    });
    state.combat.banner = `Victory. Choose one recruit or take coins.`;
    pushLog(`Victory. The squad pockets ${coins} coins.`);
    openRewards(elite ? 7 : 0);
  } else {
    endRun();
  }
  render();
}

function living(units) {
  return units.filter((unit) => unit.hp > 0);
}

function getBattleUnit(id) {
  return state.team.find((unit) => unit.id === id) || state.enemies.find((unit) => unit.id === id);
}

function battleSpeed(unit) {
  return unit.spd;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getAudioContext() {
  if (!state.soundOn) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!state.audio) state.audio = new AudioCtx();
  if (state.audio.state === "suspended") {
    state.audio.resume().catch(() => {});
  }
  return state.audio;
}

function playSound(kind) {
  const audio = getAudioContext();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);

  if (kind === "attack") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
    return;
  }

  osc.type = "square";
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.11, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.start(now);
  osc.stop(now + 0.17);
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  if (!state.soundOn && state.audio) {
    state.audio.suspend().catch(() => {});
  } else {
    getAudioContext();
  }
  renderSoundButton();
}

function renderSoundButton() {
  els.soundButton.textContent = state.soundOn ? "Sound On" : "Sound Off";
  els.soundButton.setAttribute("aria-pressed", String(state.soundOn));
}

function pushLog(message) {
  state.log = [message, ...state.log].slice(0, 20);
}

function healWeakest(amount) {
  const target = [...state.team].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (target) target.hp = Math.min(target.maxHp, target.hp + amount);
}

function openRewards(bonus = 0) {
  state.phase = "reward";
  state.lastRewardBonus = bonus;
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
    awardCoins(1);
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
  state.enemies = [];
  state.combat.banner = `Stage ${state.stage}: choose the next branch.`;
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
  state.combat.banner = "A shop opens between routes.";
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
  state.enemies = [];
  state.combat.banner = `Stage ${state.stage}: choose the next branch.`;
  generateRoutes();
  render();
}

function runMystery() {
  const roll = Math.random();
  if (roll < 0.34) {
    const coins = 7 + state.stage;
    awardCoins(coins);
    state.stage += 1;
    state.phase = "route";
    state.enemies = [];
    state.combat.banner = `The odd door pays out. Stage ${state.stage} awaits.`;
    generateRoutes();
    state.log = [`Lordoran found a jingling shrine. +${coins} coins.`];
    render();
    return;
  }
  if (roll < 0.68) {
    state.combat.banner = "A wanderer offers to join the team.";
    state.log = ["A soft bell calls a wanderer to the party."];
    openRewards(4);
    render();
    return;
  }
  state.log = ["The odd door was absolutely a trap."];
  startBattle(true);
}

function addLog(message) {
  pushLog(message);
}

function clearChoices() {
  els.routeChoices.innerHTML = "";
}

function render() {
  els.stageText.textContent = state.stage;
  els.coinText.textContent = state.coins;
  els.threatText.textContent = Number.isInteger(state.threat) ? state.threat : state.threat.toFixed(1);
  els.scoreText.textContent = state.currentScore;
  els.teamCount.textContent = `${state.team.length}/5`;
  els.battleBanner.textContent = state.combat.banner;
  renderTeam();
  renderBoard();
  renderPhase();
  renderLog();
  renderSoundButton();
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
  return Array.from({ length: enemyCount(false) }, (_, index) => ({
    ...makeEnemy(enemyDifficulty(false), false),
    id: `preview-${index}`
  }));
}

function renderPhase() {
  els.routeChoices.classList.toggle("is-hidden", state.phase !== "route");
  els.rewardChoices.classList.toggle("is-hidden", state.phase !== "reward");
  els.shopPanel.classList.toggle("is-hidden", state.phase !== "shop");

  if (state.phase === "route") {
    els.phaseTitle.textContent = "Choose a Route";
    const scoreNote = state.lastScore ? ` Last run scored ${state.lastScore.score}.` : "";
    els.phaseStatus.textContent = `Lordoran is at ${state.currentNode}. Choose one of four forward branches; shops and events are rare special nodes.${scoreNote}`;
    renderOdds(0);
    renderRoutes();
  } else if (state.phase === "reward") {
    els.phaseTitle.textContent = "Recruit Reward";
    els.phaseStatus.textContent = state.team.length >= 5
      ? "Your team is full. Sell a member from the Team panel or take coins."
      : "Choose one of three recruits, or take coins and keep the current squad.";
    renderOdds(state.lastRewardBonus);
    renderRewards();
  } else if (state.phase === "shop") {
    els.phaseTitle.textContent = "Pocket Market";
    els.phaseStatus.textContent = `Spend coins before moving to the next branch. Team size remains capped at 5.`;
    renderOdds(4);
    renderShop();
  } else {
    els.phaseTitle.textContent = "Auto Battle";
    els.phaseStatus.textContent = "The board is resolving one attack at a time.";
    renderOdds(0);
  }
}

function renderOdds(bonus = 0) {
  els.oddsBar.innerHTML = "";
  rarityOdds(state.stage, bonus).forEach((entry) => {
    const chip = document.createElement("div");
    chip.className = `odds-chip ${entry.rarity}`;
    chip.innerHTML = `<span>${rarityData[entry.rarity].label}</span><strong>${entry.chance.toFixed(1)}%</strong>`;
    els.oddsBar.append(chip);
  });
}

function renderRoutes() {
  els.routeChoices.innerHTML = "";
  els.routeChoices.className = "route-grid map-view";
  const current = document.createElement("div");
  current.className = "map-current";
  const trail = state.pathHistory.length
    ? state.pathHistory.map((route) => route.label).join(" -> ")
    : "Run start";
  current.innerHTML = `<span>Current Node</span><strong>${state.currentNode}</strong><p>Stage ${state.stage}</p><div class="map-trail">${trail}</div>`;
  const branches = document.createElement("div");
  branches.className = "map-branches";

  state.routes.forEach((route) => {
    const button = document.createElement("button");
    button.className = `route-card map-node ${route.type}`;
    button.type = "button";
    button.innerHTML = `<span class="lane-label">${route.lane}</span><span class="route-kind">${route.label}</span><strong>${route.title}</strong><p>${route.detail}</p><div class="route-meta"><span>${route.danger} danger</span><span>${route.coins} coins</span><span>${route.odds} odds</span></div>`;
    button.addEventListener("click", () => startRoute(route));
    branches.append(button);
  });

  els.routeChoices.append(current, branches);
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
    awardCoins(3);
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
  token.className = `fighter-token ${unit.hp <= 0 ? "defeated" : ""} ${state.combat.activeId === unit.id ? "active" : ""} ${state.combat.targetId === unit.id ? "target" : ""}`;
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
  if (state.combat.targetId === unit.id && state.combat.damage) {
    const damage = document.createElement("div");
    damage.className = "damage-pop";
    damage.textContent = state.combat.damage;
    token.append(damage);
  }
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

  px(4, 2, 3, 3, "#f4eadb");
  px(10, 2, 3, 3, "#f4eadb");
  px(5, 3, 1, 1, "#f0a9b9");
  px(11, 3, 1, 1, "#f0a9b9");
  px(3, 5, 11, 7, "#f4eadb");
  px(2, 8, 13, 5, "#f4eadb");
  px(3, 4, 11, 1, "#ffffff");
  px(5, 5, 7, 6, "#fffaf0");
  px(4, 9, 9, 4, "#fffaf0");
  px(6, 4, 1, 2, "#9a6a3a");
  px(8, 4, 1, 2, "#9a6a3a");
  px(10, 4, 1, 2, "#9a6a3a");
  px(3, 7, 2, 1, "#9a6a3a");
  px(12, 7, 2, 1, "#9a6a3a");
  px(2, 10, 2, 1, "#b57a42");
  px(13, 10, 2, 1, "#b57a42");
  px(5, 6, 2, 1, "#0d1016");
  px(10, 6, 2, 1, "#0d1016");
  px(8, 7, 1, 1, "#f2a0b7");
  px(7, 8, 3, 1, "#0d1016");
  px(6, 10, 5, 2, "#ffffff");
  px(2, 9, 2, 2, "#fffaf0");
  px(13, 9, 2, 2, "#fffaf0");
  px(4, 13, 3, 1, "#9a6a3a");
  px(10, 13, 3, 1, "#9a6a3a");
  px(3, 7, 1, 1, "#ffffff");
  px(13, 7, 1, 1, "#ffffff");
}

function newRun() {
  resetRunState({ lastScore: null });
  render();
}

els.soundButton.addEventListener("click", toggleSound);
els.newRunButton.addEventListener("click", newRun);
newRun();
