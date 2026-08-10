# The Team Test — Preservation Recreation

A clean-room, multiplayer browser recreation inspired by the Swedish Armed Forces' 2010 **The Team Test** campaign.

This repository contains original code and recreated geometric UI. It does **not** contain the original site's source code, Swedish Armed Forces logos, voice recordings, music, or proprietary artwork.

## What is implemented

- Four-player real-time multiplayer using Socket.IO.
- Public matchmaking or private team rooms.
- Private invite URLs in the old-style `#/private/TEAMCODE` format.
- Four player colours: red, blue, yellow and green.
- Full four-quadrant test board visible to every player.
- Shared live mouse cursors.
- Interdependent life system: completing your task gives a life point to the next player.
- Team fails when a player reaches zero.
- Increasing difficulty as the test continues.
- Memory, concentration, spatial-thinking and multitasking tests.
- Recreated team-number round: numbered circles must be removed in order by the player whose colour owns each circle.
- End-of-test team time and category results.
- Synthesised UI sounds generated in-browser, so no audio files are required.

## Run locally

Install Node.js 20+.

```bash
npm install
npm start
```

Open:

```text
http://localhost:10000
```

Open it in four browser windows/devices, create a private team in one, then use the invite URL in the other three.

## Deploy on Render

This project is intended to be a **Web Service**, rather than a Render Static Site, because Socket.IO needs a live Node server and WebSocket connections.

### Option A — existing Render service

1. Push this folder to a GitHub repository.
2. In Render, create or repoint a **Web Service** to the repo.
3. Runtime: `Node`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Health check path: `/health`
7. Deploy.

The server listens on Render's `PORT` environment variable and binds to `0.0.0.0`.

### Option B — Blueprint

The included `render.yaml` can be used as a Render Blueprint.

## Historical reconstruction notes

Public surviving material confirms the original was a four-player multiplayer test built around teamwork, with memory, concentration, spatial thinking and multitasking challenges. Players were assigned red, blue, yellow and green. A player's successful work supported another player instead of simply benefiting themselves, and the whole test ended when a member ran out of life/time.

Surviving screenshots and player descriptions also document:
- number/colour memory;
- shape/colour memory;
- searching grids of 9s and 6s;
- a mirrored-circle obstacle task;
- a team task where numbered coloured circles must be clicked in numerical order by the player assigned that colour;
- increasingly fast pacing;
- an end screen showing total survival time and category bars.

This recreation deliberately uses original implementation code rather than recovered proprietary source.

## Accuracy / next preservation pass

This version is playable, but the historical record is incomplete. For a closer visual and behavioural reconstruction, the next pass should compare the game against surviving videos/screenshots frame by frame and add:

- the mirrored two-circle obstacle course;
- any missing geometric assembly tests;
- closer timing curves;
- exact intro/instruction wording where independently documented;
- exact historical layout proportions and transition timing;
- optional replacement audio hooks for legally obtained archival audio.

The core networking and room architecture are already separated enough that those tests can be added without rewriting multiplayer.

## Attribution

Unofficial fan preservation project. "Försvarsmakten" and Swedish Armed Forces branding belong to their respective rights holders. This project is neither affiliated with nor endorsed by the Swedish Armed Forces.
