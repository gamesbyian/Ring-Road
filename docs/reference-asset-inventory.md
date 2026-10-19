# 2026-10-13 reference-art inventory and integration decisions

**Current verified state (2026-10-18):** All **18 original PNGs are committed and retained unchanged in GitHub**. Thirteen modular masters are in `art-source/ring-road-2026-10-13/originals/`; the remaining five high-resolution full-scene/composition alternatives are in `art-source/ring-road-2026-10-13/highres-uploads/` (the 15-modular/3-scene split below is a *historical acquisition classification* and does not describe their final directories). The previously anonymous root copies were safely removed after byte-preserving Git moves in #249/#250. The complete 20-image, checksum-manifested runtime WebP package is in `public/reference-skin/` and already powers the opt-in **real React `?skin=painted` game**. See the active [finish plan](./reference-fidelity-finish-plan.md) and [issue #244](https://github.com/gamesbyian/Ring-Road/issues/244). Do not restart the obsolete binary-import investigation.

This inventory is an addendum to [reference-fidelity-finish-plan.md](./reference-fidelity-finish-plan.md). The new **16:9 (1536×864) scene/UI combined image `1000020068.png`** is now the strongest landscape source composition. Keep the earlier 4:3 reference for visual lineage. Modern ~2.1:1 phones still need composition reflow and accessibility-aware hit regions, not a literal 16:9 shrink.

## Exact user-file mapping

| Filename | Meaning | Source dimensions | Alpha? | Production usage |
|---|---|---:|---|---|
| `1000020068.png` | Full 16:9 composed play-scene, UI, rings | 1536×864 | No | Registration/reference only |
| `1000020069.png` | Flat HUD overlay on **baked gray checkerboard** | 1536×864 | **No** | Reference only; not a transparent overlay |
| `1000020070.png` | Full scene with ring board, without HUD | 1536×864 | No | Scene/ring perspective target |
| `1000020071.png` | Yellow ring / Ring 3 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020072.png` | Orange ring / Ring 2 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020073.png` | Violet ring / Ring 7 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020074.png` | Green ring / Ring 4 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020075.png` | Red ring / Ring 1 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020076.png` | Indigo ring / Ring 6 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020077.png` | Blue ring / Ring 5 | 1254×1254 | Yes | Live ring asset or material sample |
| `1000020078.png` | Full unoccupied arena in a finished scene | 1536×864 | No | Complete-scene fallback and registration |
| `1000020079.png` | Trees, steps, foreground monuments | 1672×941 | Yes | Front-facing mask layer |
| `1000020080.png` | Empty sandstone arena/plinth | 1672×941 | Yes | Physical board/arena layer |
| `1000020081.png` | Rainbow material swatches with labels | 1448×1086 | Yes | Texture palette/reference; labels are baked |
| `1000020082.png` | Castle/towers, forests, waterfalls, land | 1672×941 | Yes | Landscape midground with transparent central void |
| `1000020083.png` | Ocean, mountains, clouds, sky | 1536×864 | No | Painted backdrop |
| `1000020084.png` | Undo, Reset, Hint, puzzle/nav/target plaque sheet | 1448×1086 | Yes | Source for carefully cropped semantic button skins; **numbers and instructions are illustrative**, not actual game truth |
| `1000020085.png` | Seven curved colored ring fascia strips | 1448×1086 | Yes | Physical board edge/material reference, not full rotation geometry |

## Validation observations

- All 13 modular RGBA files have actual transparent pixels. Five full-frame reference/backdrop files are RGB. The grayscale checkerboard in `1000020069.png` is *baked RGB*, unsuitable for transparent UI.
- Transparent-layer masters share **1672×941**, roughly 16:9: `1000020079.png` (foreground), `1000020080.png` (arena), and `1000020082.png` (castle environment), simplifying registration. `1000020083.png` is 1536×864 at the same aspect; resize the ocean backdrop or place it in a shared normalized coordinate system.
- The **seven ring sprites are all on 1254×1254 RGBA canvases**, but are different annulus geometries, orientations and thicknesses. Treat them as individual images, not a palette swap of one circle. Stacking them with naïve `rotate()` after perspective projection is geometrically suspect; use local rotation **before** shared board-plane projection, or use ring masks/material samples in a live geometry renderer. Dynamic notch alignment and orientation markers remain driven by puzzle state.
- Source alphas in painted regions typically cluster around **252–254 rather than 255**, and low-alpha edges have stray colored speckles. Do not flood-fill/black-key these images. Compare on pale stone *and* ocean backgrounds, inspect edge halos and shadow transparency, clean masks conservatively. Keep pristine originals and review any alpha surgery.
- **Historical trial (superseded by production):** The initial layered static stack had incomplete reference registration. The production painted scene now uses the registered baked `reference-empty-arena.webp` for its scenery; it does not double-stack the separately imported arena. All seven C-rings and semantic controls remain live, with source-preserving radial retopology calibrated and green in #263. Choose *either* `1000020078.png` (already-baked arena scene) *or* the decomposed layers; do not double-stack both arenas.
- Original 18 PNGs together are about **19.24 MiB**. Offline WebP quality-90 trial exports for the 14 applicable later-uploaded assets total about **3.29 MiB** (seven rings approximately **1.30 MiB**) before runtime selection. This is encouraging, but image dimensions, decode area, quality and alpha halos still require actual mobile benchmarking. Existing `check-diorama-assets.mjs` has much smaller package budgets; intentionally revise the manifest/check together only for approved shipped assets.

