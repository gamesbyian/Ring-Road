# Reference-exact landscape finish: execution contract

> **2026-10-18 implementation checkpoint.** User-supplied original artwork is checked in: 13 modular original masters, five high-resolution scene/reference variants, and all twenty generated runtime WebPs. The opt-in `?skin=painted` production React scene shares the real gameplay reducer. Strict Chrome test coverage has passed 13 **simulated CSS viewport sizes**, including rotated portrait and real CDP pointer-coordinate clicks, with zero recorded page/stage overflow. Static illustrative logo, Goal and Solution now draw from their exact approved source pixels in the native photo layout. The green #263 native 1536×864 image reached RGB MAE **19.335**, improved from **20.987** before source-preserving ring retopology. Green #264 further improved the native whole image to **19.120**, reducing Moves regional MAE from **36.925 → 24.106**; #266 subsequently matched the photo Puzzle ticket's dynamic title/progress paper, reducing its MAE **38.504 → 30.235** and the whole-image score to **19.013**. Merged #269 then compacted the three *real* Undo/Reset/Hint buttons beneath Moves, raising the native reference likeness to **18.393** whole-image MAE with no phone-layout changes. Merged #270 replaced only the photo-layout control-row illustration with exact source pixels beneath all fourteen real 44px ring buttons: controls-region MAE **25.580 → 0.000**, whole-image **18.393 → 16.907**. Both passed all 13 viewport tests, and #269 additionally introduced actual coordinate interaction checks at 1536×864 and 1920×1080. Merged #271 subsequently verified 31 real clockwise clicks across seven complete cycles, exact 360° sprite turns, and Reset recovery. All 13 strict viewports remain green; 568×320, 844×390 and rotated 390×844 pixel captures were unchanged by both targeted photo-only corrections; the seven-band material/geometry diagnostic and violet-center guard also pass. Static logo/Goal/Solution remain source-registered. The source-photo background is never used as a substitute for live rings or dynamic counters. **Visual user acceptance and a real-phone spot-check are still outstanding.** Maintain the classic default until approved. Current tracked finish: [issue #244](https://github.com/gamesbyian/Ring-Road/issues/244). Do not reopen the obsolete asset-upload bridge investigation.


> **2026-10-18 measurable residual:** As of the latest green #270 photo capture, the largest registered residuals are dynamic board **32.271** RGB MAE (including legitimate changed ring poses), Puzzle plaque **30.235**, arena region **24.866** (contains board), and Moves **24.118**. Exact static source crops give control rail and Goal **0.000** MAE; logo and Solution are near-exact. Do not confuse gameplay-dependent gap differences with incorrect art. The user source's unobstructed left-ray bands measured **52/49/48/46/48/46/48px** (red through violet), versus **39/51/34/40/40/41/60px** in original normalized runtime art. Merged #263 performs a source-preserving, per-ring radial WebP warp once at skin initialization, leaving rotation, gaps, gameplay semantics and classic fallback unchanged. The new green screenshot measures **52/53/42/45/48/39/46px** along the same transect, greatly improving concentric progression. Residual ~4px boundary drift, 6–7px band-width offsets, material/perspective and real-device review remain. Its native violet-center diagnostic is **71.2% violet, 1.7% sandstone**, passing the retained guard. All **13 Chrome viewport/interaction** cases passed. The reference-diff report includes repeatable per-band geometry measurements. The native photo-only panel work in #264/#266 now brings Moves to **24.106** and Puzzle to **30.235** regional MAE; both preserve live text and semantic controls. The major outstanding subjective deltas are ring/shadow/stone registration under multiple real puzzle states, the decorative action controls and physical-phone fit/interaction signoff. Pixel comparison remains diagnostic only; do not approve or switch painted mode by metric alone.

> **2026-10-13 asset update:** Fifteen modular illustration components plus three earlier complete-scene references were supplied and inspected. The **1536×864 composed image** is the strongest current landscape composition reference, and the empty arena, seven RGBA rings, castle/waterfalls, foreground, ocean and UI atlases have been isolated. Read the exact mapping in [reference-asset-inventory.md](./reference-asset-inventory.md). The earlier 1536×1152 image remains the original visual concept. See both; never blindly scale one to phones.

**Status: NEW ACTIVE VISUAL ACCEPTANCE AUTHORITY (2026-10-13).** Supersedes declarations of visual completion in `diorama-visual-overhaul-plan.md` and `production-completion.md`, and the obsolete separate-portrait instructions in their histories. The existing game is functional; **visual fidelity and single-screen phone fit are NOT accepted yet**. The older document remains useful for implementation context, not as a finish certificate.

