# Ring Road testing and finish line

## Fast local finish line

```bash
npm run check
```

This is intentionally cheap and dependency-free.

It currently runs:

1. repository/puzzle structural smoke checks;
2. Markdown local-link checks;
3. agent-context maintenance-trigger checks.

These checks are guardrails, not a substitute for browser behavior testing.

## What the structural check protects

`scripts/check-repo.mjs` verifies important cheap invariants without trying to execute Babel/React in Node:

- expected application root and React mount exist;
- the seven-ring constant is present;
- campaign entries are parseable;
- puzzle IDs are unique and sequential;
- every puzzle has seven cycle values and seven initial states;
- cycle lengths satisfy the current prime/bound constraints;
- initial states are inside their ring cycles;
- move targets are positive;
- required source section markers remain discoverable;
- local Markdown links resolve.

If a source refactor makes these checks obsolete, update the checker as part of the same change. Do not silently delete coverage.

## Browser checks

For changes affecting gameplay, rendering, controls, or modals, run `npm run dev` and manually exercise the changed behavior.

At minimum for interaction changes:

- rotate both directions;
- undo;
- reset;
- previous/next puzzle;
- exact target alignment and center fire;
- under-target and over-target aligned messages where relevant;
- narrow portrait layout.

For renderer/performance changes, rapidly alternate rotations and reset several times. Input responsiveness is part of correctness.

## CI

`.github/workflows/ci.yml` runs `npm run check` on pushes and pull requests.

GitHub Actions is the integration gate, not the first place to discover deterministic failures.

## Adding tests

Prefer the smallest executable invariant that prevents a real regression.

Do not add a framework solely for stylistic completeness. Introduce browser automation or a richer test runner when recurring regressions justify its ongoing install/runtime/context cost.
