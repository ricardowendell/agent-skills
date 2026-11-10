---
id: SPEC-0008
status: ready
---

# Retry a transient call with backoff

## Problem

Checkout reads the tax rate from a remote service. A transient failure
(timeout, 503) must not fail the checkout on the first attempt.

## Acceptance criteria

- **AC-1** — `retry(fn, options)` returns the first successful result.
- **AC-2** — when `fn` throws, it retries at most `attempts` times in total,
  waits `baseDelayMs * 2 ** (attempt - 1)` ms between attempts, and rethrows the
  last error.
- **AC-3** — `attempts` defaults to 3 and `baseDelayMs` to 100; a non-positive or
  non-integer value throws a `RangeError`.

## Out of scope

- Circuit breakers, jitter, and retries outside checkout.
