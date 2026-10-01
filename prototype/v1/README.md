# Ring Road prototype v1 (frozen)

This directory is frozen reference material copied intact from commit
`136ab5f92c1568c13be522624517b0e43fc09f27`.

Use it to inspect or compare the prototype's campaign data, puzzle formulas, solver
behavior, copy, SVG presentation, and interaction semantics. It is evidence for
the production rebuild, not production architecture.

Do **not** develop production features here. Production work belongs under
`src/`, with current ownership described by `docs/architecture.md`. The adjacent
`SHA256SUMS` record lets repository checks detect accidental changes to the exhibit.

## Run the exhibit

The archived `index.html` retains its original CDN dependencies and can be served
from the repository root:

```bash
npm run prototype
```

Then open the printed `/prototype/v1/` URL. An internet connection is required
to load the prototype's CDN-hosted React, Babel, and Tailwind dependencies.
