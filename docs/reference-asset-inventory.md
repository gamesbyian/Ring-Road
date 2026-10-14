# 2026-10-13 reference-art inventory and integration decisions

**Status:** all **15 modular source assets** received in two user batches, alongside **three 1536×864 full-scene/UI references**, for **18 original PNGs** in total. These binary PNGs were inspected in the conversation sandbox. **They have not yet been committed to this Git branch:** GitHub connector here supports text file updates but no attachment-to-repository binary bridge. Preserve/import the actual user-supplied bytes into `art-source/ring-road-2026-10-13/originals` when an agent runtime with repo checkout and attachments is available. Do not invent URLs or claim they are already checked in.

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
- A trial static stack of ocean backdrop + castle terrain + empty arena + foreground stairs **does assemble into a plausible, coherent 16:9 diorama**. It is **not optically aligned to the 1536×864 reference** yet; in the trial, the arena appears larger than in the original registration. Lock geometry before tuning textures. Choose *either* `1000020078.png` (already-baked arena scene) *or* the decomposed layers; do not double-stack both arenas.
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

**Separate handoff artifact:** the conversation workspace has a verified `ring-road-reference-assets-2026-10-13.zip` containing all 18 unchanged source PNGs, SHA256 manifest, trial WebP exports and a diagnostic compositing preview. It is a prepared import bundle, **not yet GitHub-hosted**.

## Tested acquisition and image-space ring experiment

- `tools/import-reference-art.py`: SHA256-verifies **all 18 PNGs** against the signed-off bundle manifest (20,178,588 original bytes) without modifying production assets. Checked on the conversation's actual 2026-10-13 ZIP with a dry run and a populated stage including **14** optional trial WebPs.
- `tools/normalize-reference-rings.py`: offline NumPy/OpenCV radial remapping of all **seven** transparent source C-rings from the verified originals to uniform nested band increments. The code was run against the supplied images; exports total **194,064 bytes** as WebP quality-90. An initial static composition uses the newly normalized rings over `reference-empty-arena.png` and gives visually credible depth, with known remaining issues: outer/middle ring registration, dynamic gap walls, alpha fringes, center pearl, and source shading during rotations.
- There is also a standalone **calibration-page experiment** in the conversation workspace with live sprite rotations and fixed-stage UI, intended as an integration study, not a replacement for production puzzle logic; Chromium here is blocked by the environment's managed `URLBlocklist: ["*"]` policy, so it has **not passed browser interaction or no-scroll screenshots**.

The import and normalization tools are developer-only and do not add frontend JS dependencies. Their outputs are staging artifacts; integration to `src/render/RingBoard.tsx`, `src/render/DioramaScene.tsx`, and `src/styles/app.css` must preserve the existing application's domain semantics and build gates.

## Critical artwork-to-domain index mapping

The source art labels the **outermost red circle as Ring 1**, with orange=2, yellow=3, green=4, blue=5, indigo=6 and the **innermost violet as Ring 7**. The production app's `LABELS` / `RingBoard` use the reverse internal order: violet domain index `0`, indigo `1`, blue `2`, green `3`, yellow `4`, orange `5`, red `6`. The source-art file `ring-N-<color>.png` must bind to **internal ring index `7 - N`**, never `N-1`. Keep the existing cycle vector, ring geometry, aria labels and reducer dispatch owner intact. Assert this mapping in a focused integration test before rendering exported assets in the main game.
