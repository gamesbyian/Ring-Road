# Ring Road Diorama Visual Overhaul Plan

## Status and authority

**Active visual-direction plan.** This plan supersedes the earlier decision in `3d-ring-renderer-plan.md` to avoid scenery and castle/environment dressing.

The reference concept image is now the intended art-direction target for the **whole play experience**, not merely a source of ideas for the concentric board. The exact castle, HUD arrangement, typography, and individual props are not specifications to copy literally. The specification is the visual language: a tactile miniature world built around a physical rainbow ring puzzle, with environmental depth, warm daylight, toy-like materials, architectural framing, and UI that belongs to the same world.

This is a presentation overhaul. Gameplay rules, puzzle content, solver behavior, exact-move semantics, application state, and current accessibility semantics remain authoritative and must not be rewritten to obtain the new look.

Visual reference: [`3d-ring-renderer-concept.jpg`](./3d-ring-renderer-concept.jpg)

## Product goal

The finished game should feel as though the player is looking down onto a lovingly constructed tabletop diorama whose central mechanism is the Ring Road puzzle.

The target experience is immediately colorful and inviting, physically dimensional rather than "SVG on a webpage", scenic enough to have a memorable identity before the player moves anything, visually coherent from board to controls to modal surfaces, readable and responsive on phones despite the richer presentation, fast enough that visual richness never compromises ring input, and original to Ring Road rather than a literal reproduction of the reference's fantasy castle.

A useful shorthand is **miniature puzzle monument in a bright storybook landscape**.

## Non-goals

- Do not change puzzle mathematics or campaign content for visual convenience.
- Do not make decorative scenery interactive unless a later product requirement explicitly calls for it.
- Do not add a free camera, orbit controls, or gameplay-relevant parallax.
- Do not move ring state or solution logic into the renderer.
- Do not replace semantic HTML controls with painted hotspots.
- Do not make scenery so dense that gaps, markers, move target, or controls become harder to read.
- Do not ship a large real-time 3D engine merely because the art direction depicts depth.
- Do not copy identifiable franchise assets, logos, characters, castle layouts, or decorative motifs from another property.
- Do not require network-loaded runtime art assets.
- Do not let mobile become a shrunken desktop composition.

## Architectural decision: composited 2.5D diorama, not real-time WebGL

### Chosen implementation

Use a **hybrid composited scene**:

1. retain the current deterministic SVG/CSS Ring Board as the live gameplay mechanism;
2. place it inside a new `DioramaScene` presentation component;
3. build the environment from a small number of authored/baked image layers plus CSS/SVG vector accents;
4. use HTML/CSS for all functional controls and text;
5. use responsive art-directed variants/crops rather than one enormous scene scaled blindly;
6. keep decorative layers pointer-inert and downstream of application state.

This gives the highest expected visual quality per unit of runtime complexity.

### Why not Three.js/WebGL

The requested look does not require arbitrary camera movement, dynamic world geometry, physically simulated light, or player interaction with the scenery. Real-time WebGL would add a second rendering model beside the existing board, asset-loading and GPU-lifecycle complexity, mobile GPU variability, more expensive accessibility integration, larger bundle/runtime cost, and more ways for the decorative shell to interfere with input responsiveness.

The environment can be rendered more beautifully as baked art than as low-complexity browser 3D. A later prototype may justify a narrowly scoped WebGL effect only if it produces a concrete visual gain that cannot be achieved robustly with the composited approach.

### Why not pure CSS/SVG illustration

Pure SVG/CSS remains ideal for the live board and UI geometry, but is a poor production medium for the reference's rich miniature environment. It would encourage hundreds of decorative DOM nodes, manual pseudo-3D geometry, and complex filters while still looking flatter than professionally baked art.

The split is therefore: **live geometry where state changes, baked illustration where scenery is static, semantic HTML where the player interacts.**

## Scene composition

### Desktop / landscape

- Large central board occupying roughly the middle 55–65% of viewport width.
- Environmental architecture wraps behind and around the board.
- Foreground plinth/steps overlap the lower edge of the scene.
- Ring controls attach visually to one side of the arena rather than floating in generic app chrome.
- Puzzle, moves, and navigation information live in compact physical plaques.
- Sky, distant terrain, foliage, water, masonry, flags, lamps, or analogous Ring Road-specific elements fill negative space.
- Board remains the strongest contrast and sharpest focal point.

