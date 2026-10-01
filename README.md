# Ring Road

Ring Road is a seven-ring alignment puzzle being rebuilt as a production TypeScript application. Rotate every concentric ring until its gap shares one spoke, using exactly the puzzle's target number of moves.

## Production development

```bash
npm install
npm run dev
```

Use `npm run check` for the complete local quality gate. Repository routing starts in [`AGENTS.md`](./AGENTS.md); the canonical implementation plan is [`docs/3d-ring-renderer-plan.md`](./docs/3d-ring-renderer-plan.md).

## Frozen prototype

The original single-file proof of concept is preserved at [`prototype/v1/`](./prototype/v1/README.md). It is runnable reference evidence, not a production source tree.
