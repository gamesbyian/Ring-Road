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
| Physical board presentation | Production: `src/render/PaintedScene.tsx`, `src/render/painted-geometry.ts` and `src/render/painted-ring-retopology.ts` (source pixel warp only). Retired classic `RingBoard.tsx` is non-runtime historical implementation. |
| Diorama composition, responsive scenic layers, and runtime art inventory | Production painted-only: `src/render/PaintedScene.tsx`, `src/styles/painted-stage.css`, source masters in `art-source/ring-road-2026-10-13/`, twenty SHA-checked WebPs in `public/reference-skin/`, and source-registered title/Goal/Solution art. Retired `DioramaScene.tsx` remains historical, not part of the app bundle. |
| Controls and surrounding interface | `src/App.tsx`, `src/ui/Modal.tsx` |
| Executable semantics | `src/test/` |

Use `npm run context -- --list` for cheap subsystem discovery. Do not read the archived prototype unless parity evidence is required.

## Painted-only renderer and Pixel 6 Pro layout

On 2026-10-19 the owner selected painted as the **sole production presentation for browser and Android**. `?skin=classic` and `?skin=painted` are accepted as legacy URLs but do not select a renderer: all URLs show painted. `src/App.tsx` waits for the 20-file manifest, image decoding and seven C-ring texture preparation, then mounts `PaintedScene` and `PaintedRingBoard` over the single React reducer. If artwork is missing or corrupt, the app reports a visible retryable asset-loading failure instead of silently showing the old classic art. Historical classic renderer files remain reference code and are not imported into production.

The reference composition is an 864-logical-pixel landscape canvas. Pixel 6 Pro (19.5:9; 1440×3120 physical; nominal **892×412 CSS landscape** at DPR 3.5) is the primary usability target. A logical Pixel profile includes safe left/right tappable gutters, the whole seven-row control rail, HUD, assistance and true center fire. CSS-rotated **412×892 portrait** is the same full game, never a separate UI. Reduced usable window **840×360 CSS** is a browser-chrome/cutout stress case. Native status and navigation bars are immersive but cannot stand in for physical device verification.

Visual regression compares 1536×864 canonical artwork and runs strict Chrome physical-coordinate clicks, 11-move exact completion, Modal/Escape and landscape/portrait viewport sweeps. Native 892×412 screenshots are additionally emulated at **DPR 3.5**. These are simulated evidence; Android hardware previously exhibited missing/flickering painted layers. See [Pixel / Android acceptance](android.md) and [physical painted-device protocol](painted-physical-device-acceptance.md); the hardware issue remains open until rerun on device. The game domain and reducer are unchanged.

## Native Android packaging

Capacitor 7 in `android/` packages this same painted-only app with offline assets. `capacitor.config.ts` and `scripts/prepare-android.mjs` own asset sync and the immersive Activity; `src/app/android-back.ts` maps system Back to the existing modal Escape handler or minimizes the game. Android does not lock the OS orientation. A green APK build is necessary but not sufficient for physical Pixel acceptance.

## Canonical gameplay semantics

The game has seven independently rotatable concentric rings. Each puzzle owns an ID, exact target, seven prime-constrained cycles, seven initial states, and validation-only authoring assertions.

A logical state maps to a spoke in center-ring coordinates only when its angular orientation falls on that shared spoke. A puzzle is aligned when all seven mappings equal one spoke. Cosmetic `boardOrientation` rotates presentation only and never enters domain calculations.

One input changes one ring by exactly one normalized cycle step. Directed solution options use:

```
moveCount = baseDirectionalDistance + wraps * cycleLength
```

where direction is continuous and `wraps >= 0`. Completion is a two-stage interaction: alignment plus an exact move count enables the center ball, and firing it marks the puzzle complete. Completion actions open after the short ball-firing presentation (immediately under reduced motion). Dismissing the completion dialog does not unlock the solved board. Manual previous/next navigation wraps around the campaign, while the final completion dialog reports campaign mastery instead of offering another puzzle. Alignment below or above target is not completion. Alignment at the target is also insufficient if any ring reversed direction during the counted route: each moved ring must keep one direction for the entire attempt. This preserves the exact directed-vector model in live gameplay and prevents CW/CCW cancellation padding while still allowing same-direction full wraps.

The guide opens on initial application launch, then stays out of the way on reset and puzzle navigation unless the player explicitly opens it again.

Campaign entries are authored as cycle sets plus intended directed move vectors. `constructPuzzle` derives their initial states, exact targets, and wrap assertions; runtime campaign data is therefore generated from solutions rather than maintaining those facts independently. Every puzzle must have at least one exact directed vector. Every puzzle also records its expected exact-vector count. Puzzles 6, 7, 9, 10, and 11 deliberately have two vectors because a full wrapped turn can be performed in either direction; all other campaign entries require one. Validation fails if these expectations or representative prototype-parity states drift.

## Boundaries

Domain, solver, and campaign validation contain no React, DOM, SVG, or CSS dependencies. Application state coordinates flow but delegates mathematical meaning to the domain. Rendering receives puzzle/state facts and never decides legality, alignment, exactness, or wrap validity. `DioramaScene` is a presentation-only boundary: its responsive `<picture>` layers are decorative, pointer-inert, selected by media query, and registered in a typed asset manifest; the board and functional UI do not depend on image decode or load events.

Presentation has one canonical orientation: landscape. Landscape viewports render the application normally. Portrait viewports resize the existing `.app-shell` to the viewport's swapped dynamic dimensions and rotate that complete shell 90 degrees with CSS, so the board, controls, HUD, navigation, and all modal/overlay content remain one presentation tree. Responsive breakpoints and scenic asset selection use the logical landscape width (physical width in landscape, physical height in portrait); there is no separate portrait layout or JavaScript orientation state. The portrait host clips document scrolling and lets the transformed shell own overflow, while safe-area insets are remapped through the rotation.

Static deterministic ring geometry is derived from cycle counts. Application state keeps normalized logical rotations separate from unbounded visual states, so crossing a cycle boundary animates one step in the requested direction rather than appearing to reverse almost a full turn. Individual moves use a short transition; reset and puzzle selection explicitly render without ring transitions so accumulated wraps cannot turn into queued reset animation. No per-frame React loop or raster generation is used. The current SVG/CSS renderer establishes the production physical board with a recessed base plate and rim; consistently cut top, wall, and shadow surfaces; separately shaded inner and outer edges; explicit colored notch faces; dark channel floors; recessed orientation dimples; embossed identity letters; hub; and ball. Every ring surface derives the same notch angle, preventing false bridges or mismatched wall openings across an aligned channel. Ring letters match named control groups, and each group exposes its normalized orientation and cycle to assistive technology, so color is not the only ring-to-control relationship. The renderer remains intentionally free of per-frame React work and raster regeneration; channel floors and notch faces are cached as ring-local geometry and share the same rotor transform as the visible ring surfaces, so physical cut geometry cannot jump ahead of an animated step; the browser smoke gate guards rapid high-cycle input and responsive interaction without adding a browser-test dependency.

## Intentional production differences

The prototype randomized cosmetic board orientation on puzzle entry. Production currently derives it deterministically from puzzle ID, preserving independence while making tests and visual reproduction stable. Reset retains the current cosmetic orientation. This is an intentional reproducibility improvement, not a gameplay change.

## Change rules

- Semantic changes update domain code, tests, campaign validation, and this document together.
- Campaign changes run full exact-vector validation.
- Render changes preserve one-step visual truth and test narrow portrait interaction directly.
- Architecture changes update `AGENTS.md`, discovery routes, and this ownership map in the same commit.
