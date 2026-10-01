# Ring Road Production Rebuild + Dimensional Renderer Plan

## Status

**Canonical production implementation plan. Phase 0 is complete. Phases 1–3 are implemented and verified by the committed lockfile plus the full deterministic quality gate. Phases 4–6 have a playable SVG/CSS foundation with deterministic geometry, truthful one-step motion, physical layering, reduced-motion behavior, accessible controls, and reviewed desktop/mobile production screenshots; stronger perspective, material depth, interactive browser verification, and mobile performance refinement remain. Phase 7 is partial and Phase 8 has not begun. The next exact gate is dimensional-renderer refinement plus an interactive desktop/narrow-viewport pass.**

The existing single-file Ring Road app is now considered a **prototype/reference implementation**, not the architecture to preserve.

The production game should be rebuilt cleanly around the proven puzzle semantics and the dimensional presentation goal. Existing code may be mined for behavior, formulas, puzzle data, copy, and useful implementation details, but it should not constrain the new architecture.

Visual reference: [`3d-ring-renderer-concept.jpg`](./3d-ring-renderer-concept.jpg)

![Ring Road 3D concept](./3d-ring-renderer-concept.jpg)

## Strategic decision

The prototype succeeded at its job: it established that the game works, the puzzle rules are interesting, the authored campaign is viable, and the interaction model is understandable.

The next step is **not** to keep polishing the prototype into production. The next step is to archive it intact and use it as executable design evidence while building a production implementation with clean boundaries, typed domain logic, testable puzzle semantics, maintainable rendering, and room for future visual work.

The production architecture should be chosen for the game Ring Road is becoming, not for minimum disruption to the prototype.

## What must survive from the prototype

Behavioral truth to preserve unless deliberately changed:

- seven independently rotatable concentric rings;
- prime-constrained per-ring cycle counts;
- one discrete move = one legal orientation step on one ring;
- clockwise and counterclockwise controls;
- exact move target, not a maximum;
- solved state = all ring gaps agree on one shared spoke;
- cosmetic board orientation is independent of logical solvability;
- continuous same-direction full wraps may be part of the intended exact solution;
- campaign puzzles are construct-from-solution and normally have one exact intended move-allocation vector;
- undo, reset, puzzle navigation, guide, solution display, and completion behavior;
- mobile-first usability;
- instantaneous-feeling input;
- center-ball completion interaction.

The prototype is evidence for these rules, not the permanent implementation of them.

## What does not need to survive

Do not preserve merely for compatibility:

- single-file `index.html` architecture;
- CDN-loaded runtime dependencies;
- Babel-in-browser;
- Tailwind CDN;
- prototype component boundaries;
- current state-management shape;
- current SVG implementation details;
- current CSS utility structure;
- current file layout;
- current local tooling assumptions;
- renderer fallback architecture designed around the prototype.

If a cleaner production implementation produces the same intended behavior with better testability, clarity, performance, or maintainability, prefer it.

## Archive policy

Before production implementation begins:

1. preserve the current prototype verbatim in a clearly named archive/reference location such as `prototype/v1/`;
2. include a short README describing its status and the commit it came from;
3. keep the prototype runnable enough to compare behavior and visuals during migration;
4. remove any implication that archived prototype files are current production architecture;
5. do not continue feature development in the archived copy except to document or reproduce reference behavior.

The archive is a museum exhibit with working buttons.

## Production architecture direction

The implementation agent may refine exact tooling, but the default production direction should be a conventional modern browser application:

- **TypeScript** for domain and application code;
- **React** for UI composition unless a strong concrete reason emerges to choose otherwise;
- **Vite** or equivalent lightweight bundling/dev tooling;
- modular source layout rather than a single application file;
- pure/domain modules for puzzle rules and solver logic;
- rendering isolated from gameplay state and puzzle semantics;
- unit tests for mathematical/domain behavior;
- targeted browser tests for critical interaction flows once the UI stabilizes;
- dependency count kept modest and justified.

A reasonable initial shape:

```
src/
  app/
  domain/
    puzzle/
    solver/
  content/
    campaign/
  render/
    ring-board/
  ui/
  styles/
tests/
prototype/
  v1/
docs/
scripts/
```

This is illustrative, not mandatory. Prefer clear ownership over directory ceremony.

## Architectural principles

### Domain logic is framework-independent

The following should not depend on React, DOM, SVG, CSS, or rendering libraries:

- state normalization;
- ring/spoke mapping;
- alignment checks;
- legal movement semantics;
- exact directed move-vector analysis;
- wrap accounting;
- puzzle validation;
- campaign validation;
- construct-from-solution puzzle helpers.

These functions should be directly unit-testable.

### Content is data, not component code

Campaign puzzles belong in typed content modules/data files with validation.

