# Ring Road agent guide

Compact router. Read only the authority needed for the task; do not load the whole repository by default.

## Route by task

| Task | Read first |
|---|---|
| Gameplay/code change | `docs/architecture.md`, then the relevant `index.html` region via `npm run context` |
| Puzzle authoring / campaign data | `docs/architecture.md#puzzle-model-and-campaign`, then `npm run context -- --section=campaign` and `--section=solver` |
| Renderer/UI/accessibility | `docs/architecture.md#rendering-and-ui`, then `npm run context -- --section=render` or `--section=app` |
| Solver/alignment/exact-move behavior | `docs/architecture.md#solver-and-win-semantics`, then `npm run context -- --section=solver` |
| Validation / red CI | `docs/testing.md`, then the failing script |
| Repository hygiene | Execute `docs/periodic-repository-hygiene.md` from current `main` |
| Documentation ownership | `docs/README.md` |

## Cheap discovery first

Do not open all of `index.html` merely to locate code.

```bash
npm run context -- --list
npm run context -- --section=campaign
npm run context -- --section=solver
npm run context -- --find=handleRotate
```

Use `--find` for named symbols and `--section` for a logical subsystem. Escalate to the full file only when the task genuinely crosses several regions.

## Working rules

1. Read current authority and implementation before editing. Chat summaries and old PR descriptions are context, not repository truth.
2. Preserve the current zero-build, dependency-free local tooling unless a concrete need justifies changing it.
3. Keep gameplay truth single-owned. Rendering must consume game state, not reinterpret puzzle rules.
4. Puzzle changes must preserve structural validation and exact-move semantics.
5. Prefer the smallest coherent change. Do adjacent work when required to close the loop, but avoid unrelated cleanup.
6. Do not weaken checks to make CI green. Fix the violated invariant or deliberately update the owning rule.
7. Keep mutable facts in one current authority. Replace stale claims rather than appending competing versions.
8. Put chronology, experiments, and screenshots beside plans or in PR history; do not turn the current docs into diaries.
9. Use branches/PRs for changes. Before push, run `npm run check`.
10. Do not babysit GitHub Actions. Deterministic failures should be reproduced locally first.

## Source invariants

- `index.html` is currently the shipped application.
- There are seven rings.
- Ring rotation is discrete and cycle-driven.
- Solved state is shared-spoke agreement, independent of cosmetic board orientation.
- The move target is exact, not a maximum.
- Continuous same-direction full wraps may be part of an intended exact solution.
- Campaign puzzles should normally have one exact intended move-allocation vector; intentional ambiguity must be explicit.
- The logical model, solver, rendering, and UI are distinct concerns even while they live in one file.

## Verification

Ordinary finish line:

```bash
npm run check
```

For browser-facing changes, also run the app and exercise the affected interaction manually on a narrow/mobile viewport.

## Context budget

`docs/agent-context-routes.json` owns the small set of files agents are expected to load routinely. `npm run check:context` fails only at generous maintenance triggers, not preferred target sizes. When a file crosses its trigger, compact duplicated or stale material back toward the target rather than merely raising the limit.
