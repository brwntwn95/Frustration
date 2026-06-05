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

### Render

Use a **Web Service**, not a Static Site. The page can load as static files, but joining and playing needs the Node server because game rooms and WebSocket messages live there.

Render settings:

- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

If the front page loads but says it cannot connect, check that the deployed service is a Web Service and that the browser console is not showing a failed `wss://...` WebSocket request. A failed WebSocket usually means the Node process is not handling the site, or the host is not forwarding WebSocket upgrades.

## Family Rules From The Sheets

The contract list is in `server.js` under `CONTRACTS`.

Current assumptions:

- 2 combined decks, with jokers removed
- 10 cards per player plus one discard
- 2s are wild and can stand in for any card
- Melds must contain more natural cards than wild cards, except a pair may be one natural card plus one wild 2
- Ordinary runs can use mixed suits
- Hand 13 is the special black-or-red run
- Players cannot lay down during the first round of turns
- Players draw, optionally lay down/add to melds, then discard
- Cards are private until a player lays down
- Players who lay down advance to the next hand after the round; players who did not lay down stay on their current hand
- Going out scores minus 20
- Cards left in hand score: 2s and Aces 20, 3-10 face value, J/Q/K 10
- Hands 15 and 19 are down-and-out hands
- Hands 20 and 21 are down-and-out with no discard

The physical-sheet dealer bonus for cutting the exact number of cards is not automated, because the web game shuffles and deals without a manual cut step.

## Notes

Room state is in memory. If the server restarts, active games are lost. For a family table this is usually fine; for public hosting, add persistence and reconnect tokens.
