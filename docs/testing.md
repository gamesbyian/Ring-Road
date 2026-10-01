# Ring Road testing and finish line

## Complete local gate

After `npm ci`, run:

```bash
npm run check
```

The gate runs TypeScript strict checking, Vitest unit tests, a Vite production build, repository/link checks, and agent-context budgets. CI uses Node 22, runs this deterministic gate, then runs the Chrome-backed browser smoke suite against the built production app.

Individual commands:

```bash
npm run typecheck
npm test
npm run build
npm run check:repo
npm run check:context
npm run browser:smoke
```

`npm run browser:smoke` requires the production `dist/` build plus `google-chrome`. CI runs it after `npm run check`; the script uses only Node 22 built-ins and Chrome's DevTools protocol, so browser coverage adds no npm dependency.

## Executable coverage

`src/test/domain.test.ts` owns normalization, one-step rotation, ring/spoke mapping, aligned/non-aligned states, target enumeration, directional distances, exact directed vectors, wraps, cycle constraints, full campaign validation, construct-from-solution parity, and deterministic cached ring geometry.

`src/test/game-state.test.ts` owns navigation, one-step and rapid alternating movement, undo, instant reset, history, cosmetic-orientation independence, authored-plan replay and hints, exact under/over-target reporting, center fire, modal exclusivity, and post-completion locking. Add reducer tests when gameplay transitions change; do not test state semantics through SVG details.

`scripts/check-repo.mjs` cheaply verifies production entry points, quality scripts, campaign ID continuity, the frozen prototype, and local Markdown links. `scripts/check-context-budget.mjs` guards mandatory-context size.

## Direct browser checks

For gameplay, renderer, control, or modal changes, use the automated browser smoke gate for stable critical flows and use `npm run dev` for visual/interaction judgment that automation cannot establish. Relevant manual checks include:

- both directions on multiple rings, including rapid alternation;
- undo and reset;
- previous/next navigation;
- solution and guide dialogs;
- exact alignment and center fire;
- aligned under/over target messaging;
- keyboard focus and activation;
- reduced-motion mode;
- a narrow portrait viewport with no horizontal overflow.

One activation must visibly and logically equal one step. Reset and puzzle changes must not queue stale motion. The permanent browser smoke harness covers 320×568 compact mobile, 390×844 mobile, and 1440×1000 desktop viewports. It checks true horizontal overflow, clipped interactive targets, guide/modal layout, modal focus acquisition, Escape dismissal and focus restoration, reduced-motion transition collapse, CW/CCW input, undo, reset, puzzle navigation, rapid alternating input on a 19-step ring, aligned under/exact/over target states on a wrapped puzzle, solution display, exact authored-solution replay through real controls, center fire, and completion. Unit coverage separately guards the directed-route completion invariant so cancellation padding cannot satisfy the runtime win condition. Final current-build screenshots at both canonical sizes were visually reviewed after that gate and did not expose a correction worth making. Keep deeper visual judgment manual; extend this harness only for stable critical flows. A physical-device responsiveness spot-check remains the only external release-validation item. It is tracked as such in `production-completion.md`; it is not an unfinished implementation gate.

## Prototype comparison

Run `npm run prototype` only when behavior evidence is needed. Its CDN dependencies require network access. Production checks never execute or import archived prototype code.
