# Ring Road

Ring Road is a small browser puzzle game about rotating seven concentric rings so their gaps form one continuous radial road, while landing on an exact move count.

The project intentionally stays lightweight: the playable app is currently a single `index.html` with React, ReactDOM, Babel, and Tailwind loaded from CDNs. There is no build step and no npm dependency install required.

## Quick start

```bash
npm run dev
```

Then open the local URL printed by the server.

For repository validation:

```bash
npm run check
```

For cheap code discovery:

```bash
npm run context -- --list
npm run context -- --section=solver
npm run context -- --find=handleRotate
```

## Repository map

- `index.html` — complete current game implementation and campaign data
- `AGENTS.md` — compact task router and agent working rules
- `docs/README.md` — documentation ownership map
- `docs/architecture.md` — current application structure and boundaries
- `docs/testing.md` — local validation and finish-line rules
- `docs/periodic-repository-hygiene.md` — recurring cleanup procedure
- `scripts/context.mjs` — targeted source/context extraction
- `scripts/check-repo.mjs` — structural and puzzle-data smoke checks
- `scripts/check-context-budget.mjs` — agent-context size guard
- `.github/workflows/ci.yml` — fast zero-dependency CI

For implementation work, start with `AGENTS.md`, not by loading every document.
