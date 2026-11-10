---
id: SPEC-0007
status: implemented
---

# Cart totals with tax

## Problem

Checkout needs a total that includes tax. Callers pass a tax rate as a fraction
(`0.2` for 20%).

## Acceptance criteria

- **AC-1** — `total(items, taxRate)` returns the subtotal of `items` plus tax.
- **AC-2** — the returned total is rounded to two decimals, so float noise (for
  example `24.000000000000004`) never reaches the caller. Rounding applies to the
  exact value of the computed double: a price that is not exactly a half cent
  (for example `1.005`, stored slightly below it) has no tie to break, and no
  particular tie-breaking rule is required.
- **AC-3** — a negative `taxRate` throws a `RangeError`.

## Out of scope

- Tax rules per region, discounts, and shipping.
