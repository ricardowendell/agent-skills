# Demo: AI Agents Context

## Stack

- Language: JavaScript
- Runtime: node

## Conventions

- Text helpers live in `src/text.js`.
- `src/index.js` is the generated barrel: one banner line plus one
  `export * from "./<module>.js"` per module. Do not add implementation to it;
  `tests/generated.test.js` fails if you do.

## Docs Layout

- `docs/specs/` — SPEC-NNNN-name.md
- `docs/prompts/` — SPEC-NNNN-*.prompt.md

## Gates

- `node --test`
