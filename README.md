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

After `npm run build`, run `npm run visual:audit` to capture the single-screen landscape/rotated-portrait viewport matrix, identify escaping controls and scrolling, and record screenshot/geometry evidence. `npm run visual:audit -- --strict` enforces the new fit tests (not yet part of the green quality gate; first close the existing deviations). For source-image comparisons, optionally install Pillow and run `python scripts/visual-reference-compare.py --reference docs/3d-ring-renderer-concept.jpg --actual artifacts/screenshots/reference-layout-1440x1000.png --mode contain`. Cross-aspect differences are exploratory only. See [`docs/reference-fidelity-finish-plan.md`](./docs/reference-fidelity-finish-plan.md).

## User-supplied 2026-10-13 artwork bundle

The complete 18-image source set was supplied as `ring-road-reference-assets-2026-10-13.zip` in the project conversation, but **the image binaries are not yet in GitHub**. After placing the ZIP in your checkout, run `python tools/import-reference-art.py path/to/zip --include-trial-webp`. All 18 masters are SHA256 verified and staged outside the production runtime. For a radial normalization experiment, install `python -m pip install -r tools/requirements-visual.txt`, then run `python tools/normalize-reference-rings.py --originals artifacts/reference-art-import/art-source/ring-road-2026-10-13/originals`. Do not ship those experimental ring images until visual geometry, motion, markers and mobile fit are accepted. See `docs/reference-asset-inventory.md`.
