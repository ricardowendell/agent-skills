---
spec: SPEC-0007
spec_sha: 0000000000000000000000000000000000000000000000000000000000000000
---

# Implementation Prompt: SPEC-0007 Double Helper

## Requirements

Add an exported `double(n: number): number` function. `double(3)` must return `6`.

## Operations

1. In `src/index.ts`, add and export `double`.
2. Add a test in `tests/demo.test.ts` that checks `double(3) === 6`.

## Safeguards

- Do not change `add` or any other existing public API.

## Verification

- `bun test`
