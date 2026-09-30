# Ring Road architecture

## Current repository state

Ring Road is entering a **production rebuild**.

The existing single-file browser app is a proven prototype/reference implementation. It established the game rules, campaign behavior, interaction model, and early visual language, but it is no longer the architecture to preserve.

The production implementation is governed by `docs/3d-ring-renderer-plan.md`.

Until the rebuild is complete, distinguish carefully between:

- **prototype truth**: useful evidence about intended behavior;
- **production truth**: code and tests in the new production source tree;
- **plan authority**: the target architecture and migration sequence.

When production and prototype disagree, do not silently copy either. Resolve the intended behavior explicitly and encode it in production tests/docs.

## Canonical gameplay semantics

These are product rules, not prototype implementation details.

The game has seven independently rotatable concentric rings.

Each puzzle defines:

- an ID;
- exact target move count;
- per-ring cycle lengths;
- per-ring initial logical states;
- optional authoring/validation assertions.

Cycle lengths are prime-constrained, with tighter limits toward the center.

Puzzle authoring is constructive: choose an intended exact directed move vector and shared solved spoke, derive initial states and target moves, then validate.

## Solver and win semantics

Logical truth is shared-spoke identity in center-ring coordinates.

A puzzle is aligned when every ring maps to the same shared spoke. Alignment is independent of absolute screen direction.

Legal directed movement may include continuous same-direction full wraps:

```
moveCount = baseDirectionalDistance + wraps * cycleLength
```

Completion requires:

1. shared-spoke alignment; and
2. current move count exactly equal to the target.

The production domain layer must own these semantics independently of React or rendering.

## Production architecture target

Default direction:

- TypeScript;
- React;
- Vite or equivalent lightweight tooling;
- pure/domain modules for puzzle rules and solver;
- typed campaign/content modules;
- explicit application-state layer;
- renderer downstream of logical state;
- unit tests for domain behavior;
- targeted browser tests for critical flows;
- modest, justified dependencies.

The exact file tree may evolve during Phase 1 of the production plan. Clear ownership matters more than matching a prescribed folder diagram.

## Prototype boundary

The current single-file app should be archived under a clearly labeled prototype/reference path before production work proceeds.

Prototype code may be consulted for:

- formulas;
- puzzle data;
- UI copy;
- visual behavior;
- edge cases;
- parity checks.

Prototype code should not be extended as the main product after archival.

## Rendering boundary

Rendering consumes canonical gameplay state.

A renderer must not independently decide alignment, legal movement, target satisfaction, wrap validity, or solution structure.

The production visual target is a dimensional fixed-perspective ring board. SVG/CSS 2.5D is the default first approach, but WebGL/Three.js may be adopted if a concrete requirement justifies it.

## Change boundaries

When changing puzzle semantics, update domain logic, tests, campaign validation, and the owning documentation together.

When changing rendering, preserve domain semantics and input behavior.

When changing campaign content, validate every puzzle and intended-solution expectation.

When changing architecture, update this document and agent routing so old paths do not remain falsely authoritative.
