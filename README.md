# Ring Road

Ring Road is a seven-ring alignment puzzle implemented as a production TypeScript application. Rotate every concentric ring until its gap shares one spoke, using exactly the puzzle's target number of moves.

## Production development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Use `npm run check` for the deterministic local quality gate. Use `npm run browser:smoke` after a production build when Chrome is available to exercise the critical desktop/mobile interaction flow. Repository routing starts in [`AGENTS.md`](./AGENTS.md); current implementation boundaries live in [`docs/architecture.md`](./docs/architecture.md), while [`docs/3d-ring-renderer-plan.md`](./docs/3d-ring-renderer-plan.md) records the completed production rebuild and renderer invariants. The active **reference-exact, no-scroll landscape** finish contract is [`docs/reference-fidelity-finish-plan.md`](./docs/reference-fidelity-finish-plan.md); the earlier [`docs/diorama-visual-overhaul-plan.md`](./docs/diorama-visual-overhaul-plan.md) is implementation history, not final visual acceptance. [`docs/production-completion.md`](./docs/production-completion.md) maps every acceptance criterion to its evidence and records the optional physical-device release-validation check separately from completed implementation.

## Frozen prototype

The original single-file proof of concept is preserved at [`prototype/v1/`](./prototype/v1/README.md). It is runnable reference evidence, not a production source tree.

## Reference-fidelity tooling

After `npm run build`, run `npm run visual:audit` to capture the single-screen landscape/rotated-portrait viewport matrix, identify escaping controls and scrolling, and record screenshot/geometry evidence. `npm run visual:audit -- --skin painted --strict` enforces the no-scroll, physical viewport, semantic hit-box and painted input-path checks at 13 resolutions, including rotated portrait. The CI painted capture matrix is the browser evidence used for every visual PR. For source-image comparisons, optionally install Pillow and run `python scripts/visual-reference-compare.py --reference docs/3d-ring-renderer-concept.jpg --actual artifacts/screenshots/reference-layout-1440x1000.png --mode contain`. Cross-aspect differences are exploratory only. See [`docs/reference-fidelity-finish-plan.md`](./docs/reference-fidelity-finish-plan.md).

## Painted reference artwork (available in repo)

The verified high-resolution user artwork is now checked in at `art-source/ring-road-2026-10-13/`. The original 13 modular PNG masters live under `originals/`, and five additional 1672×941 compositions and sheets under `highres-uploads/`. The user-uploaded anonymous root files were renamed by preserving their original Git blobs; see [classification evidence](./docs/highres-upload-classification.md).

The complete optimized **20-WebP runtime package** and its SHA256/byte-size manifest are already checked in under `public/reference-skin/`. No additional upload, ZIP or conversion is required to preview the painted renderer. To run it locally:

```bash
npm ci
npm run dev
# open the local Ring Road app and append ?skin=painted
```

The painted mode is an **opt-in visual acceptance candidate** until user-approved as the default. The existing game remains the fallback if the full art package fails to decode or validate. Source art remains separate from browser-delivered assets.

After building, run `npm run visual:audit -- --skin painted --strict` and inspect `artifacts/visual-viewport-audit/` (PNG captures plus JSON bounds). The test includes actual coordinate-driven browser interactions on selected landscape/portrait screens; it does not replace final physical-device inspection or visual review against the 1536×864 reference. A reproducible [physical-phone acceptance script](./docs/painted-physical-device-acceptance.md) covers browser chrome, real touch, portrait rotation, genuine eleven-move completion, dialog layout, screenshots and explicit user signoff.

For optional art regeneration experiments, see `tools/import-reference-art.py`, `tools/normalize-reference-rings.py` and [the active finish plan](./docs/reference-fidelity-finish-plan.md). The source PNGs are never modified by the runtime.
