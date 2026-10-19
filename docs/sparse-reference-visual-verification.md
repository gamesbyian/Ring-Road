# Sparse-reference visual verification: painted Ring Road

**Purpose:** A review protocol for agents implementing a *working, stateful game* from a limited set of visual references. This document owns evidence classification and review practices, not the evolving artwork, scoreboard, or release gate. For current implementation and acceptance, use [the finish plan](reference-fidelity-finish-plan.md), [the 18-file source inventory](reference-asset-inventory.md), and [issue #244](https://github.com/gamesbyian/Ring-Road/issues/244). Painted remains opt-in until visual approval and real-phone testing.

## Why the evidence is sparse even with 18 images

The source package is unusually helpful: a canonical **1536×864** composition, earlier **1536×1152** concept, seven transparent C-ring originals, an unoccupied arena and other modular scenery/UI masters. But the canonical composition shows **one particular ring pose, static counters, one aspect ratio, and no open modal or focus states**. Unseen surfaces, dynamic states, animation, safe-area behavior and touch ergonomics cannot be inferred as pixel truths from that picture. Do not equate a pleasing invented solution with source evidence.

Use four explicit evidence classes when proposing a change:

| Evidence class | Ring Road example | Legitimate verification |
|---|---|---|
| **Direct source pixels** | Static 1536×864 control illustrations, logo, backdrop, parchment | Source crop vs actual native screenshot; registration/alpha/shadow inspection. Existing source-exact crop is allowed **beneath** genuine accessible controls. |
| **Source-derived transform** | Seven independently rotating source-painted C-rings; radial retopology | Original assets + documented transform; multiple actual rotation states, alpha-notch material, color/lighting, full ±360° cycle, reset recovery. |
| **Application-observed / unpictured** | Live moves/progress, aligned/pre-fire/completed frames, Hint/Undo, modal, focus, responsive phone layout | Real reducer + DOM + browser captures and event evidence; do not grade the screenshot against a source state that was never supplied. |
| **Inferred or unknown** | Hidden masonry behind rings, contact shadow at every gap angle, unseen safe-area/browser chrome | Label hypothesis, isolate experiment, inspect visual plausibility and interactions; require user/device review when decisive. Never claim pixel-exact approval. |

## Evidence matrix for a visual PR

Retain **separate** scores for stationary source-registered areas and dynamic board art. Use the registered native reference `docs/assets/reference-play-1536x864.jpg` **with** `docs/reference-landscape-regions.json`; `docs/reference-regions.json` maps the earlier 4:3 concept and is not the native photo's region specification. Native-region metrics are diagnostics, not a shipping threshold. Never merge a worse-looking experiment solely because one weighted number improves.

| State or presentation | Reference truth | Required inspection / evidence |
|---|---|---|
| Initial puzzle, 1536×864 | Canonical 16:9 source is the closest visual counterpart, but the actual puzzle gaps may differ | Side by side, registered static-region crops, whole-image score with state-difference disclosure; source checksums/commit |
| One real ring step | No matching authored frame | Existing captured state + legal reducer change, real gap/shadow/alpha/occlusion examination, absence of frozen ghost path |
| All seven rings through ±360° | Seven modular source sprites, not a motion sequence | Existing bidirectional 62 physical-coordinate click gate, exact frame/state/cycle checks; inspect selected angle crops on both stone and dark gaps |
| Eleven moves, aligned pre-fire | No photographed equivalent | Existing genuine distinct captured pose, coherent exposed trough, 11-move route/state checksum; do not use canonical MAE as a pass/fail |
| Fire/completion and subsequent puzzle | No matching source | Actual center hit, completion/Best/progress, visible modal/non-obstructed controls; add a retained screenshot if changed |
| Solution/Guide modal, Undo/Reset/Hint, keyboard focus | Only some *closed-state* controls appear in source atlas | Live DOM action/label/focus journey and bounded screenshots for changed components; no painted-but-dead proxy hotspot |
| 568×320, 844×390, rotated 390×844, tall landscape | Native 16:9 image defines style, **not** literal phone coordinates | Existing strict 13-viewport geometric and hit testing, before/after same-size screenshot; account for compact horizontal composition |
| 844×390 DPR2 reduced motion and physical phone | Emulated DPR2 capture exists; actual hardware has **not** been certified | Keep simulated/physical provenance separate; verify browser chrome/safe areas, reachability, motion, touch and zero scroll on a real handset before promotion |

### Minimum honest visual-diff loop

1. **Inventory before inventing.** Name the source file/crop, affected live components, the states the source actually shows, and any guessed occluded pixels. Preserve all seven controls and existing game actions. Generated mockups never override reducers, SVG/DOM accessibility, or original sources.
2. **Localize the discrepancy.** View the original and live capture at the *same native viewport*; crop one semantic region. Rank by incorrect layout/silhouette and painted material first, then details. The existing comparator's MAE/edge/region outputs are useful, but a mask that hides troublesome pixels can manufacture a nicer score.
3. **Edit one causal owner.** Keep scenery, ring geometry, dynamic game state and controls separately owned. Preserve pristine originals and provenance of generated/cropped outputs; no screenshot of a solved path masquerading as live art.
4. **Try to falsify it.** Inspect before/after screenshots and the changed region at two different true ring poses, plus one compact phone layout. Check for stationary alpha-gap ghosts, seams, light-direction inconsistency, missing captions, clipped taps and reduced-motion/focus regressions. Independently exercise the actual element rather than infer function from pixels.
5. **Publish claims at the correct level.** Record source SHA/viewport/DPR/pose, relevant screenshot checksums and PR CI URLs, regional delta where truly comparable, qualitative flaws, and `NOT VERIFIED` conditions. An observed Chrome emulation is never described as testing on a physical Pixel.

## Immediate operational priorities

- **P0:** Keep current registered 1536×864 reference crops and three genuinely distinct pose captures. In subsequent board PRs, compare *several* rays and changed angles, rather than optimizing the earlier single unobstructed hue transect. Explicitly distinguish changed puzzle pose from incorrect pigment/geometry.
- **P1:** For the next material/board revision, retain a **focused reference crop plus initial, one-step and aligned actual captures** and describe how gap walls, alpha fringe, recessed bed and shadows behave across poses. Prefer this small state bundle to a new generated full-scene reference.
- **P1:** On changes to completion/modal/Hint/focus or compact controls, retain targeted additional after-interaction screenshots, not a giant default atlas. Negative tests must challenge the reachable source-backed control; existing full-turn and no-scroll assertions stay intact.
- **Release blocker:** Complete physical landscape-phone and user visual approval in #244. Synthetic geometry and screenshot MAE cannot discharge this gate.

## Sources and transfer rationale

- [Wallgen implementation-safe redesign pack](https://github.com/gamesbyian/wallgen/blob/main/docs/IMPLEMENTATION-SAFE-REDESIGN-PACK.md), [adversarial review](https://github.com/gamesbyian/wallgen/blob/main/docs/UI-REDESIGN-ADVERSARIAL-REVIEW.md): source-inventoried control semantics, 1,648-state atlas vs focused smoke, independent attempts to falsify apparently finished screens. Wallgen's existing workflows are evidence of a **process**, not a claim of scientific performance.
- [Design2Code (NAACL 2025)](https://aclanthology.org/2025.naacl-long.199/): 484 real-page screenshot-to-code cases with separate visual measurements/human evaluation.
- [Divide-and-Conquer: Generating UI Code from Screenshots (PACMSE 2025)](https://doi.org/10.1145/3729364): controlled crop-by-region reconstruction reduces omissions and improves visual similarity in its setting. Adapt to semantic source crops, not a mandatory model/framework change.
- [Interaction2Code (ASE 2025)](https://github.com/WebPAI/Interaction2Code): static screenshots omit interaction effects, especially subtle ones. Ring motion must be tested as a real state transition.
- [VISTA: Visual Spec-to-Web-App Coding Agents (2026)](https://arxiv.org/abs/2605.26144): combine DOM-grounded visual anchors with behavioral checks; functional correctness and visual likeness are partially independent.
- [ui-from-image](https://github.com/Ixe1/ui-from-image) and [match-reference](https://github.com/Filtar2000/match-reference): practical agent patterns for screenshot → local crop/diff → edit → re-render. Their self-described tool behavior is implementation inspiration, not independent validation.

**Avoid:** importing a large generic screenshot-to-code model, rebuilding the reducer from visuals, generating a new canonical source screenshot, installing a new visual SaaS, or declaring a numerical visual score sufficient for acceptance. Existing scripts already cover much of the useful foundation.