The scene should have at least four visual depth bands: distant backdrop; rear architecture/terrain; board plus control plane; foreground framing.

### Mobile / portrait

Portrait mobile is a separate art direction, not a scaled desktop screenshot. Priority order is board/gaps, move target/status, ring controls, navigation/actions, then scenic identity.

At 320–430px widths:

- crop the distant scene aggressively;
- retain selected towers/trees/stonework as top/side framing;
- keep the board large enough for markers and gaps to read;
- place controls below the board in one compact physical panel;
- retain a visible slice of foreground plinth/steps so the diorama concept survives;
- do not force side-by-side HUD;
- simplify or remove decoration that competes with interaction.

Mobile should still unmistakably be the same miniature world.

## Art direction

### World

Create an original Ring Road environment with pale warm stone, bright blue sky, soft distant cliffs/mountains, stylized vegetation, optional water/moat elements, small banners/flags/lamps/geometric ornaments using Ring Road colors, stairs and masonry that make the board feel installed in a monumental plaza. The world should feel handcrafted and toy-like rather than photoreal.

### Palette

The rainbow rings remain the chromatic anchor. Environment palette: warm cream/sandstone architecture; sky and water blues; muted foliage greens; ochre/gold accents; dark navy/charcoal only for recesses, text, and high-contrast details. The current near-black page should not remain the dominant field.

### Materials

Board: matte painted wood, molded resin, dense card, or toy-like composite; clear thickness; brighter tops than walls; dark but readable channel floor; pearl/ceramic/stone-like center ball.

Environment: stylized stone, painted wood, cloth banners, broad-form foliage, restrained water highlights.

UI: cream card, carved/painted plaque, or pale stone/wood; soft shadow and bevel; dark legible typography; ring-color accents.

### Lighting

Use one coherent baked lighting direction and mirror it in CSS/SVG board treatment: warm sun from upper-left/front-left, soft sky fill, strongest occlusion in ring gaps and beneath lips/plinth edges. No neon glow, no night lighting, no conflicting shadow directions.

## Board visual overhaul

The current board remains the mechanical base but should become materially more substantial.

### Geometry

Evaluate and tune ring stroke/annulus thickness, spacing, wall depth, board rim thickness, center hub depth, outer plinth diameter, and notch-wall visibility. Rings should feel broad enough to touch, gaps should read as real cuts, and the outer platform should feel heavy enough to support the mechanism. Do not change logical orientation math or gameplay hit targets to achieve this.

### Surface treatment

Replace the dark precision-toy treatment with brighter miniature materials. Ring walls should use color-derived darker tones instead of generic charcoal. Bevel highlights should be broad and soft. Quiet texture/paint variation is allowed if it does not reduce readability.

### Orientation markers

Retain recessed dimples but tune for daylight: dark inset center, tiny lit rim, sufficient contrast on yellow/orange, and slight size tuning by radius/cycle if needed for 17/19-step legibility.

### Center ball

Make the center ball look seated in a physical socket. Fire may use a short lift/pop with shadow separation. Reduced-motion collapses this to immediate state change.

## Diorama asset system

Suggested ownership:

~~~
src/assets/diorama/
  desktop/
    backdrop.*
    rear-architecture.*
    foreground.*
  mobile/
    backdrop.*
    framing.*
  shared/
    ornaments/
    textures/
~~~

Group assets by responsive role and ownership, not export session.

Preferred formats: SVG for simple icons/plaques/banners/masks; WebP for rich raster scenery; AVIF only where measured size wins justify fallback complexity; PNG only where alpha fidelity/tooling materially requires it. Do not ship source-resolution art.

### Art workflow

1. Establish scene layout with rough blocks first.
2. Lock camera/perspective before detail painting.
3. Export backdrop, rear/midground, foreground, and optional side framing separately.
4. Preserve transparent gutters where layers overlap the live board.
5. Test the actual browser composition before final detail painting.
6. Keep production runtime assets optimized and text-free.

Never bake puzzle numbers, move counts, instructions, or functional controls into scenery.

### Initial asset budgets