Authoring metadata should remain distinct from runtime gameplay fields.

### Application state owns gameplay flow

UI/application state should coordinate:

- selected puzzle;
- current ring states;
- move history;
- move count;
- cosmetic board orientation;
- modal/guide/hint state;
- completion/firing state.

The domain layer determines what those states mean.

### Rendering is downstream of truth

The renderer receives already-defined logical state.

No renderer may independently decide:

- whether rings are aligned;
- whether a move is legal;
- whether a target count is satisfied;
- which spoke is solved;
- whether wraps are valid.

This keeps future 2D, 2.5D, accessibility, debug, or WebGL renderers interchangeable.

## Visual target

The generated concept image is **directional reference, not a literal UI specification**.

Its useful ideas:

- a tilted physical board;
- strong depth;
- visibly thick rings;
- exposed notch walls;
- shadows between layers;
- a central ball as a physical object;
- immediate color distinction.

The production game should keep Ring Road's own identity:

- dark restrained environment;
- saturated ring colors;
- clean modern UI;
- minimal decoration;
- premium physical-object presentation;
- excellent mobile readability.

Do not import:

- Paper Mario characters or copyrighted visual assets;
- fantasy scenery;
- parchment UI;
- castle/environment dressing;
- decorative world-building that competes with the puzzle.

## Renderer strategy

### Default first implementation: 2.5D SVG/CSS

Begin with SVG/CSS unless a concrete prototype demonstrates that it cannot meet the target.

Why:

- crisp geometry;
- deterministic ring construction;
- DOM accessibility;
- easy responsive scaling;
- lightweight runtime;
- straightforward per-ring transforms;
- enough control for fixed-perspective physical depth.

### WebGL/Three.js is allowed if earned

Unlike the earlier prototype-preservation plan, the production rebuild is free to adopt WebGL/Three.js if evidence shows it materially improves the target.

Use it only for a concrete requirement such as:

- convincing geometry impossible to fake cleanly;
- dynamic lighting that materially improves readability;
- camera movement that becomes part of the final presentation;
- performance characteristics better than layered SVG at production complexity.

Do not choose it merely because the board is visually 3D.

## Dimensional board design

### Camera / projection

Start with a fixed camera:

- roughly 55–65° downward view;
- centered composition;
- no player-controlled orbit;
- no camera motion during ordinary moves;
- reduced tilt on narrow portrait layouts if needed for legibility.

### Ring geometry

Each ring should read as a physical annulus with a notch cut through it:

1. top surface;
2. outer wall;
3. inner wall;
4. notch side walls;
5. local/contact shadow;
6. subtle highlight edge.

Aligned gaps should create one visually continuous channel.

### Material treatment

Prototype these in restrained form:

- dense card/paper;
- matte molded polymer;
- anodized/matte precision-toy material.

Avoid noisy texture, mirror metal, gratuitous gloss, bloom, or scenery.

### Orientation markers

Test:

1. shallow dimples;
2. recessed punched holes;
3. low-contrast inlays;
4. flat markers as fallback.

Marker count must remain readable on high-cycle rings.

### Center hub and ball

The center ball should feel physically seated in the hub, with subtle depth and contact shadow, while preserving a generous interaction target and the firing animation.

### Motion

One logical move must correspond visually to exactly one legal orientation step.

No spring overshoot that implies false states.

Animation must never make input feel queued or sluggish.

## Mobile and accessibility

Mobile is a first-class production target.

Requirements:

- portrait layout without horizontal overflow;
- touch targets remain comfortable;
- gaps and orientation markers remain readable;
- no hover dependency;
- reduced-motion behavior;
- keyboard/focus semantics for controls;
- color should not be the only control-to-ring relationship;
- expensive visual effects must degrade gracefully.

An alternate simplified renderer may be retained later if it provides real accessibility or low-power value, but production should not be architected around preserving the prototype renderer itself.

## Performance requirements

Input responsiveness is part of correctness.

Production rules:

- no full-tree work per animation frame;
- precompute static ring geometry from cycle counts;
- avoid raster regeneration on move;
- prefer compositor-friendly transforms;
- cache deterministic geometry;
- keep expensive filters/shadows bounded;
- profile rapid alternating rotation, reset, puzzle changes, and high-cycle rings;
- validate on mobile hardware, not desktop alone.

## Testing strategy

### Domain tests

Before visual migration is considered complete, add executable tests for:

- normalization;
- rotation/state equivalence;
- spoke mapping;
- aligned/not-aligned cases;
- target-state enumeration;
- exact directed solution counting;
- wraps;
- cycle constraints;
- all production campaign puzzles having valid intended solutions;
- uniqueness expectations;
- reset/state-transition invariants that belong outside rendering.