## Layer order / rendering contract

1. Flat backdrop `ocean-sky-mountains`.
2. Midground cutout `castle-waterfalls-terrain`.
3. Sandstone arena `arena-plinth-empty` (or use single baked empty-arena reference instead of steps 1–3).
4. **Seven independently rotating live ring elements, larger rings behind smaller rings**; board depth, notches and shadows registered to arena center.
5. Foreground `foreground-stairs-flowers` occlusion, inert to input; ensure no overlapping functional regions.
6. Logo, seven control rows, puzzle/moves, Goal/Solution, Undo/Reset/Hint, prev/next, status and center-fire as semantic DOM elements and art-skinned buttons. Never use screenshot-baked puzzle state in live gameplay.

**Important UI constraint:** all seven control rows need individual reachable controls, with default ≥44px tap targets and full keyboard/focus support. Seven 44px rows already occupy 308px before spacing. A landscape phone about 390px high cannot accommodate a stacked title + seven rows + Goal in a single rail. Place supporting plaques elsewhere in landscape width; use reference-faithful redistributions, not hidden content or scrolling. Modal **interior only** may scroll.

## Integration order and next acceptance fixtures

1. Import *unmodified original source files* with the named roles above and SHA256 inventory; author reference art manifests before runtime use.
2. Build a headless **registration-only** page that composites backdrop, castle, arena and foreground at a shared base coordinate system. Optimize the foreground clipping and anchor positions using 1536×864 reference landmarks.
3. Build a ring calibration fixture for mixed gap angles, exact alignment, and high marker cycle count. Verify correct gap arcs, no doubled shadows, no stationary baked rings, no perspective warps when rotated.
4. Crop UI atlas into independent art skins without baking dynamic counters or labels. Recompose for 844×390 and 932×430 first, then very short screens.
5. Replace the old scenery in the production path only after visual captures pass, maintain no-scroll/portrait rotation, and report measured performance/decoded bytes.

**Archived import bundle (no longer required to proceed):** `ring-road-reference-assets-2026-10-13.zip` originally packaged the 18 inputs and experimental conversions. The authoritative originals and production sprites are now checked into the paths above; future agents should use the repository itself as source of truth.

## Tested acquisition and image-space ring experiment

- `tools/import-reference-art.py`: SHA256-verifies **all 18 PNGs** against the signed-off bundle manifest (20,178,588 original bytes) without modifying production assets. Checked on the conversation's actual 2026-10-13 ZIP with a dry run and a populated stage including **14** optional trial WebPs.
- `tools/normalize-reference-rings.py`: offline NumPy/OpenCV radial remapping of all **seven** transparent source C-rings from the verified originals to uniform nested band increments. The code was run against the supplied images; exports total **194,064 bytes** as WebP quality-90. An initial static composition uses the newly normalized rings over `reference-empty-arena.png` and gives visually credible depth, with known remaining issues: outer/middle ring registration, dynamic gap walls, alpha fringes, center pearl, and source shading during rotations.
- There is also a standalone **calibration-page experiment** in the conversation workspace with live sprite rotations and fixed-stage UI, intended as an integration study, not a replacement for production puzzle logic; Chromium here is blocked by the environment's managed `URLBlocklist: ["*"]` policy, so it has **not passed browser interaction or no-scroll screenshots**.

The import and normalization tools remain offline provenance/reproducibility utilities. The production `src/render/PaintedScene.tsx` renders the seven source-exact textures as independent state-driven rotors, with their radial band geometry adjusted at load by `src/render/painted-ring-retopology.ts` (#263). Neither the classic `RingBoard` nor the game reducer is modified. The strict 13-viewport Chrome and native-reference comparisons must stay green for any future artwork changes.

## Critical artwork-to-domain index mapping

The source art labels the **outermost red circle as Ring 1**, with orange=2, yellow=3, green=4, blue=5, indigo=6 and the **innermost violet as Ring 7**. The production app's `LABELS` / `RingBoard` use the reverse internal order: violet domain index `0`, indigo `1`, blue `2`, green `3`, yellow `4`, orange `5`, red `6`. The source-art file `ring-N-<color>.png` must bind to **internal ring index `7 - N`**, never `N-1`. Keep the existing cycle vector, ring geometry, aria labels and reducer dispatch owner intact. Assert this mapping in a focused integration test before rendering exported assets in the main game.
