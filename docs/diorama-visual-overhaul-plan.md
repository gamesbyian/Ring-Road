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

## Scene registration contract

The baked art and live board need a shared coordinate contract or the result will drift into brittle hand-tuned offsets.

Use a scene container with an explicit design aspect ratio for each art direction, then position major planes using normalized percentages/CSS custom properties rather than viewport pixels. Desktop and portrait may use different design canvases, but each should define:

- board center and nominal diameter;
- horizon/rear-architecture band;
- control safe zone;
- puzzle/move plaque safe zone;
- foreground overlap mask zone;
- no-occlusion zone around all seven ring gaps/markers;
- crop-safe outer gutters.

Export guides for those zones alongside source art. `DioramaScene` should own the coordinate mapping; individual UI components should not invent their own scenic offsets.

Before final art, create a registration proof using flat-color placeholder layers and verify it at every target viewport. Final painted exports must drop into the same contract without changing gameplay layout.

Perspective must also be locked: the live board tilt, apparent ellipse, light direction, and arena/plinth perspective should be calibrated together from one approved composition. Do not separately "eyeball" the board and background.

## Asset validation tooling

Add a lightweight repository check once real art lands. It should inventory runtime diorama assets and fail on objectively unsafe mistakes such as an unapproved file type, missing declared dimensions/manifest entry where required, or an individual file beyond the hard review threshold. Keep aesthetic quality out of deterministic CI.

Vite's hashed asset output should remain the cache-busting mechanism. Do not hand-version filenames unless source-art workflow requires it.

Track at least the following during V6:

- compressed critical bytes for desktop and mobile;
- total decoded pixel area of initially loaded large layers;
- cumulative layout shift from scene loading, target < 0.05;
- rapid-input browser smoke timing versus pre-overhaul baseline;
- whether initial interaction is possible before nonessential art completes.

Do not turn network-sensitive paint metrics into flaky hard CI gates; use them as measured review evidence unless a stable harness is established.
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

## Implementation decision matrix

| Concern | Chosen approach | Why | Revisit only if |
|---|---|---|---|
| Scenic environment | Layered baked raster art | Highest visual richness with low runtime cost | Static layers cannot achieve approved composition |
| Live puzzle | Existing SVG/CSS renderer | Deterministic, crisp, accessible, already validated | A specific visual requirement is impossible in SVG/CSS |
| Functional UI | Semantic HTML/CSS | Accessibility, focus, responsive layout, robust input | Never for purely visual reasons |
| Rich decorative vectors | Small SVG assets | Crisp at any scale, easy tint/mask | Asset becomes too complex/heavy |
| Raster format | WebP first | Broad support, alpha, strong compression | AVIF gives measured material savings with simple fallback |
| Responsive scene art | Art-directed mobile/desktop exports | Better crops and lower bandwidth than one universal image | A single asset demonstrably works across all targets |
| 3D engine | None | No gameplay need; avoids GPU/runtime complexity | Concrete prototype proves a large visible gain |
| Ambient animation | CSS transform/opacity only | Cheap and reducible | A specific effect requires another mechanism |
| Visual regression | Review screenshots, not full pixel gate | Avoids brittle CI during active art iteration | Scene stabilizes enough for selective invariant assertions |
| Fonts | System stack initially; bundled WOFF2 only if art direction needs it | Zero network dependency, predictable loading | A licensed local typeface materially improves identity |

## Asset provenance and source-art discipline

Every production art asset must have a known source and usage right. Generated, commissioned, hand-authored, or third-party-licensed art should be distinguishable in an asset ledger or adjacent source metadata. Do not import mystery assets from image search or another game's files.

For generated or externally authored art, preserve enough source information to reproduce or revise it: source image/reference, prompt/brief where applicable, original high-resolution working file when practical, crop/export instructions, and final optimization settings. Heavy source files do not need to ship in the runtime bundle and may live outside `src/` if repository size becomes unreasonable.

Do not rasterize functional text into scene art. Decorative lettering used purely as scenery is allowed, but the actual game title, puzzle state, move count, actions, instructions, and modal text remain live text.

## Responsive image implementation

Prefer real `<picture>`/`<img>` elements for major scenic layers rather than giant CSS backgrounds when responsive source selection matters. Use `media`, `srcSet`, and explicit width/height or `aspect-ratio` so the browser can choose the correct asset without downloading every variant. Decorative scene images should use empty alt text, `aria-hidden="true"`, `draggable="false"`, and `pointer-events: none`.