### Prototype parity tests

Use the archived prototype as reference evidence.

For representative puzzles, compare:

- initial state;
- legal single-step transitions;
- alignment outcomes;
- intended exact solution;
- wrap behavior;
- reset semantics;
- target move handling.

Do not blindly preserve prototype bugs. If behavior differs, decide and document which behavior is canonical.

### Browser tests

Once the production UI stabilizes, cover critical flows:

- rotate CW/CCW;
- undo;
- reset;
- puzzle navigation;
- exact target completion;
- under-target/over-target aligned states;
- center fire;
- responsive portrait layout.

## Implementation phases

### Phase 0 — Freeze and archive prototype

- snapshot current prototype into `prototype/v1/`;
- record source commit;
- keep it runnable for comparison;
- update repo routing/docs so production work no longer targets archived code;
- establish production source root and tooling.

**Exit:** prototype is clearly frozen; production has a clean empty runway.

### Phase 1 — Production foundation

- choose/finalize TypeScript + React + Vite or justified alternative;
- create modular source layout;
- add lint/typecheck/test/build commands;
- keep CI fast;
- update agent routing to production paths;
- preserve token-cheap discovery.

**Exit:** production app boots with a minimal shell and all core quality gates are executable.

### Phase 2 — Domain migration

- migrate puzzle types, cycle constraints, normalization, spoke math, alignment logic, solver, wrap semantics, and campaign validation into framework-independent modules;
- migrate campaign data;
- add domain tests;
- compare representative behavior against prototype.

**Exit:** game rules are production-owned and tested without rendering.

### Phase 3 — Application state and controls

- implement puzzle selection, ring movement, history, reset, move count, cosmetic board orientation, hint/guide/completion state;
- wire controls to domain logic;
- keep rendering intentionally simple at first.

**Exit:** production build is mechanically playable and matches intended prototype behavior.

### Phase 4 — Dimensional renderer foundation

- implement fixed camera/projection;
- create deterministic physical ring geometry;
- preserve exact logical-to-visual orientation mapping;
- establish responsive framing.

**Exit:** all seven rings are playable in the new dimensional board.

### Phase 5 — Physical depth and materials

- add top/side/notch-wall surfaces;
- shadows and restrained highlights;
- orientation marker treatment;
- center hub and ball;
- tune aligned-channel readability.

**Exit:** board clearly reads as a premium physical object without sacrificing puzzle legibility.

### Phase 6 — Motion, accessibility, performance

- tune rotation and firing motion;
- add reduced-motion behavior;
- verify keyboard/touch semantics;
- profile mobile;
- simplify expensive effects where needed.

**Exit:** production interaction is responsive and accessible across target layouts.

### Phase 7 — UI polish and production parity

- rebuild guide, solution display, navigation, move counter, completion state, and surrounding UI in the new design system;
- remove temporary migration/debug UI;
- add critical browser coverage.

**Exit:** production build fully supersedes the prototype for gameplay.

### Phase 8 — Consolidation

- update architecture docs to final implementation;
- remove migration-only adapters;
- ensure prototype is reference-only;
- confirm all CI/checks are green;
- verify no current docs still route agents into prototype code.

**Exit:** repository has one obvious production path and one clearly archived prototype.

## Acceptance criteria

The production rebuild is complete when:

- prototype is preserved but no longer acts as production code;
- production code has explicit domain/application/render boundaries;
- puzzle semantics are unit-tested;
- campaign validation is executable;
- all intended prototype gameplay behavior is either preserved or consciously superseded;
- every logical state renders unambiguously;
- one click visibly equals one legal step;
- aligned gaps read as one continuous channel;
- marker counts remain legible;
- center-ball completion is obvious;
- exact-move semantics and wraps work correctly;
- portrait mobile layout is comfortable;
- rapid input/reset remain responsive;
- CI provides fast deterministic feedback;
- a fresh agent can discover the correct production subsystem without loading the prototype or the entire codebase.

## Future possibilities

After production consolidation:

- subtle camera settle on puzzle load;
- board lift/drop between puzzles;
- richer but still restrained material themes;
- optional rapid-fire / speed mode;
- procedural puzzle generation using the same construct-from-solution system;
- alternate renderer only where it provides concrete accessibility/performance value;
- WebGL escalation if a specific visual requirement justifies it.

## Reference-image interpretation

Read the image as a statement about **physicality and perspective**, not franchise imitation.

Keep:

- tilted board;
- ring thickness;
- gap walls;
- layered shadows;
- tactile center object;
- strong color hierarchy.

Reject:

- copied franchise art direction;
- decorative environment as gameplay framing;
- visual clutter;
- UI ornament that overwhelms the board.

Ring Road should emerge from the rebuild looking like a finished version of itself.
