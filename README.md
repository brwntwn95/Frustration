# Group Up — Overwatch Hero Roulette

A responsive wheel picker for groups who want to:

- enter any number of player names;
- spin the full Overwatch roster through D.Mon;
- filter heroes by Tank, DPS, or Healer / Support;
- switch to a Stadium-only hero pool using the official Stadium mode icon; and
- see every eligible hero portrait underneath the wheel.

The app is fully client-side. Custom names are saved only in the current browser's local storage.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy with GitHub and Render

1. Create a new empty GitHub repository.
2. Add this entire folder to the repository and push it to the default branch.
3. In Render, choose **New → Blueprint**.
4. Connect the GitHub repository.
5. Render will detect `render.yaml`, build the site, publish `dist/client`, and redeploy after each commit.

No environment variables or database are needed.

## Update the roster

Hero data is stored in `app/heroes.ts`. Portraits live in `public/heroes`. Keep both in sync when Blizzard adds or changes heroes.

The starting roster and mode eligibility were checked against Blizzard's current hero and Stadium galleries on August 30, 2026. Portrait files are Blizzard-hosted hero artwork downloaded into the project so deployed builds do not rely on a runtime image API.

## Fan project notice

This is an unofficial fan-made picker. Overwatch, its characters, the Stadium symbol, and hero artwork are trademarks and property of Blizzard Entertainment.