## The brief, literally

Reproduce the user's supplied Ring Road miniature-diorama image as closely as a functioning browser game permits. This is an image reconstruction and layout engineering task, not an open-ended adjacent style exploration.

- The **entire usable game** is on **one landscape viewport**, with **zero page/stage scrolling**; no gameplay region hidden off-screen, even if the browser's chrome is visible. Modal *contents* may scroll inside a bounded, fixed-footed modal, but the underlying game never does.
- Landscape displays normally. Portrait rotates **the entire same landscape game UI by 90°**, with no orientation interstitial, second portrait design or reliance on orientation-lock APIs. Keep the existing landscape-only behavior; replace `overflow: auto` on the rotated shell only once the fit contract is proven.
- ALL seven ring controls, center/fire, navigation, move counter/target, Goal, Solution, puzzle label, and critical controls must be reachable. Undo/Reset/Hint, status, focus and accessibly named controls survive. Do not replace controls with inaccessible bitmap hotspots.
- Match the visual reference **closely in perspective, board proportions, materials, lighting, scene silhouettes, placement, lettering treatment, backgrounds, arena, stone stairs, banners, etc.** Prefer fidelity to arbitrary “polish.”
- No technical medium restrictions provided the game runs in a browser. The preferred solution is a composited **baked-art + live SVG/HTML** diorama, but Phaser/Pixi/WebGL/Three.js, canvas or full replacement are allowed when a concrete measured benefit warrants them. Do not cling to SVG if the physical board still looks different.
- Preserve exact puzzle rules, rotation, testing, reduced motion and responsiveness.

## The crucial aspect-ratio mismatch