- Desktop critical scene art: target <= 1.5 MB compressed total.
- Mobile critical scene art: target <= 900 KB compressed total.
- No single decorative raster asset > 700 KB without explicit review.
- Avoid more than four large full-frame raster layers.
- Declare intrinsic dimensions to prevent layout shift.

Budgets may be changed from measured evidence, but increases must purchase visible quality.

## Diorama scene component

Introduce a presentation boundary such as `src/render/DioramaScene.tsx` alongside `RingBoard.tsx` and `ring-geometry.ts`.

`DioramaScene` owns scenic layers, board positioning, responsive art layout, visual slots for HUD/control surfaces, and decorative depth/atmosphere. It may receive presentational facts such as completion state or puzzle index, but it must never decide solver/gameplay truth.

## UI redesign

### Identity/header

Replace the generic dark app header with an integrated Ring Road sign/plaque treatment. Title remains real text or has an equivalent accessible name. Guide remains discoverable. Mobile identity must not consume board space.

### Ring controls

Keep one named control group per ring with two real buttons. Style as cream/stone/wood miniature plaques with embedded ring-color indicator and tactile circular arrows. Preserve names/numbers and 44px targets. Cycle count may compact on mobile. The board itself must not become the only control method.

### Puzzle/move/navigation

Use compact world-consistent cards for Puzzle N/total and current moves/target. Preserve exact/over state indication. Previous/Next can integrate nearby. Do not display a fake Best field unless the product actually tracks it.

### Actions/status

Undo, Reset, Hint, Solution, Guide remain obvious but subordinate, preferably in a compact tool strip/plaque. Status remains live-region text and may sit in a small banner or message plaque. Never communicate solved/under/over/invalid-route state only through scenery animation.

### Modals

Retain current accessible modal behavior but restyle as pale card/carved panel with dark text, warm shadow, and restrained backdrop treatment. Preserve focus trap, Escape, scrolling body, fixed footer, and focus restoration.

## Layering and CSS strategy

Use a deliberate stacking model: backdrop, rear, board plane, UI plane, foreground, modal. Decorative layers use `pointer-events: none`. Functional controls never sit under decorative hitboxes. Use CSS custom properties for scene scale/board size/offsets. Avoid layout-dependent JavaScript. Reserve `will-change` for real animation. Avoid large animated filters and continuous backdrop blur.

## Responsive validation

At minimum validate 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1440×1000, and a wide 16:9 desktop.

For each, verify board dominance, no clipped controls, no gap/marker obscured by foreground art, no text/prop collisions, landscape-phone usability, safe-area behavior where relevant, and comfortable modal bounds. Prefer `clamp()`, grid/flex, `aspect-ratio`, and container-relative sizing before breakpoint-specific pixel offsets.

## Accessibility

Preserve or improve semantic buttons, visible focus, modal focus containment/restoration, live status announcements, ring identity beyond color, 44px touch targets, reduced motion, text contrast, and no essential information baked into raster art.

Additional requirements: decorative images use empty alt or CSS backgrounds; meaningful logo/title art has text equivalent; foreground art cannot obstruct zoomed text; at 200% zoom controls remain reachable; textures must not reduce gap readability; reduced motion disables optional scenic motion/parallax.

## Motion

The scene should be mostly still. Allowed: ring steps, center fire, subtle one-time scene settle, tiny cheap flag/foliage motion, and a short completion accent if nonblocking. Disallowed: camera bob, pointer parallax, perpetual particles, physics-like ring overshoot, or anything delaying input. Ambient effects disappear under reduced motion.

## Performance engineering

Input latency remains a gameplay invariant. `RingBoard` stays isolated/memoized. Scene art must not rerender because a ring rotated. Decorative layers should be static DOM. No canvas redraw loop or requestAnimationFrame scene loop without explicit justification. No full-screen animated blur. Asset decoding must not block interaction.

Loading strategy: preload only the critical scene package selected for the initial viewport; defer noncritical variants; avoid loading both large mobile and desktop packs; reserve scene aspect ratio to prevent layout shift; keep the game operable if decorative images fail.

Graceful degradation: if scene assets fail, fall back to a warm simplified arena/gradient. Board and controls remain fully functional.

## Visual-regression strategy

