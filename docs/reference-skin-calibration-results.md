# Reference skin calibration, 2026-10-14

**Authority:** [reference-fidelity-finish-plan.md](./reference-fidelity-finish-plan.md) and [reference-asset-inventory.md](./reference-asset-inventory.md). This is a reproducible experiment report, **not acceptance or a shipping declaration**.

## What has actually been done

- SHA256-verified the 18 original user-supplied PNGs (20,178,588 bytes) and staged 14 additional WebP trial exports using `tools/import-reference-art.py`. No frontend dependency added.
- Built `tools/normalize-reference-rings.py`, an offline OpenCV radial resampling pipeline on the real 1254×1254 RGBA C-ring art; compresses each source annulus into a common normalized 900×900 design canvas with seven concentric radii **350, 306, 262, 218, 174, 130, 86**; inner radii **311, 267, 223, 179, 135, 91, 26**. Keeps the painted materials and transparent source gaps. Trial WebP textures total **194,064 bytes** at quality 90.
- Composite against `reference-empty-arena.png` confirms a plausible seven-ring dimensional board. Approximate registration at original 1536×864 uses a center around x≈800/y≈410; combined painted-ring projection is ~990×648 (x 1.10, y 0.72). This is an optical prototype only.
- Isolated logo, controls, Goal, Puzzle, Moves, Solution from the user's checkerboard HUD reference by chroma-key experiments, and separately trialled background differencing between completed and board-only reference images. Some UI extraction still includes checkerboard fringe; **do not ship these pixels as-is**.
- Constructed an independent, working-source HTML/JS **visual calibration page** that places seven independently rotatable image sprites, dynamic move count, Undo/Reset/Hint, previous/next, modal, pearl click and semantic button labels in a fixed landscape stage. Important: it is not connected to the production exact-solution reducer, and the modal explains that fact rather than claiming to solve real puzzles.
- Wrote offline PIL layout mocks for **844×390**, **932×430**, **568×320**, **390×844 rotated portrait** and 1536×864. The first three were viewed and checked manually. These are raster **mockups, not browser screenshots**. Chromium installed in this working environment is restricted by a managed `URLBlocklist: ["*"]` policy; even localhost/file navigation fails. Consequently runtime fit, click geometry, game interaction and physical mobile performance remain unverified.

## Layout discovery

A physical 44px touch target stacked seven high uses 308px before gaps. On a phone with **390 CSS px** landscape height, only 82px remains for logo/background/margins in the same rail; on **320px** height, only 12px. Therefore, the phone layout must place the logo and Goal outside the seven-row interaction rail, however reference-faithful the background remains.

A successful offline *layout concept* uses:
- one fixed **864 logical-pixel-tall landscape stage**, scaled uniformly by `shortViewportDimension/864`, with a logical width `longViewportDimension/scale`;
- original 16:9 scene centered and independent ocean/scenery extending both sides for 2.1+:1 phone aspect;
- live board centered near x=stageWidth/2+40 and y≈410, ~770 logical-px diameter (before responsive scale), yielding about **348px** width on 844×390 and **285px** width on 568×320;
- seven control rows along the left edge, each hit region `max(95,44/scale)` logical px, dynamically starting high enough that the last remains on screen; visual art may be smaller than its active hit region;
- a left-bottom Goal card outside the control rail and below the lowest live ring surface; logo at top-left on normal phones, moved inward above/alongside the board on 320px-tall screens;
- right-side Puzzle, Moves, Undo/Reset/Hint, navigation and Solution, all inside the physical viewport.
- a **small visible hub/ball** but an invisible ≥44px semantic activation target.
- portrait device viewport maps the same landscape stage with a CSS 90° rotation of its whole presentation. Nothing scrolls at the stage/page level; modal contents may scroll internally.

**Critical note:** this geometry is a proposal. Main game layout should use stage registrations and dynamic safe-area measurements, not copy the calibration implementation into production blindly.

## Open optical and correctness questions

1. Source sprite alpha includes faint colored fringes at the edge. Improve premultiplied alpha extraction and mask cleanup against both pale stone and blue sea. Do not remove the source shadows indiscriminately.
2. The normalized ring sprites have believable top textures, but rotations move source-baked directional lighting too. A source-correct mesh/texture with lighting separated from rotation may be superior; evaluate visually against a patched SVG renderer at several ring orientations.
3. Gap walls and floors must remain continuous with actual domain spoke geometry. The demo has no proof of notch-face or high-cycle marker correctness.
4. The source arena's circular recess and the independently generated ring overlays need exact center/radius registration, particularly on the very wide phone crop.
5. Dark Solution plaque extraction from the checkerboard requires a distinct luminance-mask pass. The original image cannot be used as a transparent sprite.
6. The UI art contains baked move/puzzle numbers. Only static ornamentation/text may remain baked; all true state must come from live React/HTML, including puzzle number, target, move count, pips, solution diagram, focus indicators.
7. Keyboard tab/focus trapping, reduced motion, browser chrome, safe-area insets, physical touch, dynamic 320px-height behavior and responsive art decode are not validated yet.
8. Existing browser smoke assumptions (`src/assets/diorama/manifest.ts`, three scene layers, scene proportions) and asset-check byte/layer limits will need deliberate migration rather than disabling tests.

## Shipping plan from this milestone

A. Import the actual user ZIP into the Git checkout using `python tools/import-reference-art.py PATH_TO_ZIP --source-masters --include-trial-webp`; preserve SHA-protected originals separately from runtime assets. Source ZIP is available as a downloadable artifact in the user's Ring Road project conversation.

B. Execute `python -m pip install -r tools/requirements-visual.txt`, then `python tools/normalize-reference-rings.py --originals art-source/ring-road-2026-10-13/originals`. Review visually, compare against retaining SVG geometry with PNG texture projections, and select the best artifact strategy based on real captured rotations.

C. Implement one fixed-stage React/CSS layout in `src/render/DioramaScene.tsx` and `src/styles/app.css`, with source-derived scenic plates and live UI. Keep `src/app/game-state.ts` unchanged. Add browser fit assertions as an exact acceptance test when current defects are resolved.

D. Wire the source-rendered rings to existing logical rotations, markers, notch geometry and reduced-motion; validate all seven gaps for aligned/misaligned, reset/wrap and exact-move workflows. Only then replace the old rendering path.

E. Inspect fresh 844×390, 568×320, 932×430 and 1440×1000 browser captures against user reference images and the offline prototypes. Document differences and iterate until the full game looks unmistakably like the reference.

## Bundle availability

In the project conversation, the independently delivered calibration ZIP `ring-road-skin-calibration-2026-10-14.zip` contains a standalone HTML demonstration, the 194KB derived rings, derived art, screen-layout mocks and a README explicitly distinguishing its visual demonstration from gameplay correctness. It has **not** been committed as binaries through this GitHub connector. Requesting a repo-executing agent to ingest the ZIP is the next practical handoff step.
