# Ring Road 3D / 2.5D Ring Renderer Plan

## Status

Design and implementation plan only. Do **not** replace the current gameplay renderer until the alternate renderer is visually and functionally validated.

Visual reference: [`3d-ring-renderer-concept.jpg`](./3d-ring-renderer-concept.jpg)

![Ring Road 3D concept](./3d-ring-renderer-concept.jpg)

## Why explore this

Ring Road's current presentation is deliberately minimal: seven independently rotatable concentric rings, one notch/gap per ring, discrete orientation markers, a center ball, and exact-move-count puzzle rules. The underlying game is already complete enough that a visual overhaul should be treated as a rendering problem rather than a gameplay rewrite.

A tilted, dimensional presentation can make the board feel like a physical puzzle object: raised rings, visible thickness inside gaps, subtle shadows between layers, and a more tactile sense that the player is rotating machinery or crafted material.

The generated concept image above is **directional reference, not a literal UI specification**. Its useful idea is the dimensional ring board. The scenery, fantasy architecture, decorative parchment panels, and Paper-Mario-like papercraft world are intentionally *not* requirements.

The preferred target for the actual game is:

- preserve Ring Road's dark, restrained visual identity;
- keep the current saturated ring colors;
- present the ring assembly as a premium physical object floating in a dark studio-like space;
- introduce perspective, depth, material response, shadows, and exposed notch walls;
- keep gameplay readability substantially more important than decorative realism;
- preserve mobile performance and the current simple interaction model.

## Design principle

**Make the existing board feel physical without making the game mechanically or visually noisy.**

The 3D treatment should strengthen the player's understanding of the same seven ring states. It must not introduce fake geometry that obscures where a gap is, where an orientation marker lies, or how far a ring moves per click.

No gameplay rule should depend on camera angle, apparent perspective, lighting, z-depth, texture, or animation.

## Recommended implementation approach

Use a staged **2.5D SVG/CSS renderer first**, not Three.js/WebGL.

The existing game already models ring state independently from display angle. Each ring can continue to use the same logical rotation state and the same discrete `rotationAngle()` calculation. The alternate renderer should consume the exact same puzzle state and controls.

A fixed perspective gives most of the desired visual effect while keeping:

- the current React architecture;
- SVG masks and deterministic geometry;
- crisp vector rendering;
- accessible DOM controls;
- low startup cost;
- straightforward responsive sizing;
- simple fallback to the current flat renderer;
- no new graphics runtime or 3D dependency.

Three.js/WebGL should remain an optional later escalation only if the design eventually requires moving cameras, dynamic lighting, physically modeled materials, particles, or other features that 2.5D cannot convincingly provide.

## Renderer architecture

### 1. Preserve a canonical logical board

Puzzle state remains exactly as it is now:

- ring cycles;
- ring rotations;
- board orientation;
- move history;
- alignment checks;
- solver and exact-vector logic;
- win condition.

The renderer receives state. It does not reinterpret state.

### 2. Introduce a renderer boundary

Extract the current board visualization into a clear component boundary, for example:

- `FlatRingBoard`
- `DimensionalRingBoard`

Both should accept the same props/state.

Do not fork gameplay logic between renderers.

During development, make renderer selection explicit with a temporary developer flag or small local toggle. The flat renderer remains the known-good fallback until the dimensional renderer reaches parity.

### 3. Fixed camera / projection

Start with a single fixed board angle.

Suggested starting point:

- board tilted roughly 55–65 degrees away from the viewer;
- slight vertical compression to create the ellipse/perspective impression;
- centered camera;
- no player-controlled orbit;
- no camera drift during normal moves.

The user should never need to mentally compensate for camera motion while solving.

A subtle camera settle/intro animation may be explored only after static readability is proven.

### 4. Physical ring construction

Each ring should visually consist of several layers:

1. **top surface**  
   The familiar saturated ring color.

2. **outer wall / thickness**  
   A darker tonal derivative of the top surface.

3. **inner wall / thickness**  
   Visible especially around the ring's inner circumference and notch.

4. **contact/ambient shadow**  
   Soft shadow onto the layer beneath it.

