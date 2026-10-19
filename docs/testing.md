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

One activation must visibly and logically equal one step. Reset and puzzle changes must not queue stale motion. The permanent browser smoke harness runs full interaction coverage at 320×568 compact mobile, 390×844 mobile, and 1440×1000 desktop, plus structural responsive passes at 360×800, 430×932, 768×1024, 1024×768, and 1920×1080, and a 720×500 desktop CSS viewport as a 1440×1000-at-approximately-200%-zoom reflow proxy. It checks true horizontal overflow, clipped and sub-44px interactive targets, guide/modal layout, primary board/control/navigation containment, responsive scenic-package selection, decorative-art input transparency, modal focus acquisition, visible keyboard focus, Escape dismissal and focus restoration, reduced-motion transition collapse, CW/CCW input, undo, reset, puzzle navigation, rapid alternating input on a 19-step ring under a 1500ms ceiling measured without OS-timer scheduling noise, aligned under/exact/over target states on a wrapped puzzle, solution display, exact authored-solution replay through real controls, center fire, ordinary completion, completion-driven advancement, final-puzzle campaign mastery, and continued gameplay layout after decorative art is deliberately removed. Unit coverage separately guards the directed-route completion invariant so cancellation padding cannot satisfy the runtime win condition. Final current-build screenshots at both canonical sizes were directly compared with the restored concept image; the comparison drove the V8 composition/scenery correction, whose resulting captures were then re-reviewed. Keep deeper visual judgment manual; extend this harness only for stable critical flows. The existing classic production baseline treats a physical-device spot-check as optional external release verification. **The opt-in painted-reference skin has a stricter, still-open acceptance gate:** actual landscape Chrome on a physical phone (including browser chrome and safe areas) and user visual approval are required before promoting painted mode to default. Synthetic Chrome viewport tests do not establish real-device behavior. This requirement is tracked in [reference-fidelity-finish-plan.md](./reference-fidelity-finish-plan.md) and [issue #244](https://github.com/gamesbyian/Ring-Road/issues/244).

## Painted reference skin (opt-in only)

Painted is the sole shipping renderer, with the real React reducer, source-painted C-ring textures and accessible live DOM controls. `npm run browser:smoke` now runs the strict painted physical-coordinate acceptance subset (including Pixel 6 Pro 892×412 and CSS-rotated 412×892), while CI runs `scripts/visual-viewport-audit.mjs --skin painted --strict` across **13 simulated Chrome viewport dimensions**, including landscape and whole-shell CSS-rotated portrait. It checks no scrolling, no clipped/blocked or sub-44px buttons, artwork decode and real CDP coordinate clicks. Critical gameplay flows include rotation, Undo, Reset, navigation, Hint, Solution and focus restoration; native 1536×864 acceptance additionally clicks each ring through a complete clockwise and counterclockwise cycle (62 physical ring clicks), verifies each unbounded 360°/−360° sprite advance and Reset recovery, then solves puzzle 1 in eleven physical moves, fires the live pearl and checks its real completion dialog and Best record.

**Open-dialog phone audit (painted):** At 568×320, 844×390, physically CSS-rotated 390×844 and native 1536×864, the true physical-coordinate Goal/Guide, Hint and Solution journeys retain separate open-modal PNGs (with SHA256 digests in the viewport report). The audit checks the actual modal panel, heading, footer, Close hitbox (>=44 physical CSS px), center hit testing and document/root/shell overflow. Internal dialog-content scrolling is permitted; body/page scrolling is not. These are emulated Chrome viewports, **not** a real-phone certificate. Preserve readable phone layouts and focus restoration when refining modal visuals.

**Real input at compact sizes:** The strict painted audit also replays the source-verified exact eleven-move Puzzle 01 route through physical CDP coordinate clicks on 568×320, 844×390 and CSS-rotated 390×844, then genuinely fires the center and inspects the completion modal, Best 11, visible/hittable Next puzzle and Close footer. It retains distinct aligned-pre-fire and fired-completion PNGs and hashes at each size (844 screenshot is taken after restoring DPR1 from its separate reduced-motion/DPR2 check). These remain **Chrome emulation**, not human touch on a real phone. No source screenshot corresponds to these dynamic states.

**2026-10-19 hardware-compositing regression:** Owner screenshots of deployed painted mode on an actual Android phone show missing colored rings/control segments, flickering textures, and a partly blank/clipped Guide, despite green 13-view software-only Chrome tests. The historical CDP harness explicitly launched Chrome with `--disable-gpu`, so those green images never tested the GPU compositing path. The focused `--compositor swiftshader` option now runs the 568×320, 844×390, CSS-rotated 390×844 and native 1536×864 journeys without `--disable-gpu`, using Chromium's supported SwANGLE/SwiftShader graphics backend. Its separate `ring-road-painted-swiftshader` artifact is diagnostic evidence only, **not** a physical Android driver test. The corrected paint pipeline also crops the seven ring textures to the true source annuli, avoids permanent `will-change` layers, and disables painted-modal backdrop blur. These changes have pixel-coverage and code-state assertions; real-phone confirmation is still mandatory before closing #244.

The native 1536×864 Chrome screenshot corpus includes the untouched initial board, a genuinely clicked red-ring step, the exact eleven-move aligned pre-fire position, and the real fired-completion modal/Best state. These three *additional* poses have independent SHA256 digests and must differ from one another and from the initial capture. The completion image is **application-observed**, with no corresponding authored source-image pose, and must not be pixel-scored as though it were the canonical photograph.

CI retains native 1536×864 captures and compares against `docs/assets/reference-play-1536x864.jpg` using `scripts/visual-reference-compare.py` with regional metrics plus an independent violet-center pixel integrity guard. The comparator reports the original y=394 single-ray material transect and a new five-ray native optical survey: per-band readings, explicit missing samples, median and worst edge/width shifts. It is a hue/lighting-sensitive *diagnostic*, not a board geometry certificate or ship gate. CI also assembles `reference-diff/board-multipose-contact.png` from the real native reference, untouched live state, physically clicked one-step state, and actual eleven-move aligned pre-fire capture. Review the four distinct poses for alpha-notch walls, shadows and frozen background artifacts; do not treat unlike game states as a pixel-exact score. Static-photo similarity is diagnostic; legitimate state-dependent ring gap positions may differ from the reference. Run screenshot inspections before merging visual changes. **13 synthetic viewports are not 13 physical devices**.

## Prototype comparison

Run `npm run prototype` only when behavior evidence is needed. Its CDN dependencies require network access. Production checks never execute or import archived prototype code.

## Pixel 6 Pro primary viewport gate (2026-10-19)

The primary physical target is 892×412 CSS landscape at DPR 3.5 (native 1440×3120 panel), and 412×892 CSS-rotated portrait. Browser-chrome stress uses 840×360 / 360×840. Strict UI audit requires full on-screen painted canvas, all live controls with ≥44×44 CSS-pixel touch bounds, tappable left/right gutters on primary landscape, genuine eleven-step completion, guide/hint/solution modals, reduced-motion and composited screenshots. The web homepage without `?skin` and even a legacy `?skin=classic` query must mount painted only. Missing artwork should produce an explicit retry UI without classic fallback. Chrome emulation does not resolve prior physical Android compositor failures.
