---
id: SPEC-0021
title: Format currency
status: ready
tests: []
---

# SPEC-0021: Format Currency

## Purpose

Render amounts for the invoice screen.

## Scope

- Extend the existing currency formatting helper.

## Acceptance Criteria

- `formatCurrency(1234.5, "BRL")` returns `"R$ 1.234,50"`.
- An unknown currency falls back to the ISO code with two decimals.

## Open Questions