5. **highlight edge**  
   Very subtle light-facing rim, avoiding chrome/gloss.

The notch is particularly important. It should read as a real cut through a thick ring, with visible side walls. When multiple gaps align, the player should perceive a continuous physical channel through the ring stack.

### 5. Z-layer strategy

Do not rely on arbitrary hand-tuned DOM z-index tricks for every state.

Use deterministic layer ordering:

- support/base;
- ring underside or shadow;
- side wall;
- top face;
- orientation markers;
- center hub/ball.

Because rings are concentric and not spatially interpenetrating, the illusion can be achieved with controlled SVG group ordering and projected offsets.

### 6. Materials

The generated concept uses overt papercraft. For the production game, begin more restrained.

Preferred material directions to prototype:

- dense colored paper/card stock;
- matte molded polymer;
- anodized/matte precision toy;
- very subtle fiber/paper grain.

Avoid:

- noisy textures;
- obvious wood grain;
- metallic mirror reflections;
- scenery baked into the board;
- heavy bevels;
- excessive bloom.

Texture, if used at all, should disappear perceptually before it competes with orientation markers.

### 7. Orientation markers

The existing discrete markers remain mechanically important.

In the dimensional renderer, test these in order:

1. shallow embossed/dimpled dots;
2. punched recessed holes;
3. tiny low-contrast inlaid dots;
4. current flat markers as fallback.

They must remain visible on every ring size without making high-cycle rings visually busy.

Marker geometry should stay bound to ring-local rotation so it moves exactly with the ring.

### 8. Center ball and hub

The center ball is an excellent candidate for genuine-looking depth because it is visually simple and important to the completion interaction.

Target:

- small white/off-white sphere or pearl;
- soft local shadow/contact shadow;
- seated slightly into the center hub;
- retains the existing fire animation semantics.

Do not make the ball or hub so large that it hides the center notch.

### 9. Rotation animation

Each click still advances exactly one legal ring increment.

Animation goals:

- physical but quick;
- no spring overshoot that falsely suggests intermediate logical states;
- no motion blur required;
- the ring should visibly settle exactly on the marker lattice;
- concurrent visual effects must not delay input processing.

The current transform duration is a useful baseline, but test shorter durations if perspective makes movement feel slower.

### 10. Aligned-road read

The solved/near-solved state must be even clearer in 3D than in flat view.

When gaps line up:

- the combined notch should read as one radial channel;
- exposed vertical notch walls should visually reinforce continuity;
- the center ball's firing route must remain obvious;
- perspective must not make adjacent gaps appear aligned when they are not.

Do not add an explicit glowing solution line unless testing shows the physical channel alone is insufficient.

## Responsive/mobile requirements

Mobile remains a first-class requirement.

The dimensional board must:

- fit comfortably within narrow portrait widths;
- keep controls reachable;
- avoid horizontal overflow;
- maintain readable notch and marker sizes;
- avoid relying on hover;
- avoid expensive filters that tank mid-range mobile GPUs;
- degrade gracefully if reduced-motion or constrained-device behavior is needed.

The board can reduce its visual tilt on very small screens if that materially improves readability, but underlying geometry must remain unchanged.

## Performance budget

A dimensional renderer is acceptable only if ring input still feels instantaneous.

Performance rules:

- no full React-tree rebuild per animation frame;
- no canvas texture regeneration on each click;
- no runtime rasterization of every ring after state changes;
- precompute static ring geometry from puzzle cycle counts;
- animate compositor-friendly transforms where possible;
- keep shadow/filter counts modest;
- prefer shared SVG definitions/filters over repeated expensive effects;
- profile reset, rapid alternating rotations, puzzle transitions, and high-marker-count rings on mobile.

The previous rotation-lag work is a warning: visual richness may never reintroduce sluggish ring controls.

## Accessibility and user preference

The dimensional treatment must not be required to understand puzzle state.

Retain:

- current controls and labels;
- color-independent relationship between controls and rings where possible;
- readable focus states;
- reduced-motion compatibility.

Consider eventually retaining the flat renderer as an accessibility/performance display mode even if dimensional becomes the default.

## Explicit non-goals for the first implementation

Do **not** add these while building the first dimensional prototype:

