# Paul's Real Tennis Scorer

A Vue 3 PWA for scoring real tennis matches — including chases, the dedans, the grille, the tambour, and all the other oddities. Built to run offline on a phone propped at the side of the court.

## Stack

- Vue 3 + TypeScript
- Vite + `vite-plugin-pwa` (Workbox precache for full offline support)
- Pinia for state, Vue Router (hash mode) for navigation
- Vitest + jsdom for tests

## Scripts

```bash
npm run dev        # local dev server
npm test           # run the Vitest suite
npm run build      # type-check + production build into dist/
npm run typecheck  # vue-tsc --noEmit
npm run preview    # preview the built app
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. The site lives under the `/real-tennis-scorer/` base path; the app uses `createWebHashHistory` so deep links work on Pages without 404s.

## Layout

- `src/scoring/` — pure scoring engine, types, and tests. Real tennis rules are documented inline here.
- `src/stores/` — Pinia stores (live match + persisted history).
- `src/views/` + `src/components/` — UI.
- `src/lib/` — small utilities (id, storage wrapper).
