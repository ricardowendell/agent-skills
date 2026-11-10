---
id: SPEC-0020
title: Echo status
status: ready
tests: []
---

# SPEC-0020: Echo Status

## Purpose

Expose a tiny status helper for the health endpoint.

## Scope

- Add an exported `echoStatus(n)` helper.

## Acceptance Criteria

- `echoStatus(1)` returns `"ok"`.
- `echoStatus(0)` returns `"empty"`.

## Open Questions
