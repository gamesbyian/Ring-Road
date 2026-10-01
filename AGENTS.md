# Ring Road agent guide

Compact router. Read only the authority needed for the task; do not load the archived prototype by default.

## Current direction

Ring Road is being rebuilt for production. The existing single-file app is a prototype/reference implementation.

For production work, start with `docs/3d-ring-renderer-plan.md` and `docs/architecture.md`.

Do not preserve prototype architecture merely for compatibility.

## Route by task

| Task | Read first |
|---|---|
| Production rebuild / implementation | `docs/3d-ring-renderer-plan.md`, then `docs/architecture.md` |
| Gameplay/domain semantics | `docs/architecture.md`, then `src/domain/` and `src/test/`; prototype only for parity evidence |
| Puzzle authoring / campaign | `src/content/campaign.ts`, domain validation/tests, then archived prototype only as reference |
| Renderer/UI/accessibility | dimensional-renderer plan sections, then `src/render/`, `src/App.tsx`, and `src/styles/` |
| Solver/alignment/exact-move behavior | `docs/architecture.md`, then `src/domain/solver.ts` and domain tests |
| Validation / red CI | `docs/testing.md`, then the failing script/test |
| Repository hygiene | execute `docs/periodic-repository-hygiene.md` from current `main` |
| Documentation ownership | `docs/README.md` |

## Prototype rule

Once archived, prototype files are read-only reference material.

Use them to answer questions such as "what did the prototype do?" Do not route ordinary implementation work into them.

If production intentionally differs from prototype behavior, encode the intended result in production tests and update current docs.

## Working rules

1. Read current plan/architecture and production implementation before editing.
2. Treat prototype code as evidence, not architectural authority.
3. Keep gameplay truth framework-independent and single-owned.
4. Rendering consumes domain state and never redefines puzzle semantics.
5. Prefer a clean production solution over compatibility scaffolding.
6. Keep dependencies modest and justified by recurring value.
7. Keep CI fast enough to use constantly.
8. Do not weaken validation to make CI green.
9. Keep mutable facts in one current authority; replace stale claims instead of appending competing ones.
10. Use branches/PRs for changes and leave the repository at a safe handoff point.

## Product invariants

- seven rings;
- discrete cycle-driven rotation;
- shared-spoke solved state;
- cosmetic board orientation independent of solvability;
- exact target move count;
- continuous same-direction wraps may be required;
- campaign puzzles normally have one exact intended move-allocation vector unless ambiguity is explicit;
- mobile usability and immediate-feeling input are requirements.

## Verification

Use the production scripts defined by the rebuild as they are introduced.

During the transition, run the existing repository checks as well. Browser-facing changes require direct interaction testing on a narrow/mobile viewport.

## Context budget

Keep agent routing and current architecture compact. Archived prototype size does not count as ordinary agent context because agents should not load it unless reference behavior is specifically needed.
