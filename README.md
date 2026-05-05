# Paul's Real Tennis Scorer

A phone-first Progressive Web App for scoring real tennis matches between two players. Built with Vue 3, TypeScript, Pinia and Vite, it works offline once installed and remembers the active match plus recent history in `localStorage`.

## Real tennis scoring

Real tennis is not lawn tennis. The score format borrows the 15/30/40/game/set pattern, but it has two quirks the engine handles explicitly:

- **Chases**: when a ball bounces twice, instead of awarding the point a "chase" is laid at the spot. Chases are not played out until two are pending (or the receiver reaches set point), at which point the players switch ends and run off a chase play-off to resolve them.
- **End-switching**: the chase play-off swaps server and receiver, so the engine has to track ends and chase position, not just points.

Implementation lives in [`src/scoring/engine.ts`](src/scoring/engine.ts) and is covered by the test suite under `src/scoring/`.

## Dev workflow

```bash
npm install
npm run dev          # local dev server
npm test             # vitest run (scoring engine + store tests)
npm run typecheck    # vue-tsc --noEmit
npm run build        # type-check + production build (emits dist/sw.js + manifest)
npm run preview      # serve the built app at /real-tennis-scorer/
```

## Deploy

A push to `main` triggers the GitHub Actions workflow at `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.

**Pages is not currently enabled.** The repo is private on the free GitHub plan, which does not allow Pages publishing from private repos. To unblock deployment, pick one:

1. Make the repo public and enable Pages (Settings -> Pages -> Source: GitHub Actions).
2. Upgrade the account to a plan that allows Pages on private repos (Pro/Team).
3. Switch hosts: Cloudflare Pages publishes from private repos on the free tier - point it at `dist/` and keep the base path as `/real-tennis-scorer/` (or move to a domain root, in which case update `base` in `vite.config.ts` and the manifest's `start_url`/`scope`).

The build step in CI will succeed regardless; only the deploy step will fail until one of the above is done.

## Architecture

- **Pure scoring engine** - `src/scoring/` (no Vue, no Pinia, fully unit-testable). `engine.ts` is the state machine; `types.ts` holds the score shapes.
- **Pinia stores** - `src/stores/` (`match.ts` for the active match, `history.ts` for completed matches). Stores auto-persist to `localStorage` on change.
- **Views** - `src/views/` (Home, MatchSetup, Scoring, ChasePlayoff, History, MatchDetail), wired up via hash-router in `src/router.ts`.
- **Components** - `src/components/` (BigButton and other shared UI bits).
- **Storage** - typed `localStorage` wrapper with schema versioning at `src/lib/storage.ts`. Keys: `rts:active-match`, `rts:history`, `rts:schema-version`.
- **History cap** - the history store keeps a soft cap of **200 matches**; older entries fall off the end.

## Design assets

The placeholder PNG icons in `public/icons/` (192/512/maskable) are temporary. Final icon and visual artwork will be generated from [`claude-design-prompt.md`](claude-design-prompt.md) at the repo root - swap them in once the Claude Design assets land. The PWA manifest in `vite.config.ts` already references the final filenames, so dropping the new PNGs in place is enough.
