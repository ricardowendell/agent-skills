---
spec: SPEC-0007
spec_sha: 0000000000000000000000000000000000000000000000000000000000000000
---

# Implementation Prompt: SPEC-0007 Import CSV

## Requirements

Import a CSV into rows.

## Entities

- `parseCsv(text)` in `src/import/csv.js`.

## Operations

1. Add `parseCsv` to `src/import/csv.js`.
2. Cover it with a fixture-based test.

## Norms

- Importers are pure and never write.

## Safeguards

- Do not change the existing importer signature.

## Verification

- `npm test`
