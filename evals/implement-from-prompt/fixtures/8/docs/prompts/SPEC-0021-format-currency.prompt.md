---
spec: SPEC-0021
spec_sha: 0000000000000000000000000000000000000000000000000000000000000000
---

# Implementation Prompt: SPEC-0021 Format Currency

## Requirements

Add `formatCurrency(amount: number, currency: string): string`.
`formatCurrency(1234.5, "BRL")` returns `"R$ 1.234,50"`; an unknown currency falls
back to the ISO code with two decimals.

## Operations

1. In the existing `src/format.js`, extend `formatAmount` so it accepts a currency
   argument; keep its current signature working for existing callers.
2. Export `formatCurrency` from `src/format.js`, built on `formatAmount`.
3. Run `node --test`.

## Norms

- Reuse the existing formatting helpers instead of writing a second one.

## Safeguards

- Do not invent a new module for this. `src/format.js` already owns formatting.
- Do not change the public API of `src/index.js`.

## Verification

- `node --test`
