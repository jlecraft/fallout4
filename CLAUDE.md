# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fallout 4 Character Planner — a static single-page web app for planning Fallout 4 character builds (S.P.E.C.I.A.L. stats and perks).

## Development

No build system, bundler, or package manager. Open `index.html` directly in a browser or serve with any static file server. No tests or linting configured.

## Architecture

- **`index.html`** — Page layout with Bootstrap 3 grid. Left column: S.P.E.C.I.A.L. stat controls + summary. Right column: perk table. Loads jQuery 2.1.4 and Bootstrap 3.3.5 from CDN.
- **`js/perks.js`** — Data file defining the global `perks` array. Each of the 7 S.P.E.C.I.A.L. categories contains 10 perks, each with ranked descriptions and level requirements. ~1800 lines.
- **`js/scripts.js`** — All application logic. Key concepts:
  - `totalPoints` (28) — starting allocation pool for S.P.E.C.I.A.L.
  - `renderAll()` — main render loop: re-renders perks table, points remaining, required level, summary, and updates URL hash
  - State is stored in two places: DOM inputs for S.P.E.C.I.A.L. values, and `currentRank` property mutated directly on perk objects in the `perks` array
  - URL hash stores base64-encoded JSON of the full build for sharing/bookmarking (`getJSON()`/hash parsing on load)
  - Bobblehead checkbox shifts min/max S.P.E.C.I.A.L. values by 1 and grants 8 extra points
  - Perk availability is determined by comparing perk row index against the S.P.E.C.I.A.L. value for that column
- **`css/site.css`** — Minimal custom styles (perk tiles, overlays, rank highlighting)
- **`img/`** — One PNG icon per perk, filenames match `img` property in perks.js data

## Conventions

- Vanilla jQuery for DOM manipulation — no frameworks or templating
- Use `let`/`const` (not `var`) — see commit history for recent cleanup
- Perk data uses 2-letter S.P.E.C.I.A.L. abbreviations: `st`, `pe`, `en`, `ch`, `in`, `ag`, `lu`
