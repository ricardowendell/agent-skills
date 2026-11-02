---
spec: SPEC-0007
spec_sha: 4f2a1c9d0b8e7f6a5d4c3b2a1908f7e6d5c4b3a29180f7e6d5c4b3a291807f6e
---

# Implementation Prompt: SPEC-0007 Import CSV

## Source Spec

- docs/specs/SPEC-0007-import-csv.md

## Requirements

**Outcome:** Parse a pasted CSV into rows.

**Acceptance criteria (verbatim):**

- A three-column CSV yields one row per data line.

## Entities

| term | meaning |
| --- | --- |
| payload | the CSV text, pasted, not uploaded |

## Approach

One module, one function. The splitting helpers already exist.

## Structure

- `src/csv.js` — splitting helpers (existing)
- `test/csv.test.js`

## Operations

1. Read `src/csv.js` and confirm which helpers exist.
2. Call the line splitter; do not split on newlines by hand.

## Norms

- Commit format: `feat(scope): summary`.

## Safeguards

- Do not rewrite the helpers in `src/csv.js`.

## Verification

- AC-1: `node --test` stays green.