The **original supplied 1536 × 1152 image is 4:3**; a newer full-composition **1536 × 864 (16:9) reference** and modular scenery/sprites are now available. The old image remains an aesthetic authority; the existing checked-in reference is `docs/3d-ring-renderer-concept.jpg` (validate equivalence with the user's latest upload before treating pixels as identical). A landscape phone is commonly around **2.0–2.22:1**. Blindly scaling the 4:3 painting into one phone screen produces massive pillarboxing or distortion; `object-fit: cover` crops necessary UI.

**Decision:** treat the supplied image as an exact *style/object/perspective authority*, not a literally immutable pixel arrangement at every aspect ratio. Author a **landscape-specific extension/recomposition**: preserve the ring board and its surrounding monument, extend or regenerate scenic sides, reposition live plaques around the board, and keep their recognizable look and hierarchy. The 4:3 image remains the native source for pixel-reference comparisons. The phone output gets its OWN ground-truth approved reference capture after layout acceptance. Do not use “responsive CSS” to fudge a bad 4:3 composition.

## Reference visual inventory (manually approximate; verify against source pixels)

The bounds below are approximate **(x0,y0,x1,y1) / (1536,1152)** from the supplied image, and represent registration probes, NOT automatically approved masks. The reference is colorful, painted clay/wood/stone with warm sun and an upper-left key light.

| Item | Approximate pixel bounding box | Treatment and fidelity cue |
|---|---|---|
| Title/logo | (35,25,495,280) | Oversized torn cream card, two-tone “Ring Road”, mountain/sun and curving road, ochre paper subtitle |
| Seven controls | (50,296,310,790) | SEVEN separate small cream row plaques, red→purple circles, paired inset cream arrow medallions; no surrounding master form |
| Ring board | (330,157,1320,843) | Seven broad matte rainbow bands with physical thickness, radial gaps, recessed brown channel, small pearlescent center |
| Arena/castle plinth | (270,112,1390,1110) | Perspective-staged warm masonry, rear castle, blue/gold banners, side water, front flags, centered broad stairs and gold star posts |
| Puzzle plaque | (1260,22,1520,146) | Small parchment ticket, puzzle number, seven progress pips |
| Moves plaque | (1305,152,1515,324) | Cream card, large centered move count, thin divider, lower record/target detail |
| Goal plaque | (27,873,496,1109) | Large cream card, help question emblem, short goal copy, concentric miniature |
| Solution plaque | (1275,868,1520,1115) | Dark charcoal card, eye symbol, framed concentric miniature and vertical road |
| Environment | background everywhere | Painted blue sky, pale mountains, chunky polygonal evergreens, cliffside water, faceted blocks and torches |

**Do not bake text or state into scenery:** logo lettering may be artistically baked if accessible HTML remains, but puzzle number, move count, target, progress, hints, ring state and solution previews must remain live; create registration masks with clean plates beneath these elements. A screenshot of a puzzle must NOT show phantom old gaps or extra concentric rings baked into its backdrop.

## Acceptance at actual phone size, not a desktop screenshot

Viewport matrix uses **CSS pixels** (not device resolution), representative rather than claiming every model is identical:

| Mode | Candidate sizes | Expectations |
|---|---|---|
| Compact landscape | 568×320, 667×375, 740×360 | Everything essential visible; 7 controls and ring readable, no scroll |
| Typical landscape phones | 844×390, 852×393, 915×412, 932×430 | **Primary shipping approval**; full scene, all controls, legible names, reference composition |
| Tablets/desktop | 1024×768, 1440×1000, 1920×1080 | Reference-centered quality; never regress |
| Physical portrait showing rotated game | 390×844, 430×932 | Full shell rotated; all controls on screen in swapped coordinate space |
| Browser chrome / safe areas | reduced 350–390px usable landscape height, simulated insets + real-device check | No page scrollbar, clipped controls or stolen tap target |

Hard browser assertions after dismissing intro guide:
1. `document.documentElement.scrollWidth/scrollHeight`, `body`, `#root`, `.app-shell`, `.diorama-scene` do not demand gameplay scrolling (tolerance ≤1–2 CSS px). An `overflow:hidden` parent hiding oversized content is NOT a pass: bounding rectangles of essential nodes and clickable buttons must be wholly inside the **physical viewport** (or the effective rotated stage, depending on the test).
2. Every expected component is rendered, nonzero area, not covered by a higher interactive overlay, and visibly readable. Touch targets ≥44 × 44 CSS px wherever practicable. If height constraints make this impossible, revisit **horizontal distribution and interaction architecture** instead of silently shrinking hitboxes or hiding controls.
3. Correct mouse/touch/keyboard hit mapping after portrait rotation and viewport-resize changes. One input = exactly one legal move; no stale reset transitions.
4. Navigation/guide/solution/help/hint and completion paths still work. Modals can scroll **internally only**, fixed footer accessible.
5. Art is independent of gameplay, pointer-inert, no flash of wrong dimensions; asset load fails gracefully.

**Critical space-budget fact:** seven 44px-tall ring control rows consume **308px** before any gaps, title or Goal. A 360–390px phone cannot stack title + seven rows + Goal on the same rail. Therefore the final composition must use the phone's **width**: controls as a compact vertical rail; title and Goal in neighboring/overlapping scenic areas; board center; moves/puzzle/solution right-side. “Scale everything down until it fits” is specifically rejected.

## Architecture and visual delivery

### 0. Establish observable truth (before changing assets)
- Import the 18 user-supplied images with checksums and compare the 1536×864 composite to the older checked-in `3d-ring-renderer-concept.jpg`. Ensure each art source is preserved unchanged. This uploaded binary cannot be assumed identical based on a filename.
- Run the new **`scripts/visual-viewport-audit.mjs`** and archive captures + JSON geometry for baseline of `main` at all target sizes; inspect *scrollHeight, interactive bounds, scene bounds* and landscape vs portrait differences.
- Run **`scripts/visual-reference-compare.py`** at reference-native aspect ratio to produce an overlay, diff, side-by-side and region scores. Do not turn raw pixel MAE into an unconditional ship gate: generated artwork has high-frequency natural variation.
- Make a visible table of top 10 discrepancies with location, magnitude, and suggested fix. Compare fresh screenshots and concept **side by side every PR**. No comparing from memory.
- Check the active open foreground-translation PR #240 separately; never overwrite it accidentally.

### 1. Solve the responsive stage once
- Adopt **one landscape stage** fitted to actual `100dvw × 100dvh` (or swapped width/height in portrait) using `visualViewport` for diagnostics, CSS `dvh/svh` fallback and remapped safe-area insets. No body scroll, no gameplay shell scroll.
- Define central `scene-contract` tokens for a compact ~2.15:1 phone and desktop 4:3/16:9; board center/diameter, perspective, title/controls/goal/right-HUD safe regions, masks and occlusion. Art and UI consume same coordinates. No free-floating piles of late CSS overrides.
- On phone, lay out the 44px high control rail independently from logo/Goal; use horizontal real estate. Keep board large and center-dominant. Reflow placements at **both aspect-ratio AND usable height breakpoints**; do not infer from orientation alone. Favor `min()`/`clamp()` with measured bounds. Avoid cropping functional UI.
- Validate all viewports with guide closed, active gameplay, modal, focus ring and completed state. Only then forbid scroll in production CSS.

### 2. Reconstruct high-value reference art as layers
- Create a **clean plate**, free of ring-board pixels and stale text, with perspective/lighting preserved; extend the sky/terrain/castle to extra-wide format via outpainting or authored background. One backdrop sheet, one rear architectural depth sheet, one foreground occlusion sheet. Use masks to cut away region occupied by live board and plaques. Keep foreground behind controls/markers.
- Use AI as an **iterative material/asset generator**, not an independent composition designer: image edit/outpainting from approved reference + tightly bounded region prompts, transparent cutouts, inspect alpha fringe and illumination, repeatable provenance + model/version/seed/tool parameters. Inpainting the hole under the reference's board cannot invent exact masonry, so approve the new clean plate manually.
- If available, SAM 2 point/box segmentation or `rembg` for rough masks, then human cleanup. These are OPTIONAL **offline artist utilities**, not dependencies of browser runtime or CI.
- Capture accurate lighting, ambient occlusion, castle massing, waterfall/cliff, 3D pine silhouettes, torch crystals and faceted paper shadows. Use full-resolution source masters outside shipped payload and optimized WebP/AVIF (fallback if needed) for deliverables. Do not simply drop the supplied complete picture behind translucent live content.

### 3. Rebuild board to match silhouette + optical texture
- Lock reference ring radius progression, seven band widths, roundness, board tilt/ellipse, gap geometry, central pearl ball, deeply cut walls, visible masonry rim and stair connection before shaders.
- Match ring hue/brightness, matte wood/card grain, beveled highlights and contact shadows using SVG gradients/textures **or** Canvas/WebGL meshes/shaders if fidelity experiments demonstrate superior visible pixels or mobile performance. Keep logical ring rotations single-owned by domain state.
- Make at least three separated fixture renders: mixed gaps, aligned road, and high-cycle markers; look for false baked channels. Benchmark rapid input, GPU texture memory and repaint cost.

### 4. Skin every UI panel, retain accessible overlays
- Replace rounded modern web “cards” with photographed/painted parchment/stone/wood/ink materials, embossed lettering, irregular silhouettes and tactile inset arrow buttons. Match native image iconography. Keep all **dynamic labels as DOM text** and button hit targets as semantic DOM overlays. Build separate small “row plaque” sprites rather than a single large controls background.
- Preserve ring order/color semantics and target count/Undo/Reset/Hint; integrate currently non-reference actions into subtle but visible edges or compact plaques without obscuring the target scene.
- Add direct scene landmark anchors and render bounds debug overlay to verify registration on every aspect ratio.

### 5. Measured review until approved
- Each PR changes **one high-impact visible discrepancy** with before/after screenshots: (a) phone entire stage fit; (b) arena/ring perspective; (c) matte/castle/water; (d) title/controls/HUD; (e) light/material polish. Don't churn in tiny speculative increments.
- Stable screenshots: deterministic puzzle state, images decoded, web fonts loaded, animation disabled, DPR pinned and toolchain pinned. Use region crops rather than one whole-image number. Evaluate silhouette, composition, readability, semantic overlap, mobile FPS and capture artifact sizes.
- Primary goal is a subjective **visually unmistakable near match**, attested by reference/photo side-by-side on actual phone dimensions. Secondary quantitative diagnostics: region position/size errors, scale-normalized landmarks, SSIM/edge/MAE within aligned crops, byte budget, pixel area, hit targets. For regenerated scenery, human reference judgement beats pixel loss.
- Close only after recorded acceptance captures at the phone matrix + desktop, zero-scroll automated enforcement, real touch-device sanity, and unchanged gameplay/keyboard/reduced-motion regression gates.

## Delivery sequence / PR ownership

| PR | Deliverable | Exact exit gate |
|---|---|---|
| A | This specification, reference inventory, tooling + baseline | Scripts runnable, no gameplay mutations; discrepancy register |
| B | Landscape fixed single-screen stage / phone recompose | Every landscape/portrait test viewport: all essential nodes + all seven controls inside, zero gameplay scroll; responsive guides |
| C | Reference-registered clean scenic plates | Approved sky/architecture/masonry/water/stairs; no stale board/text in image exports |
| D | Board silhouette/material/cut geometry | Captured mixed/aligned/high-cycle variants match physical ring/road treatment; playable |
| E | Reference-skinned HUD, paper controls, logo, action integration | Every panel visually coherent; legible/keyboard/touch semantics |
| F | Focused visual delta + device acceptance | Side-by-side captures, explicit residual deviations, physical phone spot-check; green interaction gates |

Parallelizable: AI asset development in a dedicated art branch and responsive stage mechanics in a CSS/layout branch **only after the scene contract is agreed**. Never have agents editing the same stylesheet or reference asset without coordination. Merge no further “finish” declarations without the gate artifacts.

## Tool kit in this PR and optional researched integrations

**In repo, now:**
- `scripts/visual-viewport-audit.mjs`: Node 22 + Chrome CDP, capture viewport/state geometry and screenshots, optional strict no-scroll assertions; no runtime dependency. Designed as a diagnostic until PR B can pass.
- `scripts/visual-reference-compare.py`: Pillow-powered offline composites + numerical error/region report. Optional developer-only Python environment, no runtime cost.
- `docs/reference-regions.json`: machine-readable normalized reference landmarks and cross-viewport required selectors.

**Install only on demand for art production (not npm runtime):** Optional Pillow environment is recorded in `tools/requirements-visual.txt` (`python -m pip install -r tools/requirements-visual.txt`); generated assets should carry `tools/asset-provenance.template.json`-shaped records of source rights, masks, workflow, seed, checkpoints and reviewed exports.

**Install only on demand for art production (not npm runtime):**
- [Meta SAM 2](https://github.com/facebookresearch/sam2): point/box segmentation, optional GPU/PyTorch environment; powerful but heavy, masks still need cleanup.
- [rembg](https://github.com/danielgatis/rembg): straightforward batch/single background removal; weaker on connected architectural silhouettes and translucent edges.
- [ComfyUI](https://docs.comfy.org/development/api-development/workflow-api-format): image-edit/outpainting/inpainting workflows as versioned JSON, with prompts/seeds/model hashes as reproducible provenance. Models/weights and licenses vary; no claim of deterministic pixel recreation.
- [Hugging Face Diffusers inpainting](https://huggingface.co/docs/diffusers/en/using-diffusers/inpaint) and [ControlNet](https://huggingface.co/docs/diffusers/using-diffusers/controlnet): explicit mask-defined edits, optionally conditioned on edge/depth maps to preserve architectural outlines and camera geometry. Prefer structure-conditioned edits over prompt-only scene re-generation.
- [Sharp](https://sharp.pixelplumbing.com/) or [Squoosh](https://squoosh.app/): optimized alpha WebP/AVIF export and visual inspection; use Sharp only if repeatable scripted processing outgrows the Python/Pillow tools.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots): consider adding after deterministic screenshot fixtures and standard baselines mature. Existing CDP harness avoids an extra framework for the initial audit.
- [Blender](https://docs.blender.org/manual/en/latest/render/film.html): optional matched-perspective painted 3D/raster sheets for highly geometric ring/plinth shadows; offline rendering only. Phaser/Pixi/Three.js are alternatives, NOT preemptively required.

## Research distilled into engineering decisions

1. **Source image ≠ game asset atlas.** Automatic sprite extraction from a single flattened frame cannot recover occluded surfaces, continuous ring rotations or hidden architecture; must reconstruct clean plates and live geometry.
2. **Generate small controllable parts** and use masks instead of hallucinating a new whole-screen UI each time. AI-generated text and interactive sprites drift; functional DOM is the geometry and semantics authority.
3. **Structural registration first, texture last.** A texture can appear superb locally while its sprite depth/position is wrong, producing a globally poor match.
4. **Fit the real visual viewport.** Legacy `100vh` may exceed available mobile height; viewport-relative dimensions must account for browser chrome and safe areas, with physical touch validation.
5. **Differential evidence not “looks nicer.”** Stable browser captures and explicit landmarks make AI-generated or human-made corrections reviewable, reversible and coherent.

Primary source reading:
- MDN CSS viewport units: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
- MDN safe-area environment variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
- MDN VisualViewport API: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- Playwright screenshot comparisons: https://playwright.dev/docs/test-snapshots
- Meta Segment Anything 2 repository: https://github.com/facebookresearch/sam2
- rembg CLI and batch tools: https://github.com/danielgatis/rembg
- ComfyUI API workflow schema: https://docs.comfy.org/development/api-development/workflow-api-format
- Hugging Face Diffusers inpainting: https://huggingface.co/docs/diffusers/en/using-diffusers/inpaint
- Hugging Face ControlNet shape/depth conditioning: https://huggingface.co/docs/diffusers/using-diffusers/controlnet
- Sharp image processing: https://github.com/lovell/sharp
- Phaser display/rendering, only if needed: https://docs.phaser.io/phaser/concepts/display
