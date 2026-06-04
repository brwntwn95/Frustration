# Frustration Rummy Web

A small web multiplayer version of Frustration Rummy designed for easy family play.

## Run Locally

```powershell
node server.js
```

Open `http://localhost:3000`, create a game, then text the four-character code to the other players.

## Deploy

This app is intentionally simple:

- one Node process
- no database
- static files served from `public`
- WebSocket game rooms kept in memory

Good low-cost hosting options are a small AWS Lightsail instance, Fly.io, Render, Railway, or any VPS that can run Node. Set the `PORT` environment variable if your host requires a specific port.

## Default Rules

The default contract list is in `server.js` under `CONTRACTS`. Frustration Rummy has many house-rule variants, so edit that list if your family uses different rounds.

Current assumptions:

- 2 combined decks plus jokers
- 11 cards per player
- Jokers are wild
- Players draw, optionally lay down/add to melds, then discard
- Cards are private until a player lays down
- Points left in hand are added after a player goes out
- The player who goes out advances to the next contract

## Notes

Room state is in memory. If the server restarts, active games are lost. For a family table this is usually fine; for public hosting, add persistence and reconnect tokens.
