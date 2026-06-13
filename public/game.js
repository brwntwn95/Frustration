const appVersion = "v0.1.13";

const rarityData = {
  common: { label: "Common", color: "#4aa3ff", value: 3, stat: 1 },
  rare: { label: "Rare", color: "#a46cff", value: 5, stat: 2 },
  legendary: { label: "Legendary", color: "#f1c44e", value: 9, stat: 4 },
  mythic: { label: "Mythic", color: "#f06a6a", value: 12, stat: 5 },
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

const classRoles = [
  { id: "scout", label: "Scout", color: "#7bdff2", hp: 0, atk: 0, spd: 3, description: "Acts early in every clash." },
  { id: "tank", label: "Tank", color: "#4aa3ff", hp: 7, atk: -1, spd: -1, description: "Bulky defender. Gains guard charge when attacked, then taunts enemies when full." },
  { id: "snack", label: "Snack Pact", color: "#ffb26b", hp: 1, atk: 0, spd: 0, description: "Feeds Lordoran when hired, giving him +1 attack." },
  { id: "backliner", label: "Backliner", color: "#a46cff", hp: -1, atk: 1, spd: 1, description: "Assassin role. After attacking, backstabs the farthest enemy for 1 extra damage." },
  { id: "collector", label: "Collector", color: "#f1c44e", hp: 0, atk: 0, spd: 0, description: "Adds 1 coin when hired and improves post-fight coin rewards." },
  { id: "medic", label: "Medic", color: "#72d68b", hp: 1, atk: -1, spd: 0, description: "Heals another ally instead of attacking, splashing healing back to themself. Charge gets faster at higher rarities." },
  { id: "brawler", label: "Brawler", color: "#f06a6a", hp: 2, atk: 1, spd: -1, description: "Bruiser role. Gains +1 attack after landing a hit." },
  { id: "lordoran", label: "Lordoran", color: "#b9fff4", hp: 0, atk: 0, spd: 0, description: "Main character: cannot be sold and grows rounder with every win." },
  { id: "enemy", label: "Enemy", color: "#f06a6a", hp: 0, atk: 0, spd: 0, description: "Hostile unit on the branch." }
];

const roleById = Object.fromEntries(classRoles.map((role) => [role.id, role]));
const recruitRoles = classRoles.filter((role) => !["lordoran", "enemy"].includes(role.id));
const tankChargeMax = 3;
const medicChargeCosts = {
  common: 4,
  rare: 3,
  legendary: 2,
  mythic: 1,
  eternal: 1
};

const oddsUpgradeShift = {
  eternal: 0.1,
  mythic: 0.2,
  legendary: 0.3,
  rare: 0.4
};

const eternalHeroes = [
  {
    key: "jamie",
    name: "Jamie",
    role: "medic",
    maxHp: 22,
    atk: 3,
    spd: 4,
    seed: 91001,
    description: "So tall the party calls it scoliosis, but really she just got folded wrong by low ceilings."
  },
  {
    key: "andrew",
    name: "Andrew",
    role: "tank",
    maxHp: 32,
    atk: 3,
    spd: 1,
    seed: 91002,
    description: "Forced into tank duty by ancient paperwork. The class-change button is gone and HR refuses to help."
  },
  {
    key: "phillip",
    name: "Phillip",
    role: "brawler",
    maxHp: 26,
    atk: 8,
    spd: 2,
    seed: 91003,
    description: "Uhhhhhhh"
  },
  {
    key: "lucas",
    name: "Lucas",
    role: "backliner",
    maxHp: 19,
    atk: 7,
    spd: 6,
    seed: 91004,
    description: "Check this shit out"
  }
];

const eternalModifiers = {
  jamie: {
    title: "Tall Girl Tantrum",
    detail: "After healing, 10% chance to curse another Eternal ally for 1 damage and a very personal \"fuck you.\""
  },
  andrew: {
    title: "Wifely Duties",
    detail: "15% chance at turn start to sit out for 3 turns. Guard charge still builds and can still taunt while he is busy."
  },
  phillip: {
    title: "Gummy Pause",
    detail: "5% chance to take a gummy, become deeply confused, and skip his turn."
  },
  lucas: {
    title: "Check This Out",
    detail: "After a dagger attack, 20% chance to damage himself for half the damage he just dealt."
  }
};

const routeTemplates = [
  { type: "fight", label: "Skirmish", title: "Crooked Path", detail: "Normal enemy team. Pays coins and a choice of three recruits.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "fight", label: "Skirmish", title: "Lantern Road", detail: "Balanced battle with a clean branch onward.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "fight", label: "Skirmish", title: "Moss Bridge", detail: "A direct enemy team blocks the next step.", coins: "+stage", danger: "normal", odds: "base" },
  { type: "veteran", label: "Veteran", title: "Amber Patrol", detail: "A tougher enemy team between skirmish and elite. Better payout with a small rarity bump.", coins: "+3", danger: "medium", odds: "+small rarity" },
  { type: "veteran", label: "Veteran", title: "Torchline Pass", detail: "Seasoned foes guard this branch. Harder than a skirmish, less brutal than elite.", coins: "+3", danger: "medium", odds: "+small rarity" },
  { type: "elite", label: "Elite", title: "Hard Zone", detail: "A dangerous enemy team with a heavy payout and higher reward rarity odds.", coins: "+9", danger: "very high", odds: "+rarity" },
  { type: "elite", label: "Elite", title: "Iron Fork", detail: "A high-risk route with punishing foes and better post-battle odds.", coins: "+9", danger: "very high", odds: "+rarity" },
  { type: "shop", label: "Shop", title: "Pocket Market", detail: "Spend coins on healing, buffs, or another recruit.", coins: "spend", danger: "none", odds: "shop" },
  { type: "mystery", label: "Event", title: "Odd Door", detail: "May become coins, a recruit choice, or a dangerous ambush.", coins: "swingy", danger: "unknown", odds: "varies" }
];

const laneNames = ["High Road", "Upper Fork", "Lower Fork", "Deep Road"];

const state = {
  stage: 1,
  coins: 10,
  threat: 0,
  currentRound: 0,
  earnedCoins: 0,
  levelsCleared: 0,
  currentScore: 0,
  lastScore: null,
  phase: "route",
  team: [],
  enemies: [],
  routes: [],
  mapColumns: [],
  pastMapColumns: [],
  mapPan: { x: 0, y: -780 },
  mapDragMoved: false,
  pathHistory: [],
  currentNode: "Camp",
  currentNodePosition: { laneIndex: 1.5, y: 1030 },
  rewards: [],
  shop: [],
  buffPurchases: 0,
  oddsUpgrades: 0,
  acquiredEternalKeys: [],
  log: [],
  combat: {
    activeId: null,
    targetId: null,
    damage: "",
    effects: [],
    speech: null,
    tauntId: null,
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
  threatStat: document.querySelector("#threatStat"),
  roundText: document.querySelector("#roundText"),
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
  versionBadge: document.querySelector("#versionBadge"),
  unitTemplate: document.querySelector("#unitCardTemplate")
};

function makeLordoran() {
  return {
    id: crypto.randomUUID(),
    name: "Lordoran",
    rarity: "eternal",
    role: "lordoran",
    trait: roleById.lordoran.description,
    level: 1,
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
  const upgradeCount = state.oddsUpgrades || 0;
  let eternal = Math.min(0.3 + lift * 0.09, 2.3);
  let mythic = Math.min(1.1 + lift * 0.26, 9);
  let legendary = Math.min(2.2 + lift * 0.38, 16);
  let rare = Math.min(14 + lift * 0.82, 38);
  let common = 100 - eternal - mythic - legendary - rare;

  for (let index = 0; index < upgradeCount; index += 1) {
    if (common > 0) {
      const commonFraction = Math.min(common, 1) / 1;
      eternal += oddsUpgradeShift.eternal * commonFraction;
      mythic += oddsUpgradeShift.mythic * commonFraction;
      legendary += oddsUpgradeShift.legendary * commonFraction;
      rare += oddsUpgradeShift.rare * commonFraction;
      common -= commonFraction;

      const rareFraction = 1 - commonFraction;
      if (rareFraction > 0) {
        const rareDrain = oddsUpgradeShift.eternal + oddsUpgradeShift.mythic + oddsUpgradeShift.legendary;
        const affordableFraction = Math.min(rare, rareDrain * rareFraction) / (rareDrain * rareFraction);
        eternal += oddsUpgradeShift.eternal * rareFraction * affordableFraction;
        mythic += oddsUpgradeShift.mythic * rareFraction * affordableFraction;
        legendary += oddsUpgradeShift.legendary * rareFraction * affordableFraction;
        rare -= rareDrain * rareFraction * affordableFraction;
      }
      continue;
    }

    const rareDrain = oddsUpgradeShift.eternal + oddsUpgradeShift.mythic + oddsUpgradeShift.legendary;
    const affordableFraction = rareDrain > 0 ? Math.min(rare, rareDrain) / rareDrain : 0;
    eternal += oddsUpgradeShift.eternal * affordableFraction;
    mythic += oddsUpgradeShift.mythic * affordableFraction;
    legendary += oddsUpgradeShift.legendary * affordableFraction;
    rare -= rareDrain * affordableFraction;
  }

  const highTotal = eternal + mythic + legendary + rare;
  if (highTotal > 100) {
    const scale = 100 / highTotal;
    eternal *= scale;
    mythic *= scale;
    legendary *= scale;
    rare *= scale;
  }
  common = Math.max(100 - eternal - mythic - legendary - rare, 0);
  return [
    { rarity: "eternal", chance: eternal },
    { rarity: "mythic", chance: mythic },
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

function makeHero(stage = state.stage, bonus = 0, reservedEternals = new Set()) {
  const seed = Math.floor(Math.random() * 9999999);
  const rnd = mulberry32(seed);
  let rarity = rollRarity(stage, bonus, rnd);
  if (rarity === "eternal") {
    const eternal = makeEternalHero(rnd, reservedEternals);
    if (eternal) return eternal;
    rarity = "mythic";
  }
  const level = recruitLevelForStage(stage);
  const stat = rarityData[rarity].stat;
  const speedBias = Math.floor(rnd() * 3);
  const role = pick(recruitRoles, rnd);
  const maxHp = Math.max(3, 6 + level * 2 + stat * 2 + role.hp + Math.floor(rnd() * 5));
  return {
    id: crypto.randomUUID(),
    name: pick(names, rnd),
    rarity,
    role: role.id,
    trait: role.description,
    level,
    hp: maxHp,
    maxHp,
    atk: Math.max(1, 2 + Math.floor(level * 0.8) + stat + role.atk + Math.floor(rnd() * 3)),
    spd: Math.max(0, 1 + speedBias + Math.floor(stat / 2) + role.spd + Math.floor(level / 5)),
    tankCharge: role.id === "tank" ? 0 : undefined,
    medicCharge: role.id === "medic" ? 0 : undefined,
    seed,
    type: "hero"
  };
}

function recruitLevelForStage(stage) {
  return Math.max(1, stage);
}

function makeEternalHero(rnd = Math.random, reservedEternals = new Set()) {
  const blocked = ownedEternalKeys();
  reservedEternals.forEach((key) => blocked.add(key));
  const available = eternalHeroes.filter((hero) => !blocked.has(hero.key));
  if (!available.length) return null;
  const preset = pick(available, rnd);
  const stats = eternalStatsForLevel(preset, recruitLevelForStage(state.stage));
  return {
    id: crypto.randomUUID(),
    eternalKey: preset.key,
    name: preset.name,
    rarity: "eternal",
    role: preset.role,
    trait: preset.description,
    level: stats.level,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    atk: stats.atk,
    spd: stats.spd,
    tankCharge: preset.role === "tank" ? 0 : undefined,
    medicCharge: preset.role === "medic" ? 0 : undefined,
    stunnedTurns: 0,
    seed: preset.seed,
    type: "hero"
  };
}

function eternalStatsForLevel(preset, level) {
  const scaledLevel = Math.max(1, level);
  const bonus = scaledLevel - 1;
  return {
    level: scaledLevel,
    maxHp: preset.maxHp + bonus * 3,
    atk: preset.atk + Math.floor(bonus * 0.9),
    spd: preset.spd + Math.floor(bonus / 5)
  };
}

function syncEternalLevels(stage = state.stage) {
  state.team.forEach((unit) => syncEternalUnit(unit, stage));
}

function syncEternalUnit(unit, stage = state.stage) {
  if (!unit?.eternalKey) return;
  const level = recruitLevelForStage(stage);
  const preset = eternalHeroes.find((hero) => hero.key === unit.eternalKey);
  if (!preset || (unit.level || 1) >= level) return;
  const previousMax = unit.maxHp;
  const stats = eternalStatsForLevel(preset, level);
  unit.level = stats.level;
  unit.maxHp = stats.maxHp;
  unit.atk = stats.atk;
  unit.spd = stats.spd;
  unit.hp = Math.min(unit.maxHp, Math.max(1, unit.hp) + Math.max(0, unit.maxHp - previousMax));
}

function ownedEternalKeys() {
  const keys = new Set(state.acquiredEternalKeys);
  [...state.team, ...state.rewards, ...state.shop].forEach((unit) => {
    if (unit.eternalKey) keys.add(unit.eternalKey);
  });
  return keys;
}

function markEternalAcquired(hero) {
  if (!hero.eternalKey || state.acquiredEternalKeys.includes(hero.eternalKey)) return;
  state.acquiredEternalKeys.push(hero.eternalKey);
}

function makeEnemy(difficulty, encounterType = "fight") {
  const type = normalizeEncounterType(encounterType);
  const seed = Math.floor(Math.random() * 9999999);
  const rnd = mulberry32(seed);
  const boost = type === "elite"
    ? Math.max(2, Math.floor(difficulty * 0.55))
    : type === "veteran"
      ? Math.max(1, Math.floor(difficulty * 0.22))
      : 0;
  const hp = Math.round(4 + difficulty * 1.25 + boost * 1.4 + Math.floor(rnd() * (2 + difficulty * 0.65)));
  const level = Math.max(1, Math.round(difficulty));
  return {
    id: crypto.randomUUID(),
    name: pick(enemyNames, rnd),
    rarity: type === "elite" ? "mythic" : type === "veteran" ? "rare" : "common",
    role: "enemy",
    trait: type === "elite" ? "Elite pressure." : type === "veteran" ? "Veteran pressure." : "Stage threat.",
    level,
    hp,
    maxHp: hp,
    atk: 1 + Math.floor(difficulty * 0.45) + boost + Math.floor(rnd() * 2),
    spd: 1 + Math.floor(rnd() * 3) + (type === "elite" ? 2 : type === "veteran" ? 1 : 0),
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

function recoverTeam(percent = 0.2) {
  state.team.forEach((unit) => {
    const amount = Math.max(1, Math.ceil(unit.maxHp * percent));
    unit.hp = Math.min(unit.maxHp, Math.max(1, unit.hp) + amount);
  });
}

function generateRoutes() {
  while (state.mapColumns.length < 8) {
    state.mapColumns.push(makeMapColumn(state.stage + state.mapColumns.length + 1));
  }
  state.routes = state.mapColumns[0] || [];
}

function makeMapColumn(depth) {
  const count = 2 + Math.floor(Math.random() * 3);
  const lanes = [...laneNames].sort(() => Math.random() - 0.5).slice(0, count).sort((a, b) => laneNames.indexOf(a) - laneNames.indexOf(b));
  const specialType = rollSpecialRoute(depth);
  const specialLane = specialType ? Math.floor(Math.random() * lanes.length) : -1;
  return lanes.map((lane, index) => {
    const type = index === specialLane ? specialType : rollCombatRoute(depth);
    const route = randomRouteTemplate(type);
    return {
      ...route,
      id: crypto.randomUUID(),
      lane,
      laneIndex: laneNames.indexOf(lane),
      depth
    };
  });
}

function advanceMap() {
  state.mapColumns.shift();
  state.mapPan = mapPanForCurrent();
  generateRoutes();
}

function mapXForLane(laneIndex, offset = 0) {
  return 185 + laneIndex * 130 + offset;
}

function mapPanForCurrent() {
  const currentX = mapXForLane(state.currentNodePosition.laneIndex);
  return {
    x: Math.max(-160, Math.min(160, 380 - currentX)),
    y: Math.max(-900, Math.min(-560, 170 - state.currentNodePosition.y))
  };
}

function rollCombatRoute(depth = state.stage) {
  if (depth <= 2) return "fight";
  const eliteChance = depth <= 4 ? 0.02 : Math.min(0.025 + depth * 0.012, 0.18);
  const veteranChance = Math.min(0.16 + depth * 0.018, 0.42);
  const roll = Math.random();
  if (roll < eliteChance) return "elite";
  if (roll < eliteChance + veteranChance) return "veteran";
  return "fight";
}

function normalizeEncounterType(type) {
  return ["fight", "veteran", "elite"].includes(type) ? type : "fight";
}

function encounterLabel(type) {
  return type === "elite" ? "Elite zone" : type === "veteran" ? "Veteran patrol" : "Skirmish";
}

function rollSpecialRoute(depth = state.stage) {
  const roll = Math.random();
  const shopChance = depth <= 2 ? 0.04 : 0.1;
  const eventChance = depth <= 2 ? 0.04 : 0.09;
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
  state.currentRound = 0;
  state.earnedCoins = 0;
  state.levelsCleared = 0;
  state.currentScore = 0;
  state.phase = "route";
  state.team = [makeLordoran()];
  state.enemies = [];
  state.mapColumns = [];
  state.pastMapColumns = [];
  state.mapPan = { x: 0, y: -780 };
  state.mapDragMoved = false;
  state.pathHistory = [];
  state.currentNode = "Camp";
  state.currentNodePosition = { laneIndex: 1.5, y: 1030 };
  state.rewards = [];
  state.shop = [];
  state.buffPurchases = 0;
  state.oddsUpgrades = 0;
  state.acquiredEternalKeys = [];
  state.combat = {
    activeId: null,
    targetId: null,
    damage: "",
    effects: [],
    speech: null,
    tauntId: null,
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
  state.pastMapColumns = [
    ...state.pastMapColumns,
    {
      id: crypto.randomUUID(),
      routes: state.routes.map((mapRoute) => ({ ...mapRoute })),
      selectedId: route.id,
      fromPosition: { ...state.currentNodePosition }
    }
  ].slice(-5);
  state.currentNode = route.title;
  state.currentNodePosition = { laneIndex: route.laneIndex, y: 900 };
  state.pathHistory = [...state.pathHistory, route].slice(-6);
  advanceMap();
  clearChoices();
  if (route.type === "shop") {
    openShop();
    return;
  }
  if (route.type === "mystery") {
    runMystery();
    return;
  }
  startBattle(route.type);
}

function startBattle(encounterType = "fight") {
  const type = normalizeEncounterType(encounterType);
  const label = encounterLabel(type);
  state.phase = "battle";
  state.currentRound = 0;
  state.battleToken += 1;
  const token = state.battleToken;
  const count = enemyCount(type);
  const difficulty = enemyDifficulty(type);
  state.enemies = Array.from({ length: count }, () => makeEnemy(difficulty, type));
  state.combat = {
    activeId: null,
    targetId: null,
    damage: "",
    effects: [],
    speech: null,
    tauntId: null,
    banner: `${label} begins. Teams line up.`,
    locked: true
  };
  state.log = [`Stage ${state.stage}: ${label} begins.`];
  render();
  window.setTimeout(() => playBattle(type, token), 420);
}

function enemyDifficulty(encounterType = "fight") {
  const type = normalizeEncounterType(encounterType);
  const partyBonus = Math.max(0, state.team.length - 1) * 0.35;
  const encounterBonus = type === "elite" ? 2.6 : type === "veteran" ? 0.85 : 0;
  return Math.max(1, state.stage * 0.72 + partyBonus + enemyThreatBonus() + encounterBonus);
}

function enemyThreatBonus() {
  return state.threat * 0.35;
}

function enemyCount(encounterType = "fight") {
  const type = normalizeEncounterType(encounterType);
  const base = state.stage <= 1 ? 1 : 1 + Math.floor((state.stage + 1) / 3);
  const teamMatched = Math.min(base, Math.max(1, state.team.length));
  return Math.min(5, teamMatched + (type === "elite" ? 2 : type === "veteran" ? 1 : 0));
}

async function playBattle(encounterType = "fight", token = state.battleToken) {
  const type = normalizeEncounterType(encounterType);
  let round = 1;

  while (token === state.battleToken && living(state.team).length && living(state.enemies).length && round < 30) {
    state.currentRound = round;
    pushLog(`Round ${round}`);
    state.combat.effects = [];
    state.combat.speech = null;
    state.combat.tauntId = null;
    if (!await triggerRoundStartAbilities(token)) return;
    const actors = [...living(state.team).map((unit) => ({ id: unit.id, unit, side: "ally" })), ...living(state.enemies).map((unit) => ({ id: unit.id, unit, side: "enemy" }))]
      .sort((a, b) => battleSpeed(b.unit) - battleSpeed(a.unit) || b.unit.atk - a.unit.atk);

    for (const actor of actors) {
      if (token !== state.battleToken) return;
      const unit = getBattleUnit(actor.id);
      if (!unit || unit.hp <= 0) continue;
      if (actor.side === "ally" && !await resolveEternalTurnStart(unit, token)) continue;

      if (actor.side === "ally" && unitHasRole(unit, "medic")) {
        chargeMedic(unit);
        if (medicCharge(unit) >= medicChargeMax(unit)) {
          const otherTeamHeals = living(state.team)
            .filter((target) => target.id !== unit.id)
            .map((target) => ({ target, amount: medicHealAmount(target, unit) }))
            .filter((heal) => heal.amount > 0);
          const selfAmount = otherTeamHeals.length ? medicHealAmount(unit, unit) : 0;
          const teamHeals = selfAmount > 0
            ? [...otherTeamHeals, { target: unit, amount: selfAmount }]
            : otherTeamHeals;
          if (teamHeals.length) {
            unit.medicCharge = 0;
            const total = teamHeals.reduce((sum, heal) => sum + heal.amount, 0);
            const healScope = selfAmount > 0 ? "allies and themself" : "allies";
            state.combat.activeId = unit.id;
            state.combat.targetId = unit.id;
            state.combat.damage = "";
            state.combat.effects = teamHeals.map((heal) => ({ id: heal.target.id, text: `+${heal.amount}`, kind: "heal" }));
            state.combat.speech = null;
            state.combat.banner = `${unit.name} prepares a shared heal for ${total} total HP.`;
            playSound("heal", "medic");
            render();
            await wait(420);
            if (token !== state.battleToken) return;
            teamHeals.forEach((heal) => {
              heal.target.hp = Math.min(heal.target.maxHp, heal.target.hp + heal.amount);
            });
            state.combat.banner = `${unit.name} heals ${healScope} for ${total} total HP.`;
            pushLog(`${unit.name} heals ${healScope} for ${total} total HP.`);
            render();
            await resolveJamieOutburst(unit, token);
            await wait(700);
            continue;
          }
        }
        const healTarget = weakestOtherLivingAlly(unit);
        if (healTarget) {
          const amount = medicHealAmount(healTarget, unit);
          const selfAmount = amount > 0 ? medicHealAmount(unit, unit) : 0;
          const healEffects = amount > 0
            ? [
                { id: healTarget.id, text: `+${amount}`, kind: "heal" },
                ...(selfAmount > 0 ? [{ id: unit.id, text: `+${selfAmount}`, kind: "heal" }] : [])
              ]
            : [{ id: unit.id, text: "READY", kind: "ability" }];
          state.combat.activeId = unit.id;
          state.combat.targetId = healTarget.id;
          state.combat.damage = "";
          state.combat.effects = healEffects;
          state.combat.speech = null;
          state.combat.banner = amount > 0
            ? `${unit.name} prepares to heal ${healTarget.name} for ${amount}${selfAmount > 0 ? ` and themself for ${selfAmount}` : ""}.`
            : `${unit.name} holds a heal. Everyone else is fine.`;
          playSound("heal", "medic");
          render();
          await wait(360);
          if (token !== state.battleToken) return;
          if (amount <= 0) {
            await wait(300);
            continue;
          }
          healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + amount);
          if (selfAmount > 0) unit.hp = Math.min(unit.maxHp, unit.hp + selfAmount);
          state.combat.effects = healEffects;
          state.combat.banner = `${unit.name} heals ${healTarget.name} for ${amount}${selfAmount > 0 ? ` and themself for ${selfAmount}` : ""}.`;
          pushLog(`${unit.name} heals ${healTarget.name} for ${amount}${selfAmount > 0 ? ` and themself for ${selfAmount}` : ""}.`);
          render();
          await resolveJamieOutburst(unit, token);
          await wait(620);
          continue;
        }
      }

      let targets = actor.side === "ally" ? living(state.enemies) : living(state.team);
      if (actor.side === "enemy") {
        const taunter = getBattleUnit(state.combat.tauntId);
        if (taunter && taunter.hp > 0) targets = [taunter];
      }
      if (!targets.length) break;
      const target = pick(targets);

      state.combat.activeId = unit.id;
      state.combat.targetId = target.id;
      state.combat.damage = "";
      state.combat.effects = [];
      state.combat.speech = null;
      state.combat.banner = `${unit.name} prepares to strike ${target.name}.`;
      playSound("attack", roleForUnit(unit).id);
      render();
      await wait(360);
      if (token !== state.battleToken) return;

      target.hp -= unit.atk;
      state.combat.damage = `-${unit.atk}`;
      state.combat.effects = [{ id: target.id, text: `-${unit.atk}`, kind: "damage" }];
      state.combat.banner = `${unit.name} hits ${target.name} for ${unit.atk}.`;
      playSound("hit", roleForUnit(unit).id);
      pushLog(`${unit.name} hits ${target.name} for ${unit.atk}.`);
      if (actor.side === "enemy" && unitHasRole(target, "tank")) {
        chargeTank(target);
      }
      if (target.hp <= 0) {
        pushLog(`${target.name} falls.`);
      }
      if (actor.side === "ally" && unit.eternalKey === "lucas" && Math.random() < 0.2) {
        const recoil = Math.max(1, Math.ceil(unit.atk / 2));
        unit.hp -= recoil;
        state.combat.effects.push({ id: unit.id, text: `-${recoil}`, kind: "damage" });
        showCombatSpeech(unit, "Check this shit out");
        pushLog(`Lucas also damages himself for ${recoil}.`);
        if (unit.hp <= 0) pushLog("Lucas immediately regrets checking that out.");
      }

      if (unitHasRole(unit, "backliner") && targets.length > 1) {
        const back = targets[targets.length - 1];
        if (back !== target) {
          back.hp -= 1;
          state.combat.effects.push({ id: back.id, text: "-1", kind: "damage" });
          pushLog(`${unit.name} backstabs ${back.name} with a quick dagger flick.`);
        }
      }
      if (unitHasRole(unit, "brawler") && unit.hp > 0) {
        unit.atk += 1;
        pushLog(`${unit.name} brawls up to ${unit.atk} attack.`);
      }
      render();
      await wait(620);
    }
    round += 1;
  }

  if (token !== state.battleToken) return;
  finishBattle(living(state.team).length > 0, type);
}

function finishBattle(won, encounterType = "fight") {
  const type = normalizeEncounterType(encounterType);
  state.combat.activeId = null;
  state.combat.targetId = null;
  state.combat.damage = "";
  state.combat.effects = [];
  state.combat.speech = null;
  state.combat.tauntId = null;
  state.combat.locked = false;
  state.currentRound = 0;
  if (won) {
    const bonusCoins = state.team.filter((unit) => unitHasRole(unit, "collector")).length;
    const coins = 5 + state.stage + (type === "elite" ? 9 : type === "veteran" ? 3 : 0) + bonusCoins;
    awardCoins(coins);
    state.levelsCleared += 1;
    updateCurrentScore();
    state.threat += type === "elite" ? 1.5 : type === "veteran" ? 0.8 : 0.5;
    state.team[0].level += 1;
    state.team[0].maxHp += 1;
    state.team[0].hp = state.team[0].maxHp;
    state.team[0].atk += state.stage % 2 === 0 ? 1 : 0;
    syncEternalLevels(state.stage);
    state.combat.banner = `Victory. Choose one recruit or take coins.`;
    pushLog(`Victory. The squad pockets ${coins} coins.`);
    openRewards(type === "elite" ? 10 : type === "veteran" ? 3 : 0);
  } else {
    endRun();
  }
  render();
}

function living(units) {
  return units.filter((unit) => unit.hp > 0);
}

async function triggerRoundStartAbilities(token) {
  const tank = living(state.team).find((unit) => unitHasRole(unit, "tank") && tankCharge(unit) >= tankChargeMax);
  if (!tank) return true;
  tank.tankCharge = 0;
  state.combat.activeId = tank.id;
  state.combat.targetId = tank.id;
  state.combat.damage = "";
  state.combat.effects = [{ id: tank.id, text: "TAUNT", kind: "ability" }];
  state.combat.speech = null;
  state.combat.tauntId = tank.id;
  state.combat.banner = `${tank.name} spends full guard charge and taunts the enemies this round.`;
  pushLog(`${tank.name} spends guard charge. Enemies must target them this round.`);
  playSound("ability", "tank");
  render();
  await wait(760);
  return token === state.battleToken;
}

function tankCharge(unit) {
  return Math.max(0, Math.min(tankChargeMax, unit.tankCharge || 0));
}

function chargeTank(unit) {
  unit.tankCharge = Math.min(tankChargeMax, tankCharge(unit) + 1);
  if (unit.tankCharge >= tankChargeMax) {
    pushLog(`${unit.name}'s guard is fully charged.`);
  }
}

function medicCharge(unit) {
  return Math.max(0, Math.min(medicChargeMax(unit), unit.medicCharge || 0));
}

function chargeMedic(unit) {
  unit.medicCharge = Math.min(medicChargeMax(unit), medicCharge(unit) + 1);
}

function medicChargeMax(unit) {
  return medicChargeCosts[unit.rarity] || medicChargeCosts.common;
}

async function resolveEternalTurnStart(unit, token) {
  if (unit.stunnedTurns > 0) {
    unit.stunnedTurns -= 1;
    state.combat.activeId = unit.id;
    state.combat.targetId = unit.id;
    state.combat.damage = "";
    state.combat.effects = [{ id: unit.id, text: "DUTIES", kind: "ability" }];
    showCombatSpeech(unit, "Still on duties.");
    state.combat.banner = `${unit.name} is still handling wifely duties.`;
    pushLog(`${unit.name} sits this turn out.`);
    playSound("ability", roleForUnit(unit).id);
    render();
    await wait(560);
    return false;
  }

  if (unit.eternalKey === "andrew" && Math.random() < 0.15) {
    unit.stunnedTurns = 3;
    state.combat.activeId = unit.id;
    state.combat.targetId = unit.id;
    state.combat.damage = "";
    state.combat.effects = [{ id: unit.id, text: "DUTIES", kind: "ability" }];
    showCombatSpeech(unit, "I have wifely duties.");
    state.combat.banner = `${unit.name}: "I have wifely duties."`;
    pushLog(`${unit.name} has wifely duties and sits out.`);
    playSound("ability", "tank");
    render();
    await wait(720);
    return false;
  }

  if (unit.eternalKey === "phillip" && Math.random() < 0.05) {
    state.combat.activeId = unit.id;
    state.combat.targetId = unit.id;
    state.combat.damage = "";
    state.combat.effects = [{ id: unit.id, text: "???", kind: "ability" }];
    showCombatSpeech(unit, "Uhhhhhhh");
    state.combat.banner = `${unit.name} takes a gummy and forgets what a turn is.`;
    pushLog(`${unit.name}: Uhhhhhhh`);
    playSound("ability", "brawler");
    render();
    await wait(680);
    return false;
  }

  return true;
}

async function resolveJamieOutburst(unit, token) {
  if (unit.eternalKey !== "jamie" || Math.random() >= 0.1) return;
  const targets = living(state.team).filter((ally) => ally.id !== unit.id && ally.eternalKey);
  if (!targets.length) return;
  const target = pick(targets);
  target.hp -= 1;
  state.combat.activeId = unit.id;
  state.combat.targetId = target.id;
  state.combat.damage = "";
  state.combat.effects = [{ id: target.id, text: "fuck you", kind: "curse" }];
  showCombatSpeech(unit, "fuck you");
  state.combat.banner = `${unit.name} heals, then immediately yells at ${target.name}.`;
  pushLog(`${unit.name} to ${target.name}: fuck you.`);
  playSound("hit", "medic");
  render();
  await wait(520);
  if (token !== state.battleToken) return;
  if (target.hp <= 0) pushLog(`${target.name} falls from emotional damage.`);
}

function showCombatSpeech(unit, text) {
  state.combat.speech = { id: unit.id, text };
}

function weakestOtherLivingAlly(healer) {
  const allies = living(state.team).filter((unit) => unit.id !== healer.id);
  if (!allies.length) return null;
  return [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

function medicHealPower(unit) {
  return Math.max(1, unit.atk);
}

function medicHealAmount(target, healer) {
  const missingHp = Math.max(0, target.maxHp - Math.max(0, target.hp));
  const baseHeal = medicHealPower(healer);
  return Math.min(baseHeal, missingHp);
}

function roleForUnit(unit) {
  if (unit.role && roleById[unit.role]) return roleById[unit.role];
  if (unit.type === "lordoran") return roleById.lordoran;
  if (unit.type === "enemy") return roleById.enemy;
  if (unit.trait?.includes("Medic")) return roleById.medic;
  if (unit.trait?.includes("Brawler")) return roleById.brawler;
  if (unit.trait?.includes("Backline")) return roleById.backliner;
  if (unit.trait?.includes("Bulwark")) return roleById.tank;
  if (unit.trait?.includes("First strike")) return roleById.scout;
  if (unit.trait?.includes("Snack")) return roleById.snack;
  if (unit.trait?.includes("Collector") || unit.trait?.includes("Lucky")) return roleById.collector;
  return roleById.scout;
}

function unitHasRole(unit, roleId) {
  return roleForUnit(unit).id === roleId;
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

function playSound(kind, roleId = "") {
  const audio = getAudioContext();
  if (!audio) return;
  const now = audio.currentTime;
  const profile = soundProfile(kind, roleId);
  const layers = profile.layers || [profile];
  layers.forEach((layer) => playTone(audio, now, layer));
}

function playTone(audio, now, layer) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);
  const delay = layer.delay || 0;
  const start = now + delay;
  osc.type = layer.type;
  osc.frequency.setValueAtTime(layer.from, start);
  osc.frequency.exponentialRampToValueAtTime(layer.to, start + layer.slide);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(layer.volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + layer.length);
  osc.start(start);
  osc.stop(start + layer.length + 0.02);
}

function soundProfile(kind, roleId) {
  const layered = (base, accent) => ({ layers: [base, accent] });
  const attackProfiles = {
    brawler: layered({ type: "square", from: 180, to: 82, slide: 0.1, length: 0.16, volume: 0.12 }, { type: "triangle", from: 92, to: 58, slide: 0.11, length: 0.18, volume: 0.06 }),
    backliner: layered({ type: "sawtooth", from: 860, to: 310, slide: 0.07, length: 0.12, volume: 0.07 }, { type: "triangle", from: 1220, to: 760, slide: 0.04, length: 0.08, volume: 0.035, delay: 0.035 }),
    scout: layered({ type: "triangle", from: 680, to: 420, slide: 0.06, length: 0.1, volume: 0.07 }, { type: "sine", from: 920, to: 680, slide: 0.05, length: 0.08, volume: 0.035, delay: 0.03 }),
    tank: layered({ type: "square", from: 240, to: 160, slide: 0.12, length: 0.18, volume: 0.09 }, { type: "sine", from: 120, to: 90, slide: 0.16, length: 0.22, volume: 0.06 }),
    lordoran: layered({ type: "triangle", from: 420, to: 210, slide: 0.11, length: 0.16, volume: 0.1 }, { type: "sine", from: 260, to: 130, slide: 0.12, length: 0.18, volume: 0.05 })
  };
  const hitProfiles = {
    brawler: layered({ type: "square", from: 120, to: 54, slide: 0.09, length: 0.17, volume: 0.13 }, { type: "sine", from: 62, to: 38, slide: 0.12, length: 0.2, volume: 0.06 }),
    backliner: layered({ type: "triangle", from: 620, to: 180, slide: 0.08, length: 0.13, volume: 0.09 }, { type: "sawtooth", from: 950, to: 460, slide: 0.05, length: 0.08, volume: 0.035 }),
    tank: layered({ type: "square", from: 160, to: 90, slide: 0.12, length: 0.18, volume: 0.11 }, { type: "sine", from: 90, to: 55, slide: 0.16, length: 0.2, volume: 0.05 }),
    enemy: layered({ type: "sawtooth", from: 190, to: 70, slide: 0.09, length: 0.16, volume: 0.09 }, { type: "square", from: 95, to: 48, slide: 0.12, length: 0.18, volume: 0.04 })
  };
  if (kind === "heal") return layered({ type: "sine", from: 360, to: 720, slide: 0.14, length: 0.22, volume: 0.075 }, { type: "triangle", from: 540, to: 1080, slide: 0.16, length: 0.24, volume: 0.035, delay: 0.045 });
  if (kind === "ability" && roleId === "tank") return layered({ type: "square", from: 150, to: 360, slide: 0.16, length: 0.26, volume: 0.13 }, { type: "sine", from: 75, to: 180, slide: 0.2, length: 0.3, volume: 0.07 });
  if (kind === "ability" && roleId === "medic") return layered({ type: "sine", from: 300, to: 900, slide: 0.18, length: 0.26, volume: 0.08 }, { type: "triangle", from: 600, to: 1200, slide: 0.2, length: 0.3, volume: 0.035 });
  if (kind === "attack") return attackProfiles[roleId] || { type: "triangle", from: 520, to: 240, slide: 0.09, length: 0.13, volume: 0.08 };
  if (kind === "hit") return hitProfiles[roleId] || { type: "square", from: 130, to: 70, slide: 0.08, length: 0.17, volume: 0.11 };
  return { type: "square", from: 130, to: 70, slide: 0.08, length: 0.17, volume: 0.11 };
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
  recoverTeam(0.18);
  const reservedEternals = new Set();
  state.rewards = Array.from({ length: 3 }, () => {
    const hero = makeHero(state.stage, bonus, reservedEternals);
    if (hero.eternalKey) reservedEternals.add(hero.eternalKey);
    return hero;
  });
}

function recruit(hero) {
  if (state.team.length >= 5) {
    addLog("Team is full. Sell a member first.");
    return;
  }
  state.team.push(hero);
  markEternalAcquired(hero);
  applyHireTrait(hero);
  state.rewards = state.rewards.filter((reward) => reward.id !== hero.id);
  addLog(`${hero.name} joins Lordoran.`);
  continueRun();
}

function applyHireTrait(hero) {
  if (unitHasRole(hero, "snack")) {
    state.team[0].atk += 1;
    addLog("Lordoran accepts a snack pact and gains +1 attack.");
  }
  if (unitHasRole(hero, "collector")) {
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
  syncEternalLevels(state.stage);
  state.phase = "route";
  state.rewards = [];
  state.shop = [];
  state.enemies = [];
  state.combat.banner = `Stage ${state.stage}: choose the next branch.`;
  generateRoutes();
  render();
}

function openShop() {
  syncEternalLevels(state.stage);
  state.phase = "shop";
  state.shop = makeShopItems();
  state.combat.banner = "A shop opens between routes.";
  state.log = [`A market appears between branches.`];
  render();
}

function makeShopItems() {
  return [
    { id: "heal", title: "Warm Saucer", detail: "Heal the full team.", cost: 5, action: () => healTeam(true) },
    { id: "buff", title: "Polished Button", detail: `Give a random ally +2 power and +2 HP. Price rises after each buy. Bought ${state.buffPurchases} times.`, cost: buffCost(), action: buffRandom },
    { id: "odds", title: "Loaded Dice", detail: `Trade low-tier odds upward. Common feeds Eternal/Mythic/Legendary/Rare first; once Common hits 0%, Rare feeds Eternal/Mythic/Legendary. Bought ${state.oddsUpgrades} times.`, cost: oddsUpgradeCost(), action: upgradeRarityOdds },
    { id: "hire", title: "Stray Contract", detail: "Add a recruit rolled at shop odds.", cost: 10, action: hireFromShop }
  ];
}

function buffCost() {
  return 8 + state.buffPurchases * 5;
}

function oddsUpgradeCost() {
  return 12 + state.oddsUpgrades * 8;
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
  state.shop = makeShopItems();
  addLog(`${item.title} purchased.`);
  render();
}

function buffRandom() {
  const target = pick(state.team);
  target.atk += 2;
  target.maxHp += 2;
  target.hp += 2;
  state.buffPurchases += 1;
}

function upgradeRarityOdds() {
  state.oddsUpgrades += 1;
}

function hireFromShop() {
  const hero = makeHero(state.stage, 4);
  if (hero.eternalKey) syncEternalUnit(hero, state.stage);
  state.team.push(hero);
  markEternalAcquired(hero);
  applyHireTrait(hero);
}

function leaveShop() {
  state.stage += 1;
  syncEternalLevels(state.stage);
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
  startBattle("elite");
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
  els.threatStat.title = `Threat adds ${enemyThreatBonus().toFixed(1)} enemy difficulty. It rises after elite fights and long runs.`;
  els.roundText.textContent = state.currentRound || "-";
  els.scoreText.textContent = state.currentScore;
  els.versionBadge.textContent = appVersion;
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
    card.draggable = !state.combat.locked;
    card.dataset.unitId = unit.id;
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", unit.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("dragover", (event) => {
      if (state.combat.locked) return;
      event.preventDefault();
      card.classList.add("drop-target");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drop-target");
      reorderTeam(event.dataTransfer.getData("text/plain"), unit.id);
    });
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

function reorderTeam(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId || state.combat.locked) return;
  const from = state.team.findIndex((unit) => unit.id === sourceId);
  const to = state.team.findIndex((unit) => unit.id === targetId);
  if (from < 0 || to < 0) return;
  const [unit] = state.team.splice(from, 1);
  state.team.splice(to, 0, unit);
  addLog(`${unit.name} changes position.`);
  render();
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
  return Array.from({ length: enemyCount("fight") }, (_, index) => ({
    ...makeEnemy(enemyDifficulty("fight"), "fight"),
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
    els.phaseStatus.textContent = `Lordoran is at ${state.currentNode}. Choose one of the reachable forward branches; shops and events are rare special nodes.${scoreNote}`;
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
  els.routeChoices.className = "route-map-shell";

  const viewport = document.createElement("div");
  viewport.className = "route-map-viewport";
  viewport.setAttribute("aria-label", "Drag route map to inspect future branches");

  const tilt = document.createElement("div");
  tilt.className = "route-map-tilt";
  const tiltGrid = document.createElement("div");
  tiltGrid.className = "route-map-grid";
  tilt.append(tiltGrid);

  const content = document.createElement("div");
  content.className = "route-map-content";
  content.style.transform = `translate(${state.mapPan.x}px, ${state.mapPan.y}px)`;

  const lineLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lineLayer.classList.add("route-lines");
  lineLayer.setAttribute("viewBox", "0 0 760 1160");
  lineLayer.setAttribute("preserveAspectRatio", "none");

  const trail = state.pathHistory.length
    ? state.pathHistory.map((route) => route.label).join(" -> ")
    : "Run start";
  const currentNode = {
    id: "current",
    x: mapXForLane(state.currentNodePosition.laneIndex),
    y: state.currentNodePosition.y,
    type: "current",
    label: "Here",
    title: state.currentNode,
    detail: `Stage ${state.stage}. ${trail}`
  };
  const nodes = [currentNode];

  [...state.pastMapColumns].reverse().forEach((entry, pastIndex) => {
    entry.routes.forEach((route) => {
      const taken = route.id === entry.selectedId;
      nodes.push({
        ...route,
        id: `past-${entry.id}-${route.id}`,
        x: mapXForLane(route.laneIndex, pastIndex % 2 ? -22 : 8),
        y: state.currentNodePosition.y + 130 + pastIndex * 115,
        columnIndex: null,
        pastIndex,
        historyState: taken ? "taken" : "skipped",
        label: taken ? `${route.label} - taken` : `${route.label} - skipped`
      });
    });
  });

  state.mapColumns.forEach((column, columnIndex) => {
    column.forEach((route) => {
      nodes.push({
        ...route,
        x: mapXForLane(route.laneIndex, columnIndex % 2 ? 22 : -8),
        y: state.currentNodePosition.y - 130 - columnIndex * 115,
        columnIndex
      });
    });
  });

  drawRouteLines(lineLayer, nodes);
  content.append(lineLayer);

  nodes.forEach((node) => {
    const button = document.createElement("button");
    button.className = `route-icon-node ${node.type} ${node.columnIndex === 0 ? "selectable" : ""} ${node.historyState || ""}`;
    button.type = "button";
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.setAttribute("aria-disabled", String(node.type === "current" || node.columnIndex !== 0 || node.historyState));
    button.innerHTML = `<span class="node-symbol">${routeIcon(node.type)}</span><span class="node-tooltip"><strong>${node.title}</strong><em>${node.label || rarityData[node.rarity]?.label || ""}</em>${node.detail}<small>${node.danger || "current"} / ${node.coins || "run"} / ${node.odds || "base"}</small></span>`;
    if (node.columnIndex === 0) {
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", () => {
        if (!state.mapDragMoved) startRoute(node);
      });
    }
    content.append(button);
  });

  viewport.append(tilt, content);
  setupMapPan(viewport, content);

  const caption = document.createElement("div");
  caption.className = "route-map-caption";
  const nextCount = state.routes.length;
  caption.textContent = `${nextCount} reachable branches. Drag the map to inspect the seed ahead and the branches left behind. Hover nodes for details.`;
  els.routeChoices.append(viewport, caption);
}

function routeIcon(type) {
  if (type === "current") return "L";
  if (type === "fight") return "S";
  if (type === "veteran") return "V";
  if (type === "elite") return "!";
  if (type === "shop") return "$";
  if (type === "mystery") return "?";
  return "*";
}

function drawRouteLines(svg, nodes) {
  const current = nodes.find((node) => node.type === "current");
  const columns = state.mapColumns.map((column, columnIndex) => nodes.filter((node) => node.columnIndex === columnIndex));
  const pastColumns = [...new Set(nodes.filter((node) => node.historyState).map((node) => node.pastIndex))]
    .sort((a, b) => a - b)
    .map((pastIndex) => nodes.filter((node) => node.pastIndex === pastIndex));

  pastColumns.forEach((column, index) => {
    const anchor = index === 0
      ? current
      : pastColumns[index - 1].find((node) => node.historyState === "taken");
    if (!anchor) return;
    column.forEach((node) => appendRouteLine(svg, node, anchor, node.historyState === "taken" ? "taken" : "skipped"));
  });

  if (current && columns[0]) {
    columns[0].forEach((node) => appendRouteLine(svg, current, node, "active"));
  }
  for (let index = 0; index < columns.length - 1; index += 1) {
    columns[index].forEach((from) => {
      columns[index + 1].forEach((to) => {
        if (Math.abs(from.laneIndex - to.laneIndex) <= 2) appendRouteLine(svg, from, to, "future");
      });
    });
  }
}

function appendRouteLine(svg, from, to, kind = "future") {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", to.x);
  line.setAttribute("y2", to.y);
  line.classList.add(`${kind}-route-line`);
  svg.append(line);
}

function setupMapPan(viewport, plane) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  viewport.addEventListener("pointerdown", (event) => {
    dragging = true;
    state.mapDragMoved = false;
    startX = event.clientX;
    startY = event.clientY;
    baseX = state.mapPan.x;
    baseY = state.mapPan.y;
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) state.mapDragMoved = true;
    state.mapPan.x = Math.max(-160, Math.min(160, baseX + dx));
    state.mapPan.y = Math.max(-900, Math.min(-560, baseY + dy));
    plane.style.transform = `translate(${state.mapPan.x}px, ${state.mapPan.y}px)`;
  });
  const endDrag = (event) => {
    dragging = false;
    viewport.releasePointerCapture?.(event.pointerId);
    window.setTimeout(() => {
      state.mapDragMoved = false;
    }, 0);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
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
  const role = roleForUnit(unit);
  node.classList.add(unit.rarity);
  if (unit.eternalKey) node.classList.add(`eternal-${unit.eternalKey}`);
  node.querySelector("h3").textContent = unit.name;
  node.querySelector(".rarity-pill").textContent = rarityData[unit.rarity].label;
  const classSlot = node.querySelector(".trait");
  classSlot.className = "class-slot";
  classSlot.textContent = "";
  classSlot.append(makeRoleBadge(role, "", unit.trait));
  if (unit.eternalKey) classSlot.append(makeEternalModifierBadge(unit.eternalKey));
  if (unitHasRole(unit, "tank") || unitHasRole(unit, "medic")) classSlot.append(makeAbilityChargeMeter(unit));
  node.querySelector(".hp").textContent = `HP ${Math.max(0, unit.hp)}/${unit.maxHp}`;
  node.querySelector(".atk").textContent = powerStatText(unit);
  node.querySelector(".spd").textContent = `SPD ${unit.spd}`;
  node.querySelector(".lvl").textContent = levelStatText(unit);
  drawSprite(node.querySelector("canvas"), unit);
  return node;
}

function makeFighter(unit) {
  const role = roleForUnit(unit);
  const combatEffect = combatEffectFor(unit);
  const token = document.createElement("article");
  token.className = `fighter-token ${unit.rarity} ${unit.hp <= 0 ? "defeated" : ""} ${state.combat.activeId === unit.id ? "active" : ""} ${state.combat.targetId === unit.id ? "target" : ""} ${combatEffect?.kind === "ability" ? "ability-burst" : ""}`;
  if (unit.eternalKey) token.classList.add(`eternal-${unit.eternalKey}`);
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  drawSprite(canvas, unit);
  const roleBadge = makeRoleBadge(role, "small");
  const badgeRow = document.createElement("span");
  badgeRow.className = "token-badges";
  badgeRow.append(roleBadge);
  if (unit.eternalKey) badgeRow.append(makeEternalModifierBadge(unit.eternalKey, "small"));
  const name = document.createElement("strong");
  name.textContent = unit.name;
  const hpbar = document.createElement("div");
  hpbar.className = "hpbar";
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(100, unit.hp / unit.maxHp * 100))}%`;
  hpbar.append(fill);
  const stats = document.createElement("div");
  stats.className = "token-stats";
  stats.textContent = `HP ${Math.max(0, unit.hp)}  ${powerStatText(unit)}  ${levelStatText(unit)}`;
  token.append(canvas, badgeRow, name, hpbar, stats);
  if (unitHasRole(unit, "tank") || unitHasRole(unit, "medic")) token.append(makeAbilityChargeMeter(unit));
  if (combatEffect) {
    const damage = document.createElement("div");
    damage.className = `damage-pop ${combatEffect.kind}-pop`;
    damage.textContent = combatEffect.text;
    token.append(damage);
  }
  if (state.combat.speech?.id === unit.id) {
    const speech = document.createElement("div");
    speech.className = "speech-bubble";
    speech.textContent = state.combat.speech.text;
    token.append(speech);
  }
  return token;
}

function powerStatText(unit) {
  return unitHasRole(unit, "medic")
    ? `HEAL ${medicHealPower(unit)}`
    : `ATK ${unit.atk}`;
}

function levelStatText(unit) {
  return `LV ${unit.level || 1}`;
}

function makeAbilityChargeMeter(unit) {
  const isMedic = unitHasRole(unit, "medic");
  const max = isMedic ? medicChargeMax(unit) : tankChargeMax;
  const current = isMedic ? medicCharge(unit) : tankCharge(unit);
  const meter = document.createElement("div");
  meter.className = `ability-charge ${isMedic ? "medic-charge" : "tank-charge"}`;
  meter.setAttribute("aria-label", `${isMedic ? "Team heal" : "Guard"} charge ${current} of ${max}`);
  for (let index = 0; index < max; index += 1) {
    const pip = document.createElement("span");
    if (index < current) pip.className = "filled";
    meter.append(pip);
  }
  return meter;
}

function makeRoleBadge(role, size = "", description = role.description) {
  const badge = document.createElement("span");
  badge.className = `class-badge role-${role.id} ${size}`.trim();
  badge.style.setProperty("--role-color", role.color);
  badge.tabIndex = 0;
  badge.setAttribute("aria-label", `${role.label}: ${description}`);
  badge.append(makeRoleIcon(role.id));

  const tooltip = document.createElement("span");
  tooltip.className = "class-tooltip";
  const title = document.createElement("strong");
  title.textContent = role.label;
  const detail = document.createElement("small");
  detail.textContent = description;
  tooltip.append(title, detail);
  badge.append(tooltip);
  return badge;
}

function makeEternalModifierBadge(key, size = "") {
  const modifier = eternalModifiers[key];
  if (!modifier) return document.createTextNode("");
  const badge = document.createElement("span");
  badge.className = `class-badge eternal-modifier ${size}`.trim();
  badge.style.setProperty("--role-color", rarityData.eternal.color);
  badge.tabIndex = 0;
  badge.setAttribute("aria-label", `${modifier.title}: ${modifier.detail}`);
  badge.append(makeEternalModifierIcon());

  const tooltip = document.createElement("span");
  tooltip.className = "class-tooltip eternal-tooltip";
  const title = document.createElement("strong");
  title.textContent = modifier.title;
  const detail = document.createElement("small");
  detail.textContent = modifier.detail;
  tooltip.append(title, detail);
  badge.append(tooltip);
  return badge;
}

function makeEternalModifierIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M12 3l2.4 5.1 5.6.8-4 4 1 5.7-5-2.7-5 2.7 1-5.7-4-4 5.6-.8L12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 8v4M12 15h.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';
  return svg;
}

function makeRoleIcon(roleId) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = roleIconMarkup(roleId);
  return svg;
}

function roleIconMarkup(roleId) {
  const icons = {
    scout: '<path d="M4 13h10l-3-4 8 3-8 3 3-4H4z" fill="currentColor"/><path d="M5 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    tank: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 7v9M8.5 10h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    snack: '<path d="M12 7c4 0 6 3 5 7-1 5-4 7-5 5-1 2-4 0-5-5-1-4 1-7 5-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 7c0-3 2-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    backliner: '<path d="M15 3l6 6-8 8-3-3 8-8-3-3z" fill="currentColor"/><path d="M8 13l3 3-4 4H4v-3l4-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    collector: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v10M15 9.5c-.8-1-2.2-1.3-3.4-.8-1.4.6-1.4 2.4.1 2.9l1.4.5c1.7.6 1.6 2.7-.1 3.2-1.3.4-2.8 0-3.7-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    medic: '<rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    brawler: '<path d="M6 10V7.5a1.5 1.5 0 0 1 3 0V10M9 10V6.5a1.5 1.5 0 0 1 3 0V10M12 10V7a1.5 1.5 0 0 1 3 0v3M15 10V8.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6.5 7H10c-3 0-5-2-5-5v-3a2 2 0 0 1 2-2h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    lordoran: '<path d="M6 9L4 5l4 2a8 8 0 0 1 8 0l4-2-2 4c1 1.2 1.5 2.6 1.5 4 0 4-3.4 7-7.5 7S4.5 17 4.5 13c0-1.4.5-2.8 1.5-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12h.1M15 12h.1M10 16c1.2.8 2.8.8 4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    enemy: '<path d="M7 20v-3c-2-1.2-3-3.2-3-5.5C4 7 7.5 4 12 4s8 3 8 7.5c0 2.3-1 4.3-3 5.5v3H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h.1M15 11h.1M10 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };
  return icons[roleId] || icons.scout;
}

function combatEffectFor(unit) {
  const explicitEffect = state.combat.effects?.find((effect) => effect.id === unit.id);
  if (explicitEffect) return explicitEffect;
  if (state.combat.targetId !== unit.id || !state.combat.damage) return null;
  const kind = state.combat.damage.startsWith("+")
    ? "heal"
    : state.combat.damage.startsWith("-")
      ? "damage"
      : "ability";
  return { text: state.combat.damage, kind };
}

function drawSprite(canvas, unit) {
  if (unit.type === "lordoran") {
    drawLordoran(canvas, unit.seed);
    return;
  }
  if (unit.eternalKey) {
    drawEternalSprite(canvas, unit.eternalKey);
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

function drawEternalSprite(canvas, key) {
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

  if (key === "jamie") {
    px(5, 0, 6, 3, "#5a321f");
    px(4, 2, 8, 2, "#6b3b25");
    px(6, 2, 4, 3, "#f1c6a8");
    px(6, 4, 1, 1, "#11151d");
    px(9, 4, 1, 1, "#11151d");
    px(7, 5, 2, 1, "#d96f8a");
    px(5, 5, 6, 2, "#6b3b25");
    px(6, 7, 4, 7, "#72d68b");
    px(5, 8, 1, 5, "#f1c6a8");
    px(10, 8, 1, 5, "#f1c6a8");
    px(4, 13, 2, 2, "#72d68b");
    px(10, 13, 2, 2, "#72d68b");
    px(3, 4, 1, 10, "#f6f2e8");
    px(2, 4, 3, 1, "#72d68b");
    px(3, 3, 1, 3, "#72d68b");
    px(7, 9, 2, 1, "#f6f2e8");
    px(8, 8, 1, 3, "#f6f2e8");
    px(6, 15, 2, 1, "#2d3340");
    px(9, 15, 2, 1, "#2d3340");
    return;
  }

  if (key === "andrew") {
    px(5, 2, 6, 2, "#f3d36a");
    px(6, 3, 4, 3, "#f0c3a2");
    px(6, 5, 1, 1, "#11151d");
    px(9, 5, 1, 1, "#11151d");
    px(7, 6, 3, 1, "#9b5b3e");
    px(4, 7, 8, 5, "#4aa3ff");
    px(3, 8, 2, 5, "#2f6fc5");
    px(11, 8, 2, 5, "#2f6fc5");
    px(5, 12, 3, 3, "#2d3340");
    px(9, 12, 3, 3, "#2d3340");
    px(2, 8, 4, 5, "#b9fff4");
    px(3, 9, 2, 3, "#4aa3ff");
    px(7, 8, 2, 2, "#b9fff4");
    return;
  }

  if (key === "phillip") {
    px(3, 2, 10, 2, "#11151d");
    px(4, 1, 8, 2, "#2d3340");
    px(5, 3, 6, 2, "#0a0d13");
    px(6, 4, 4, 3, "#f0c3a2");
    px(6, 6, 1, 1, "#11151d");
    px(9, 6, 1, 1, "#11151d");
    px(7, 7, 2, 1, "#d96f8a");
    px(4, 8, 8, 4, "#f06a6a");
    px(3, 9, 2, 4, "#f0c3a2");
    px(11, 9, 2, 4, "#f0c3a2");
    px(5, 12, 3, 3, "#2d3340");
    px(9, 12, 3, 3, "#2d3340");
    px(2, 10, 3, 2, "#f06a6a");
    return;
  }

  if (key === "lucas") {
    px(5, 2, 6, 2, "#5a321f");
    px(6, 3, 4, 3, "#f0c3a2");
    px(6, 5, 1, 1, "#11151d");
    px(9, 5, 1, 1, "#11151d");
    px(6, 6, 4, 2, "#4b2818");
    px(4, 8, 8, 5, "#a46cff");
    px(3, 9, 2, 4, "#f0c3a2");
    px(11, 9, 2, 4, "#f0c3a2");
    px(5, 13, 3, 2, "#2d3340");
    px(9, 13, 3, 2, "#2d3340");
    px(12, 9, 1, 4, "#dfe7ff");
    px(13, 8, 1, 3, "#f6f2e8");
    px(11, 10, 2, 1, "#2d3340");
    px(13, 7, 1, 1, "#b9fff4");
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
