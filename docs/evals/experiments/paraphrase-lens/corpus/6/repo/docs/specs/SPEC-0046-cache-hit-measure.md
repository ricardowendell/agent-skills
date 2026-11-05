---
id: SPEC-0046
status: draft
---

# Measure the cache hit rate

## Purpose

The cache has no observable hit rate, so a change to it cannot be evaluated.

## User outcome

An operator reading the daily log can tell whether a cache change helped.

## Scope

- Emit one line per cache lookup with `hit` or `miss`.

## Acceptance criteria

- AC-1 — each lookup emits exactly one line containing `hit` or `miss`.
- AC-2 — the daily log can be filtered to count both values.

## Non-goals

- A dashboard, alerts and retention changes.
