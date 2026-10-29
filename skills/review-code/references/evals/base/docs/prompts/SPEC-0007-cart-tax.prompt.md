---
spec: SPEC-0007
spec_sha: f5aab834f3a6fc743922a0a51b31c1715cb693e3cb6bddd60ec9c5e24df0b654
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
