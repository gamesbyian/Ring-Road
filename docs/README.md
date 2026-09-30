# Ring Road documentation index

Task routing lives in `../AGENTS.md`. This file inventories current ownership; it is not a second agent guide.

| Document | Owns |
|---|---|
| `architecture.md` | Current application structure, state boundaries, puzzle model, solver, rendering, UI |
| `testing.md` | Validation commands, what they protect, and finish-line expectations |
| `periodic-repository-hygiene.md` | Recurring repository entropy-control procedure |
| `agent-context-routes.json` | Routine agent-context files and byte budgets |

Design proposals may live in additional docs or PR branches. A proposal does not become current architecture merely by existing; update `architecture.md` when implementation changes.

## Documentation rules

- One mutable fact gets one current owner.
- Current behavior belongs in current references, not dated progress prose.
- Prefer short links to duplication.
- Preserve useful historical reasoning in Git/PR history rather than inflating mandatory context.
- Add a new live document only when it owns a distinct durable concern.
