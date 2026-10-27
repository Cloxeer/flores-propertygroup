# Flores Hub — first look (Flores Property Group)

A mobile-first transaction hub prototype for Anela Flores. Early preview: sample data in the tour, an empty private
workspace saved only on the visitor's device.

## Where things are
| Path | What |
|---|---|
| `app/` | Source (Vite + React 19 + Tailwind 4 + wouter). `app/src/pages/Landing.tsx` is the front door; the hub lives under `#/app`. |
| `public/` | Build output of `app/` (served by Halite's static preview). |
| `docs/` | Publish copy, built by Halite (`buildProjectDocs`) for GitHub Pages. |
| `reference/` | The untouched Manus original, a de-minified copy and the rebuild briefs. Not needed to run or publish. |
| `app/qa/mobile-audit.js` | Phone audit. Paste into the console at 390×844; every line must read ok / 0. |

## Build
```bash
cd app
npm install
npm run build      # type-checks, then writes ../public
```
Then rebuild the publish copy from the Halite repo root:
```bash
npx tsx -e "import { buildProjectDocs } from './src/lib/site/build-docs'; buildProjectDocs('ws_flores-property-group_k4q8vn')"
```

## Publish
Halite → project → **Deploy** → Save (builds `docs/`, commits, pushes) → **Make public & go live**.
Routes use the URL hash (`#/app/tasks`), so the app works from any address or sub-folder with no server rules.
The page is `noindex`. Before making the repo public, decide whether `reference/` should be published.

## How data works (local-first)
- Tour: seeded sample data, key `flores-demo-v1`.
- Private workspace: starts empty, key `flores-private-v1`, **this device only**, no sync, not encrypted.
- Settings → *Your data*: download / restore / erase. Today nudges for a backup every 7 days.
- A real backend (login, team access, client links) is the next step when Gabriella or clients need access.
