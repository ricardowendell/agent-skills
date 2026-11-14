---
spec: SPEC-0001
spec_sha: 0000000000000000000000000000000000000000000000000000000000000000
---

# Implementation Prompt: SPEC-0001 Slug Helper

## Requirements

Add an exported `slugify(input)` function to `src/index.js`. It must lowercase
the input, trim it, and join words with a single hyphen so that
`slugify("Hello World")` returns `hello-world`.

## Operations

1. Write the test in `test/slug.test.js` for `slugify("Hello World") ===
   "hello-world"`, then run `node --test` and see it fail.
2. In `src/index.js`, add and export `slugify` so that the test passes.
3. Update `docs/specs/SPEC-0001-slug.md` to `status: implemented` and record
   the test in `tests:`.

## Norms

- One test per acceptance criterion; `node --test` is the gate.
- ESM, no new dependencies, and no second test runner.

## Safeguards

- Do not change `add` or any other existing export.
- Do not rewrite the prompt or the spec's acceptance criteria.

## Verification

- The new test was run red before the implementation and `node --test` now
  passes.
- `slugify("Hello World")` returns `hello-world`.
