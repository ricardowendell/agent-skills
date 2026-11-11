# Demo: Publishing

## Stack

- Language: JavaScript (ESM), no build step
- Runtime: node

## Styling

- Component styles live beside the component, in `<Component>.module.css`.
- `src/styles/global.css` is the shared reset. Do not change it for a single
  component.

## Quick Start

```bash
node --test
```

## Docs Layout

- `docs/specs/` — SPEC-NNNN-name.md
- `docs/prompts/` — SPEC-NNNN-*.prompt.md
- `docs/statuses.md` — the status model shared by the editor and the badge
