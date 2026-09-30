# Ring Road documentation index

Task routing lives in `../AGENTS.md`. This file inventories current ownership; it is not a second agent guide.

| Document | Owns |
|---|---|
| `3d-ring-renderer-plan.md` | **Canonical production rebuild and dimensional-renderer implementation plan** |
| `architecture.md` | Current architectural status, canonical gameplay semantics, production boundaries |
| `testing.md` | Validation commands, what they protect, and finish-line expectations |
| `periodic-repository-hygiene.md` | Recurring repository entropy-control procedure |
| `agent-context-routes.json` | Routine agent-context files and byte budgets |

The existing single-file implementation is prototype/reference material and should be archived during Phase 0 of the production plan.

## Documentation rules

- One mutable fact gets one current owner.
- Current behavior belongs in current references, not dated progress prose.
- Prefer short links to duplication.
- Prototype behavior is evidence, not current architecture.
- Preserve useful historical reasoning in Git/PR history rather than inflating mandatory context.
- Add a new live document only when it owns a distinct durable concern.