Use `object-fit`/`object-position` only within art-directed safe zones established during export. Do not rely on arbitrary cropping to avoid creating mobile variants.

Only above-the-fold critical art should receive eager loading/high fetch priority. Secondary ornaments should decode asynchronously and may load lazily if they are genuinely outside the initial composition.

High-DPI exports should be sized for the maximum displayed pixel density that produces a visible benefit, not automatically exported at enormous source resolution. Verify crispness at DPR 1, 2, and 3 while respecting the byte budget.

## Typography

The reference uses friendly display lettering and sturdy readable UI type. The overhaul may introduce a more characterful display face for the Ring Road identity and headings, but body/control text should remain exceptionally legible.

If a custom font is used:

- bundle it locally as WOFF2;
- include its license/source record;
- use the minimum number of weights/files;
- provide metric-compatible or visually acceptable fallback;
- use `font-display: swap` or equivalent so the game never waits on typography;
- verify no control dimensions break during font swap.

Do not load fonts from Google Fonts or another runtime CDN.

## Color, contrast, and visual-state safety

The environment may become bright, but functional states must retain WCAG-appropriate contrast. Test ordinary, exact, over-target, disabled, focus, and modal states against their final physical-material backgrounds rather than against abstract color tokens.

Color is supplemental. Ring number/name/position, move count, status copy, and button labels remain sufficient without hue recognition. Bright scenery must never wash out yellow/orange markers or focus rings.

Where artwork sits behind text, prefer an opaque/semi-opaque plaque surface rather than text-shadow as the primary readability mechanism.

## Browser and failure robustness

Target current evergreen Chromium, Firefox, and Safari behavior using ordinary HTML/CSS/SVG primitives. Avoid experimental rendering features as core requirements. Decorative enhancements may use progressive enhancement only when absence leaves a coherent scene.

Scene loading failures must be survivable. If one or more decorative assets fail:

- board and controls remain laid out and usable;
- missing foreground art cannot uncover hidden controls or change hit areas;
- fallback background colors/gradients preserve text contrast;
- gameplay tests continue to function without relying on image decode events.

Do not gate app initialization on decorative asset promises.

## Zoom, text scaling, and safe geometry

Validate at browser zoom 100%, 150%, and 200% on desktop. The scene may crop more aggressively as text grows, but controls and status must stay reachable. Avoid absolute-positioning functional text against fixed pixels in art.

Reserve explicit safe zones in backdrop/foreground exports for board and controls. Foreground assets that visually overlap the arena must be designed with masks/gutters so they cannot cover ring gaps or control labels at supported breakpoints.

## Risk register

| Risk | Consequence | Mitigation |
|---|---|---|
| Art is beautiful but composition breaks on phones | Reference intent lost where most constrained | Separate portrait composition and exports from V1 onward |
| Baked scenery and live board look like different worlds | Collage effect | Lock camera, lighting direction, palette, and material samples before final art |
| Raster payload balloons | Slow first load/mobile decode | Per-platform budgets, source selection, WebP, layer cap, measured exceptions |
| Foreground art steals clicks | Broken gameplay | Pointer-inert decorative layers and automated clipped/covered-control checks |
| Rich scene causes ring input jank | Gameplay regression | Static layers, no render loop, isolate/memoize board, mobile profiling |
| Responsive offsets become brittle | Maintenance trap | Grid/container sizing, safe zones, few deliberate breakpoints |
| Generated art contains unwanted pseudo-text/details | Cheap/uncanny result | Never use generated text as functional UI; paint/clean exports before shipping |
| Scenic art resembles another IP too closely | Identity/legal risk | Original Ring Road architecture and motifs; reference only the broad diorama language |
| Accessibility regresses under art polish | Unusable controls/status | Preserve semantic DOM, focus, contrast, reduced motion, zoom tests from each phase |
| Agents optimize against screenshot instead of game | Fragile implementation | Keep gameplay/render boundaries and behavioral CI authoritative |

## Milestone review protocol

Do not wait until V7 to judge the art. At the end of V1 through V5, capture at least 390×844 and 1440×1000 and answer four questions:

1. Does it read more strongly as a miniature world than the previous milestone?
2. Is the board still the first gameplay object the eye finds?
3. Are gaps, dimples, move target, and controls easier or no harder to read?
4. Did the added richness cost measurable responsiveness or layout robustness?

If the answer to 2, 3, or 4 is materially negative, fix that phase before adding more decorative density.

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
