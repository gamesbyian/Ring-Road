# Ring Road architecture

## Current repository state

Ring Road's active production application is a Vite-bundled React + TypeScript application. The original single-file app is frozen under `prototype/v1/`; it is evidence only and must not receive production features. `3d-ring-renderer-plan.md` now serves as the completed rebuild record plus visual/future-direction authority rather than an instruction to keep migrating architecture.

## Ownership map

| Concern | Authority |
|---|---|
| Puzzle types, normalization, legal steps, spoke mapping, alignment, cycle constraints | `src/domain/puzzle.ts` |
| Construct-from-solution authoring | `src/domain/authoring.ts` |
| Exact directed vector enumeration and wrap accounting | `src/domain/solver.ts` |
| Typed production campaign and startup validation | `src/content/campaign.ts` |
| Gameplay flow, history, reset, navigation, plan-aware hints, modal and completion state | `src/app/game-state.ts` |
| Physical board presentation | `src/render/RingBoard.tsx`, `src/render/ring-geometry.ts`, `src/styles/app.css` |
| Controls and surrounding interface | `src/App.tsx`, `src/ui/Modal.tsx` |
| Executable semantics | `src/test/` |

Use `npm run context -- --list` for cheap subsystem discovery. Do not read the archived prototype unless parity evidence is required.

## Canonical gameplay semantics

The game has seven independently rotatable concentric rings. Each puzzle owns an ID, exact target, seven prime-constrained cycles, seven initial states, and validation-only authoring assertions.

A logical state maps to a spoke in center-ring coordinates only when its angular orientation falls on that shared spoke. A puzzle is aligned when all seven mappings equal one spoke. Cosmetic `boardOrientation` rotates presentation only and never enters domain calculations.

One input changes one ring by exactly one normalized cycle step. Directed solution options use:

```
moveCount = baseDirectionalDistance + wraps * cycleLength
```

where direction is continuous and `wraps >= 0`. Completion is a two-stage interaction: alignment plus an exact move count enables the center ball, and firing it marks the puzzle complete. Completion actions open after the short ball-firing presentation (immediately under reduced motion). Dismissing the completion dialog does not unlock the solved board. Manual previous/next navigation wraps around the campaign, while the final completion dialog reports campaign mastery instead of offering another puzzle. Alignment below or above target is not completion.

The guide opens on initial application launch, then stays out of the way on reset and puzzle navigation unless the player explicitly opens it again.

Campaign entries are authored as cycle sets plus intended directed move vectors. `constructPuzzle` derives their initial states, exact targets, and wrap assertions; runtime campaign data is therefore generated from solutions rather than maintaining those facts independently. Every puzzle must have at least one exact directed vector. Every puzzle also records its expected exact-vector count. Puzzles 6, 7, 9, 10, and 11 deliberately have two vectors because a full wrapped turn can be performed in either direction; all other campaign entries require one. Validation fails if these expectations or representative prototype-parity states drift.

## Boundaries

Domain, solver, and campaign validation contain no React, DOM, SVG, or CSS dependencies. Application state coordinates flow but delegates mathematical meaning to the domain. Rendering receives puzzle/state facts and never decides legality, alignment, exactness, or wrap validity.

Static deterministic ring geometry is derived from cycle counts. Application state keeps normalized logical rotations separate from unbounded visual states, so crossing a cycle boundary animates one step in the requested direction rather than appearing to reverse almost a full turn. Individual moves use a short transition; reset and puzzle selection explicitly render without ring transitions so accumulated wraps cannot turn into queued reset animation. No per-frame React loop or raster generation is used. The current SVG/CSS renderer establishes the production physical board with a recessed base plate and rim; consistently cut top, wall, and shadow surfaces; separately shaded inner and outer edges; explicit colored notch faces; dark channel floors; recessed orientation dimples; embossed identity letters; hub; and ball. Every ring surface derives the same notch angle, preventing false bridges or mismatched wall openings across an aligned channel. Ring letters match named control groups, and each group exposes its normalized orientation and cycle to assistive technology, so color is not the only ring-to-control relationship. The renderer remains intentionally free of per-frame React work and raster regeneration; the browser smoke gate guards rapid high-cycle input and responsive interaction without adding a browser-test dependency.

## Intentional production differences

The prototype randomized cosmetic board orientation on puzzle entry. Production currently derives it deterministically from puzzle ID, preserving independence while making tests and visual reproduction stable. Reset retains the current cosmetic orientation. This is an intentional reproducibility improvement, not a gameplay change.

## Change rules

- Semantic changes update domain code, tests, campaign validation, and this document together.
- Campaign changes run full exact-vector validation.
- Render changes preserve one-step visual truth and test narrow portrait interaction directly.
- Architecture changes update `AGENTS.md`, discovery routes, and this ownership map in the same commit.
