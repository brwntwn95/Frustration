# Lordoran: Branchbound

A browser based roguelike auto-battler prototype starring Lordoran, a large cartoon cat party leader.

## Features

- Super Auto Pets-style automatic battles with visible attack-by-attack resolution.
- Browser-generated attack and hit sounds with an in-game sound toggle.
- FTL-style forward map choices with four branches per stage, where shops and events are rarer special nodes.
- Five-member party limit with selling between stages.
- Coins, shops, healing, buffs, and recruit rewards.
- Early fights use a slow difficulty ramp that roughly tracks party size.
- Defeat ends the run, scores coins earned and fights cleared, then resets Lordoran to the start.
- Rarity rolls that improve as the run advances:
  - Common: blue
  - Rare: purple
  - Legendary: gold
  - Eternal: white-teal
- Procedural pixel characters for recruits and enemies.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Render Deploy

Use a Render Web Service connected to the GitHub repository.

- Runtime: Node
- Build command: leave blank
- Start command: `npm start`

Render will provide `PORT`; `server.js` uses it automatically.

You can also use the included `render.yaml` as a Render blueprint.
