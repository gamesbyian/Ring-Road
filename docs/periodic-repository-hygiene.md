# Periodic repository hygiene

Run this from current `main` when asked for repository hygiene or when substantial development has accumulated.

Goal: reduce future agent, review, CI, and maintenance cost without manufacturing cleanup work.

## Procedure

1. **Inspect current state**
   - recent commits and open PRs;
   - root files and directories;
   - CI status if relevant;
   - signs of actively owned work.
   Treat recent or ambiguous work as active. Do not trample it.

2. **Check routing and authority**
   - `AGENTS.md` still routes real task types correctly;
   - `docs/README.md` lists every current durable doc;
   - mutable facts have one owner;
   - proposals/history are not masquerading as current architecture.

3. **Check cheap discovery**
   - `npm run context -- --list` reflects source regions;
   - common symbols remain easy to find;
   - agents are not forced to open large files/catalogs for ordinary tasks.

4. **Check executable hygiene**
   - run `npm run check`;
   - inspect any stale/broken scripts or workflow references;
   - keep CI fast enough that agents will actually use it.

5. **Reverse-sweep completed work**
   - dead aliases or terminology;
   - obsolete comments;
   - abandoned compatibility paths;
   - temporary debug/prototype code;
   - docs that describe finished migrations as current work.

6. **Check repository debris**
   - generated artifacts accidentally committed;
   - editor/OS junk;
   - root-level scratch files;
   - duplicate screenshots/assets;
   - dead branches/PR work only when clearly safe to reconcile.

7. **Check context weight**
   - run `npm run check:context`;
   - if a maintenance trigger is crossed, remove duplication/staleness and compact substantially toward the configured target;
   - below the trigger, size alone is not cleanup debt.

## Principles

- Bounded inspection, not bounded scope: check every hygiene domain, but do not reread every byte.
- Preserve useful history in Git/PR history; keep live docs about live truth.
- Prefer deletion and consolidation over adding another explanatory layer.
- Do not weaken validation to reduce friction.
- Do not add dependencies or workflows without a concrete recurring need.
- A clean run with no material changes is a valid outcome.
