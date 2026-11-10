# Eval repo

## Rules

- `src/pricing/index.js` is the module's only public interface:
  `quote(order, catalog, now)`.
- Callers never compute tax, discounts or rounding themselves.
- No file over 120 lines.

## Commands

- Test: none configured
- Coverage: none configured
- Lint: none configured
