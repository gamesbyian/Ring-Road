# Ring Road documentation index

Task routing lives in `../AGENTS.md`. This file inventories current ownership; it is not a second agent guide.

| Document | Owns |
|---|---|
| `3d-ring-renderer-plan.md` | Completed production rebuild and dimensional-renderer architecture record |
| `reference-fidelity-finish-plan.md` | **Current reference-exact visual finish and single-screen landscape acceptance**; phase plan + tooling |
| `reference-regions.json` | Machine-readable reference landmarks and viewport test matrix |
| `reference-landscape-regions.json` | Registered 1536×864 canonical-photo visual comparison regions; distinct from the 4:3 landmark map |
| `sparse-reference-visual-verification.md` | Evidence confidence, image-limited agent review, and multi-state visual QA procedure |
| `reference-asset-inventory.md` | Exact map of all 18 source images, alpha/material details and importer workflow |
| `reference-skin-calibration-results.md` | Experimental textured ring geometry, 16:9/full-phone mock results, unverified browser gates |
| `diorama-visual-overhaul-plan.md` | Prior diorama implementation history; visual completion claims superseded |
| `architecture.md` | Implemented production boundaries and gameplay semantics |
| `android.md` | Android packaging, offline APK publication, Pixel installation and physical-hardware acceptance |
| `testing.md` | Quality gate, executable coverage, and browser finish line |
| `production-completion.md` | Final acceptance-evidence map and external release-validation boundary |
| `periodic-repository-hygiene.md` | Recurring repository entropy-control procedure |
| `agent-context-routes.json` | Routine authority budgets and production discovery routes |

Production code lives under `src/`. The frozen single-file exhibit and its source provenance live in `../prototype/v1/README.md`.

## Documentation rules

- One mutable fact gets one current owner.
- Current behavior belongs in current references, not dated progress prose.
- Prefer short links to duplication.
- Prototype behavior is evidence, not current architecture.
- Preserve useful historical reasoning in Git/PR history rather than inflating mandatory context.
- Add a new live document only when it owns a distinct durable concern.

Current shipping presentation (2026-10-19): painted-only across website and Android. `architecture.md` and `android.md` own the current mode, Pixel 6 Pro (892×412 CSS) acceptance target and missing-asset recovery. Chronological classic-fallback instructions in visual history are superseded.
