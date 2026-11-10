---
spec: SPEC-0007
spec_sha: feb763b1230bcf0b728b143c40dc7b39bc9de6be27068b618b6534db76a53dee
stack: node
---

# Implement SPEC-0007 — cart totals with tax

## Scope

Add `total(items, taxRate)` to `src/cart.js` and cover it in `test/cart.test.js`.

## Safeguards

- Do not change `subtotal`'s behaviour.
- Do not delete or weaken an existing test.
- `npm test` must pass.

## Done when

Every acceptance criterion in `docs/specs/SPEC-0007-cart-tax.md` has code and a
test that proves it.
