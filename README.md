# Ring Road

Ring Road is a seven-ring alignment puzzle implemented as a production TypeScript application. Rotate every concentric ring until its gap shares one spoke, using exactly the puzzle's target number of moves.

## Production development

```bash
npm install
npm run dev
```

Use `npm run check` for the deterministic local quality gate. Use `npm run browser:smoke` after a production build when Chrome is available to exercise the critical desktop/mobile interaction flow. Repository routing starts in [`AGENTS.md`](./AGENTS.md); current implementation boundaries live in [`docs/architecture.md`](./docs/architecture.md), while [`docs/3d-ring-renderer-plan.md`](./docs/3d-ring-renderer-plan.md) records the production rebuild, visual target, and remaining release validation.

## Frozen prototype

The original single-file proof of concept is preserved at [`prototype/v1/`](./prototype/v1/README.md). It is runnable reference evidence, not a production source tree.
