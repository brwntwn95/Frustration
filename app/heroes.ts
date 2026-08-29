export type HeroRole = 'tank' | 'damage' | 'support';

export type Hero = {
  key: string;
  name: string;
  role: HeroRole;
  stadium: boolean;
  image: string;
};

export const HEROES: Hero[] = [
  {
    "key": "ana",
    "name": "Ana",
    "role": "support",
    "stadium": true,
    "image": "/heroes/ana.png"
  },
  {
    "key": "anran",
    "name": "Anran",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/anran.png"
  },
  {
    "key": "ashe",
    "name": "Ashe",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/ashe.png"
  },
  {
    "key": "baptiste",
    "name": "Baptiste",
    "role": "support",
    "stadium": false,
    "image": "/heroes/baptiste.png"
  },
  {
    "key": "bastion",
    "name": "Bastion",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/bastion.png"
  },
  {
    "key": "brigitte",
    "name": "Brigitte",
    "role": "support",
    "stadium": true,
    "image": "/heroes/brigitte.png"
  },
  {
    "key": "cassidy",
    "name": "Cassidy",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/cassidy.png"
  },
  {
    "key": "dmon",
    "name": "D.Mon",
    "role": "tank",
    "stadium": false,
    "image": "/heroes/dmon.png"
  },
  {
    "key": "domina",
    "name": "Domina",
    "role": "tank",
    "stadium": false,
    "image": "/heroes/domina.png"
  },
  {
    "key": "doomfist",
    "name": "Doomfist",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/doomfist.png"
  },
  {
    "key": "dva",
    "name": "D.Va",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/dva.png"
  },
  {
    "key": "echo",
    "name": "Echo",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/echo.png"
  },
  {
    "key": "emre",
    "name": "Emre",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/emre.png"
  },
  {
    "key": "freja",
    "name": "Freja",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/freja.png"
  },
  {
    "key": "genji",
    "name": "Genji",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/genji.png"
  },
  {
    "key": "hanzo",
    "name": "Hanzo",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/hanzo.png"
  },
  {
    "key": "hazard",
    "name": "Hazard",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/hazard.png"
  },
  {
    "key": "illari",
    "name": "Illari",
    "role": "support",
    "stadium": false,
    "image": "/heroes/illari.png"
  },
  {
    "key": "jetpack-cat",
    "name": "Jetpack Cat",
    "role": "support",
    "stadium": true,
    "image": "/heroes/jetpack-cat.png"
  },
  {
    "key": "junker-queen",
    "name": "Junker Queen",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/junker-queen.png"
  },
  {
    "key": "junkrat",
    "name": "Junkrat",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/junkrat.png"
  },
  {
    "key": "juno",
    "name": "Juno",
    "role": "support",
    "stadium": true,
    "image": "/heroes/juno.png"
  },
  {
    "key": "kiriko",
    "name": "Kiriko",
    "role": "support",
    "stadium": true,
    "image": "/heroes/kiriko.png"
  },
  {
    "key": "lifeweaver",
    "name": "Lifeweaver",
    "role": "support",
    "stadium": false,
    "image": "/heroes/lifeweaver.png"
  },
  {
    "key": "lucio",
    "name": "Lúcio",
    "role": "support",
    "stadium": true,
    "image": "/heroes/lucio.png"
  },
  {
    "key": "mauga",
    "name": "Mauga",
    "role": "tank",
    "stadium": false,
    "image": "/heroes/mauga.png"
  },
  {
    "key": "mei",
    "name": "Mei",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/mei.png"
  },
  {
    "key": "mercy",
    "name": "Mercy",
    "role": "support",
    "stadium": true,
    "image": "/heroes/mercy.png"
  },
  {
    "key": "mizuki",
    "name": "Mizuki",
    "role": "support",
    "stadium": false,
    "image": "/heroes/mizuki.png"
  },
  {
    "key": "moira",
    "name": "Moira",
    "role": "support",
    "stadium": true,
    "image": "/heroes/moira.png"
  },
  {
    "key": "orisa",
    "name": "Orisa",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/orisa.png"
  },
  {
    "key": "pharah",
    "name": "Pharah",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/pharah.png"
  },
  {
    "key": "ramattra",
    "name": "Ramattra",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/ramattra.png"
  },
  {
    "key": "reaper",
    "name": "Reaper",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/reaper.png"
  },
  {
    "key": "reinhardt",
    "name": "Reinhardt",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/reinhardt.png"
  },
  {
    "key": "roadhog",
    "name": "Roadhog",
    "role": "tank",
    "stadium": false,
    "image": "/heroes/roadhog.png"
  },
  {
    "key": "shion",
    "name": "Shion",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/shion.png"
  },
  {
    "key": "sierra",
    "name": "Sierra",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/sierra.png"
  },
  {
    "key": "sigma",
    "name": "Sigma",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/sigma.png"
  },
  {
    "key": "sojourn",
    "name": "Sojourn",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/sojourn.png"
  },
  {
    "key": "soldier-76",
    "name": "Soldier: 76",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/soldier-76.png"
  },
  {
    "key": "sombra",
    "name": "Sombra",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/sombra.png"
  },
  {
    "key": "symmetra",
    "name": "Symmetra",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/symmetra.png"
  },
  {
    "key": "torbjorn",
    "name": "Torbjörn",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/torbjorn.png"
  },
  {
    "key": "tracer",
    "name": "Tracer",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/tracer.png"
  },
  {
    "key": "vendetta",
    "name": "Vendetta",
    "role": "damage",
    "stadium": true,
    "image": "/heroes/vendetta.png"
  },
  {
    "key": "venture",
    "name": "Venture",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/venture.png"
  },
  {
    "key": "widowmaker",
    "name": "Widowmaker",
    "role": "damage",
    "stadium": false,
    "image": "/heroes/widowmaker.png"
  },
  {
    "key": "winston",
    "name": "Winston",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/winston.png"
  },
  {
    "key": "wrecking-ball",
    "name": "Wrecking Ball",
    "role": "tank",
    "stadium": false,
    "image": "/heroes/wrecking-ball.png"
  },
  {
    "key": "wuyang",
    "name": "Wuyang",
    "role": "support",
    "stadium": true,
    "image": "/heroes/wuyang.png"
  },
  {
    "key": "zarya",
    "name": "Zarya",
    "role": "tank",
    "stadium": true,
    "image": "/heroes/zarya.png"
  },
  {
    "key": "zenyatta",
    "name": "Zenyatta",
    "role": "support",
    "stadium": true,
    "image": "/heroes/zenyatta.png"
  }
];

