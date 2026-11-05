---
id: SPEC-0045
status: ready
---

# Rate limit header

## User outcome

An API client can see how many requests remain before it is throttled.

## Scope

- Add `X-RateLimit-Remaining` to every successful response.
- Return `429` with the same header when the limit is exhausted.

## Acceptance criteria

- AC-1 — a successful response carries `X-RateLimit-Remaining` with the remaining count.
- AC-2 — the count decreases by one per accepted request.
- AC-3 — the request that exceeds the limit returns `429` and `X-RateLimit-Remaining: 0`.

## Non-goals

- Per-endpoint quotas and a reset timestamp.
