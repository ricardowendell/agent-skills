# Demo: Settings Panel

## Stack

- Language: JavaScript (ESM), no build step
- Runtime: node

## Styling

- Component styles live beside the component, in `<Component>.module.css`.
- `src/styles/global.css` is the shared reset and the base for page-level
  elements. Do not change it for a single component: a rule there restyles every
  screen that uses the same class.

## Quick Start

```bash
node --test
```

## Docs Layout

- `docs/specs/` — SPEC-NNNN-name.md
- `docs/prompts/` — SPEC-NNNN-*.prompt.md