- Paper Mario characters or copyrighted visual assets;
- enemy/object occupancy mechanics;
- radial sliding;
- free camera rotation;
- dynamic camera gameplay;
- elaborate scenery;
- particle systems;
- environmental animation;
- physics;
- WebGL;
- new puzzle rules;
- new controls;
- texture asset pipelines;
- lighting editors.

These all confound evaluation of the core question: *does a dimensional board improve Ring Road?*

## Implementation phases

### Phase 0 — Renderer extraction

- Extract current SVG board into a dedicated flat-renderer component.
- Define the shared renderer input contract.
- Verify pixel/behavior parity with current main.
- Add no visual changes yet.

**Exit:** flat version behaves identically.

### Phase 1 — Projection prototype

- Duplicate renderer into a dimensional experimental component.
- Apply fixed perspective/tilt.
- Confirm all seven rings remain legible.
- Tune board framing on desktop and mobile.

**Exit:** flat geometry looks convincingly tilted without broken interactions.

### Phase 2 — Ring thickness

- Add deterministic underside/side-wall construction.
- Make notch walls visible.
- Add restrained inter-ring/contact shadows.
- Ensure ring ordering never visually glitches while rotating.

**Exit:** rings read as physically thick independent layers.

### Phase 3 — Material and marker pass

- Prototype matte/paper/polymer surface treatment.
- Convert orientation markers into subtle 3D dimples/recesses if successful.
- Add restrained highlight edges.

**Exit:** physicality is obvious at a glance, but gameplay information remains dominant.

### Phase 4 — Center hub and ball

- Give center hub and ball convincing depth.
- Preserve click target and fire animation.
- Tune the solved-channel visual read.

**Exit:** center interaction is at least as clear as current main.

### Phase 5 — Motion/performance

- Profile rapid rotations and reset.
- Remove/replace expensive SVG filters where needed.
- Test highest cycle-count puzzles.
- Test portrait mobile.
- Test reduced-motion behavior.

**Exit:** no perceptible regression in interaction responsiveness.

### Phase 6 — Side-by-side evaluation

Compare flat and dimensional renderers on:

- immediate understanding of the goal;
- gap identification;
- orientation-marker legibility;
- perceived click response;
- visual appeal;
- mobile fit;
- solver/puzzle-state parity;
- reset/puzzle-transition behavior.

Make the dimensional renderer default only if it wins without qualification on state readability and responsiveness.

### Phase 7 — Production consolidation

If adopted:

- remove prototype-only switches;
- keep a deliberate fallback/display-mode strategy if useful;
- centralize shared ring geometry helpers;
- document rendering invariants near the implementation;
- add regression checks for renderer/state parity where practical.

## Acceptance criteria

The prototype is successful when all of the following are true:

- every logical state renders unambiguously;
- a one-step rotation visibly lands on exactly one adjacent legal orientation;
- gaps can be identified as quickly as in the flat renderer;
- aligned gaps read as a continuous road/channel;
- marker count is visually understandable across supported cycle sizes;
- center-ball interaction remains obvious;
- exact-move and solver behavior is untouched;
- no horizontal mobile overflow is introduced;
- rapid input and reset remain responsive;
- the renderer can be disabled without affecting game state.

## Future possibilities after adoption

Only after the fixed 2.5D version is proven:

- tiny camera settle on puzzle load;
- subtle board lift/drop between puzzles;
- more convincing cast shadow beneath the whole assembly;
- per-ring micro-elevation differences;
- material themes;
- optional speed-mode presentation;
- WebGL/Three.js experiment if there is a concrete visual behavior that SVG/CSS cannot deliver.

## Reference-image interpretation

The accompanying generated image should be read as evidence for these ideas:

- tilted circular board;
- strongly readable physical ring thickness;
- exposed walls at gaps;
- layers casting shadows onto lower layers;
- central ball as a physical object;
- colored rings remaining immediately distinguishable.

It should **not** be read as a requirement for:

- the title treatment;
- parchment UI;
- castle/environment;
- trees, waterfalls, banners, or scenery;
- exact controls/layout shown;
- a direct imitation of Paper Mario's art direction.

Ring Road should remain recognizably itself.
