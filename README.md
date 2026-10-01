# Ring Road

Ring Road is a seven-ring alignment puzzle implemented as a production TypeScript application. Rotate every concentric ring until its gap shares one spoke, using exactly the puzzle's target number of moves.

## Production development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Use `npm run check` for the deterministic local quality gate. Use `npm run browser:smoke` after a production build when Chrome is available to exercise the critical desktop/mobile interaction flow. Repository routing starts in [`AGENTS.md`](./AGENTS.md); current implementation boundaries live in [`docs/architecture.md`](./docs/architecture.md), while [`docs/3d-ring-renderer-plan.md`](./docs/3d-ring-renderer-plan.md) records the completed production rebuild and renderer invariants. The completed visual authority is [`docs/diorama-visual-overhaul-plan.md`](./docs/diorama-visual-overhaul-plan.md). [`docs/production-completion.md`](./docs/production-completion.md) maps every acceptance criterion to its evidence and records the optional physical-device release-validation check separately from completed implementation.

## Frozen prototype

The original single-file proof of concept is preserved at [`prototype/v1/`](./prototype/v1/README.md). It is runnable reference evidence, not a production source tree.
