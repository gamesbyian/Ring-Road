# Ring Road testing and finish line

## Complete local gate

After `npm ci`, run:

```bash
npm run check
```

The gate runs TypeScript strict checking, Vitest unit tests, a Vite production build, repository/link checks, and agent-context budgets. CI uses Node 22 and runs this same command.

Individual commands:

```bash
npm run typecheck
npm test
npm run build
npm run check:repo
npm run check:context
```

## Executable coverage

`src/test/domain.test.ts` owns normalization, one-step rotation, ring/spoke mapping, aligned/non-aligned states, target enumeration, directional distances, exact directed vectors, wraps, cycle constraints, full campaign validation, construct-from-solution parity, and deterministic cached ring geometry.

`src/test/game-state.test.ts` owns navigation, one-step and rapid alternating movement, undo, instant reset, history, cosmetic-orientation independence, authored-plan replay and hints, exact under/over-target reporting, center fire, modal exclusivity, and post-completion locking. Add reducer tests when gameplay transitions change; do not test state semantics through SVG details.

`scripts/check-repo.mjs` cheaply verifies production entry points, quality scripts, campaign ID continuity, the frozen prototype, and local Markdown links. `scripts/check-context-budget.mjs` guards mandatory-context size.

## Direct browser checks

For gameplay, renderer, control, or modal changes, run `npm run dev` and exercise:

- both directions on multiple rings, including rapid alternation;
- undo and reset;
- previous/next navigation;
- solution and guide dialogs;
- exact alignment and center fire;
- aligned under/over target messaging;
- keyboard focus and activation;
- reduced-motion mode;
- a narrow portrait viewport with no horizontal overflow.

One activation must visibly and logically equal one step. Reset and puzzle changes must not queue stale motion. Browser automation should be added when the interface stabilizes enough that its recurring regression value exceeds its maintenance cost.

## Prototype comparison

Run `npm run prototype` only when behavior evidence is needed. Its CDN dependencies require network access. Production checks never execute or import archived prototype code.
