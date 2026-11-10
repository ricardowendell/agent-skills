---
spec: SPEC-0010
---

# Implementation Prompt: SPEC-0010 Slug helper

## Requirements

Add `slugify(text)` that lowercases the text and joins the words with `-`.

## Operations

1. In `src/index.js`, add and export `slugify`.
2. Add `tests/slugify.test.js` covering the AC.

## Safeguards

- Do not change `trim`.

## Verification

- `node --test`
