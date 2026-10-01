# Production completion record

This document is the durable evidence map for the Ring Road production rebuild. It separates implementation completion from validation that requires external physical hardware.

## Completion status

The production rebuild and the in-repository diorama presentation overhaul are complete. The gameplay/domain rebuild remains unchanged by the visual work; the final visual evidence and deviations are recorded in [`diorama-visual-overhaul-plan.md`](./diorama-visual-overhaul-plan.md).

All implementation phases and acceptance criteria that can be established from source, automated tests, browser automation, repository structure, deployment automation, or canonical CI screenshot review are satisfied by the production path. The final diorama audit reviewed 390×844 and 1440×1000 production captures, corrected the rear architectural depth band, and re-ran the full quality gate.

One release-validation activity remains external to the repository: a physical mobile-device responsiveness spot-check. That check can increase confidence in device-specific performance, but it is not an unfinished implementation phase.

## Acceptance evidence

| Acceptance criterion | Evidence |
|---|---|
| Prototype preserved but not production | `prototype/v1/` is checksum-guarded; production entry point is `src/main.tsx`; repo routing forbids ordinary feature work in the archive. |
| Explicit domain/application/render boundaries | `src/domain/`, `src/app/game-state.ts`, `src/render/`, `src/content/`, and `src/ui/` have documented single ownership. |
| Puzzle semantics unit-tested | `src/test/domain.test.ts` covers normalization, one-step rotation, spoke mapping, alignment, target enumeration, directed distances, solver vectors, wraps, campaign constraints, representative prototype parity, authoring reconstruction, and geometry invariants. |
| Campaign validation executable | `validateCampaign()` runs at module initialization and is exercised by tests. |
| Prototype behavior preserved or deliberately superseded | Representative prototype puzzle states are locked by tests; intentional production differences are recorded in `architecture.md`. |
| Every logical state renders unambiguously | Ring visual state is derived from logical/unbounded orientation, static cut geometry is cached, and all moving ring surfaces share one rotor transform. |
| One input equals one legal step | Reducer tests and browser CW/CCW checks cover one-step behavior; unbounded visual state prevents wrap-boundary reverse animation. |
| Directed-route exactness | Runtime completion requires a single direction per moved ring; unit coverage rejects cancellation padding while same-direction wraps remain valid. |
| Aligned channel readability | Channel floor, notch walls, top surfaces and edges share deterministic ring-local geometry; final visual review passed at canonical mobile/desktop sizes. |
| Marker counts legible | Marker count is generated directly from cycle count; high-cycle rings are included in browser responsiveness coverage. |
| Center and campaign completion obvious | Browser flow verifies exact solution, enabled center, firing, ordinary completion, advancing from completion, and final-puzzle campaign mastery. |
| Exact move semantics and wraps | Domain solver/campaign tests plus browser under/exact/over coverage on a wrap puzzle. |
| Portrait mobile layout comfortable | Browser gate covers 320×568, 360×800, 390×844, and 430×932; it checks true horizontal overflow, primary layout containment, modal bounds, and 44px controls. |
| Rapid input/reset responsive | Browser gate exercises 30 alternating inputs on a 19-step ring under a broad regression ceiling, then reset recovery. |
| Reduced-motion behavior | Browser automation emulates `prefers-reduced-motion: reduce` and verifies ring transitions plus V5 scene/completion motion collapse. |
| Keyboard/modal accessibility | Modal focus acquisition, Escape dismissal, focus restoration, visible keyboard focus, 44px controls, and a 200%-zoom-equivalent reflow viewport are browser-tested; controls retain semantic buttons and labels. |
| CI fast/deterministic | `npm ci`, `npm run check`, and the dependency-free Chrome smoke gate run in CI; Pages publishing also executes the deterministic quality gate. |
| Fresh-agent discoverability | `AGENTS.md`, `docs/architecture.md`, `docs/README.md`, and context routes point directly to production authorities without requiring prototype loading. |
| Diorama presentation | Canonical 390×844 and 1440×1000 CI captures were visually reviewed; the board is installed in a four-band miniature scene, the HUD uses one plaque/material family, and the V7 architecture-depth correction passed the full browser gate. |
| Production deployment | GitHub Pages builds and publishes `dist/`; deployment is base-path aware and was verified green after the production audit. |

## Resolved plan deviations

The original Phase 1 wording proposed a standalone lint command. The finished repository deliberately does not add a general-purpose lint dependency merely to satisfy that wording. Strict TypeScript, focused repository checks, domain/unit tests, build validation, and browser checks provide higher-value static and behavioral coverage for this small codebase. A dedicated linter should be added later only when it catches a recurring class of defects not already covered by these gates.

The plan also originally treated several accessibility, target-state, responsive, zoom, and decorative-failure behaviors as manual review items. Stable portions are now automated in `scripts/browser-smoke.mjs`; visual taste and physical-hardware performance remain matters for direct review.

The diorama reference JPEG retained in `docs/3d-ring-renderer-concept.jpg` is not decodable by standard JPEG tooling in its current repository form. V7 therefore audited against the plan's documented reference intent and canonical production screenshots rather than claiming a direct image-to-image comparison.

## External release validation

Before calling a particular release physically validated on mobile hardware, exercise the deployed build on at least one representative touch device and check:

- repeated rapid ring input;
- reset after rapid input;
- 19-step marker/ring readability;
- modal scrolling and fixed footer behavior;
- center-fire interaction;
- portrait layout with browser chrome present;
- heat/jank or visibly delayed interaction.

A failure there should produce a normal implementation issue. A pass does not require another architecture phase.
