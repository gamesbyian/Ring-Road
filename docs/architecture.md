# Ring Road architecture

## Product shape

Ring Road is a zero-build browser game currently shipped as one `index.html`. React, ReactDOM, Babel, and Tailwind are loaded from CDNs. The single-file form is deliberate for now: it keeps deployment trivial and avoids introducing a toolchain merely to reorganize code.

That does **not** mean the file is conceptually monolithic. Its named section comments define subsystem boundaries, and `scripts/context.mjs` exposes those regions cheaply.

## Puzzle model and campaign

The game has seven rings. Each puzzle supplies:

- `id`
- `targetMoves`
- `ringCycles`
- `initial`
- optional validation-only `authoring` assertions

Cycle lengths are prime-constrained, with tighter limits toward the center.

Puzzle authoring is constructive: choose a legal intended exact directed move vector and shared solved spoke, then derive starting states and the exact move target. Generated puzzles should use the same construct-from-solution approach rather than random-start-and-hope.

Campaign data is current gameplay content. Authoring assertions are validation metadata, not runtime rules.

## State ownership

React state currently owns:

- current puzzle index
- ring rotations
- cosmetic board orientation
- move count
- move history
- ball-fired state
- modal/message state
- puzzle-ready rendering state

`rotations` are logical ring states. `boardOrientationState` is cosmetic presentation only and must never affect solvability.

Reset restores the puzzle's logical initial ring states while preserving the current puzzle's cosmetic board orientation.

## Solver and win semantics

Logical truth is shared-spoke identity in center-ring coordinates.

A puzzle is aligned when every ring maps to the same shared spoke. Alignment is independent of absolute screen direction.

The solver enumerates legal directed movement options per ring and counts exact move-allocation vectors whose total equals `targetMoves`. A legal directed option may include continuous same-direction full wraps:

```
moveCount = baseDirectionalDistance + wraps * cycleLength
```

A completed puzzle requires both:

1. all rings aligned on one shared spoke; and
2. the current move count exactly equals `targetMoves`.

Reversing direction merely to waste moves is not part of the intended solution model.

## Rendering and UI

The board is currently SVG.

Outer rings are rendered independently and rotated from logical state using `rotationAngle(state, cycleLength)`. Discrete marker positions visualize each ring's available orientations.

The center ring contains the clickable center and the ball/fire animation.

Rendering may become more dimensional in future, but renderers must consume the same canonical logical state and must not duplicate or reinterpret solver/win rules.

The UI also owns:

- previous/next puzzle navigation
- move count
- undo/reset
- guide modal
- optional solution display
- completion modal

## Source-region map

Use:

```bash
npm run context -- --list
```

Current logical regions include configuration, authoring/campaign, puzzle-model helpers, validation/rendering, solver semantics, and the React app.

Search a symbol without loading the full file:

```bash
npm run context -- --find=solvePuzzleDeterministically
```

## Dependency policy

Repository-owned development tooling should remain dependency-free while that is practical. Node's standard library is enough for the current server and structural checks.

The shipped app currently depends on CDN-hosted React, ReactDOM, Babel, and Tailwind. A future bundling/offline plan would be an architectural change and should be deliberate rather than incidental.

## Change boundaries

When changing puzzle semantics, inspect model + solver + win handling + authoring comments.

When changing rendering, preserve logical state semantics and input behavior.

When changing campaign data, run structural checks and inspect exact-solution diagnostics in the browser.

When introducing a new subsystem, first ask whether an existing section/doc can own it. Avoid creating a directory tree that costs more to discover than it saves.
