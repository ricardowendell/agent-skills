---
spec: SPEC-0020
spec_sha: 0000000000000000000000000000000000000000000000000000000000000000
---

# Implementation Prompt: SPEC-0020 Echo Status

## Requirements

Add an exported `echoStatus(n: number): string`. `echoStatus(1)` returns `"ok"`;
`echoStatus(0)` returns `"empty"`.

## Operations

1. In a new `src/echo.js`, add and export `echoStatus`.
2. Run `node --test`.

## Safeguards

- Do not modify `test/`. The existing tests are not part of this task.
- Do not modify `src/index.js`; `add` is used elsewhere.
- Do not mark the spec `implemented` unless the suite is green.

## Verification

- `node --test` — the whole suite, not only the new file.
