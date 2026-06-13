# Lordoran: Branchbound

A browser based roguelike auto-battler prototype starring Lordoran, a large cartoon cat party leader.

## Features

- Super Auto Pets-style automatic battles.
- FTL-style branching route choices with fights, elite zones, shops, and events.
- Five-member party limit with selling between stages.
- Coins, shops, healing, buffs, and recruit rewards.
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
