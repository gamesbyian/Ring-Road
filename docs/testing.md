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
npm run check:art
npm run check:context
npm run browser:smoke
```

`npm run check:art` enforces per-asset review thresholds, desktop/mobile package budgets, variant placement, manifest registration, and the maximum scenic-layer count.

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

One activation must visibly and logically equal one step. Reset and puzzle changes must not queue stale motion. The permanent browser smoke harness runs full interaction coverage at 320×568 compact mobile, 390×844 mobile, and 1440×1000 desktop, plus structural responsive passes at 360×800, 430×932, 768×1024, 1024×768, and 1920×1080, and a 720×500 desktop CSS viewport as a 1440×1000-at-approximately-200%-zoom reflow proxy. It checks true horizontal overflow, clipped and sub-44px interactive targets, guide/modal layout, primary board/control/navigation containment, responsive scenic-package selection, decorative-art input transparency, modal focus acquisition, visible keyboard focus, Escape dismissal and focus restoration, reduced-motion transition collapse, CW/CCW input, undo, reset, puzzle navigation, rapid alternating input on a 19-step ring under a 1500ms ceiling measured without OS-timer scheduling noise, aligned under/exact/over target states on a wrapped puzzle, solution display, exact authored-solution replay through real controls, center fire, ordinary completion, completion-driven advancement, final-puzzle campaign mastery, and continued gameplay layout after decorative art is deliberately removed. Unit coverage separately guards the directed-route completion invariant so cancellation padding cannot satisfy the runtime win condition. Final current-build screenshots at both canonical sizes were directly compared with the restored concept image; the comparison drove the V8 composition/scenery correction, whose resulting captures were then re-reviewed. Keep deeper visual judgment manual; extend this harness only for stable critical flows. A physical-device responsiveness spot-check is optional external release validation. It is tracked in `production-completion.md` and is not unfinished implementation.

## Prototype comparison

Run `npm run prototype` only when behavior evidence is needed. Its CDN dependencies require network access. Production checks never execute or import archived prototype code.