Keep browser smoke behavioral rather than turning it into a brittle pixel-diff suite. Add a separate visual-review path that builds the app and captures canonical screenshots at 390×844 and 1440×1000, plus 320×568 when layout changes. Store them as review artifacts rather than permanent generated clutter. Compare major milestones against the concept reference, the previous approved milestone, and mobile/desktop together.

If the scene stabilizes sufficiently, later screenshot assertions should target layout boxes or selected invariants rather than full-image equality.

## Implementation phases

### V0 — Lock direction
- Add this plan.
- Update old documentation that explicitly rejected scenery.
- Route renderer/UI visual work here.
- Preserve current production completion record as pre-overhaul baseline.
**Exit:** no current documentation tells agents to avoid the diorama.

### V1 — Composition skeleton
- Introduce `DioramaScene`.
- Establish desktop/mobile scene grids with placeholders.
- Reposition board/HUD into intended spatial hierarchy.
- Keep all gameplay functional.
**Exit:** composition works at target viewports before final art exists.

### V2 — Board mass and daylight materials
- Broaden/tune ring geometry.
- Increase wall/plinth mass.
- Retune top/wall/notch/marker materials for daylight.
- Establish one lighting direction shared with environment.
**Exit:** the live board looks at home in the reference-style scene.

### V3 — Environment art integration
- Add optimized backdrop, rear architecture, foreground framing.
- Establish original Ring Road scenic identity.
- Tune overlap/occlusion around the board.
- Implement responsive crops/variants.
**Exit:** desktop and mobile immediately read as a miniature diorama.

### V4 — World-integrated HUD
- Restyle title, controls, move counter, navigation, actions, status, and modals.
- Preserve semantic HTML and current accessibility behavior.
- Remove dark-app-shell styling that no longer belongs.
**Exit:** no major UI element looks imported from another visual system.

### V5 — Polish and restrained motion
- Tune shadows, material coherence, atmosphere, foreground separation.
- Add only approved cheap ambient/completion motion.
- Verify reduced motion and no input latency regression.
**Exit:** scene feels cohesive rather than assembled.

### V6 — Responsive/performance/accessibility hardening
- Test all target viewport classes.
- Optimize asset formats/sizes.
- Test zoom, keyboard, touch, reduced motion.
- Inspect mobile/low-end performance.
- Verify decorative failure fallback.
**Exit:** richer art costs no gameplay reliability.

### V7 — Final visual audit
- Capture canonical screenshots.
- Compare against reference intent and approved milestones.
- Remove placeholders, dead styles, temporary assets, unused variants.
- Update architecture/testing/completion docs.
- Record deliberate deviations.
**Exit:** diorama overhaul is production-complete.

## Acceptance criteria

The overhaul is complete only when:

- first impression is a miniature world, not a dark application shell;
- the puzzle appears installed in a physical arena/environment;
- foreground, board-plane, rear, and distant depth are clear;
- ring materials and environmental lighting agree;
- rings look materially thicker/heavier than the current baseline;
- gaps read as physical cuts and aligned gaps as one road;
- rainbow board remains the focal point;
- HUD feels native to the world while remaining real accessible controls;
- desktop scenic richness is comparable in spirit to the reference;
- mobile preserves unmistakable diorama identity instead of deleting all scenery;
- 320px portrait remains fully playable without horizontal overflow;
- high-cycle markers remain legible;
- all current gameplay semantics and browser interaction tests remain green;
- keyboard, touch, status announcements, reduced motion, and modal behavior remain intact;
- no decorative layer intercepts gameplay input;
- no continuous rendering loop is introduced;
- critical assets meet performance budgets or have measured justification;
- game remains playable if decorative assets fail;
- canonical desktop/mobile screenshots receive explicit visual approval.

## Decisions not to reopen casually

Unless evidence changes: keep the gameplay board as live SVG/CSS; do not migrate the whole scene to WebGL; use baked scenic art for richness; keep controls as semantic HTML; use separate mobile art direction/crops; keep decorative layers noninteractive; keep scene motion restrained; protect input responsiveness over ornament.

## Open creative choices

These belong to art exploration rather than architecture: exact architectural language, whether water/cliffs/garden/town dominates, logo/sign treatment, plaque/card material, banner/ornament motifs, texture/weathering amount, foreground silhouette, and whether completion triggers a small environmental celebration.

Creative exploration stays inside the technical, readability, accessibility, and performance constraints above.