---
spec: SPEC-0007
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
