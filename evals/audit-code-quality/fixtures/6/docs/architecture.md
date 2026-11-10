# Architecture

## Rules

- `src/pricing/index.js` is the module's only public interface:
  `quote(order, catalog, now)`.
- Tax, discount, rounding and input validation live behind that interface.
  Callers receive a total and a currency, never the intermediate values.
- `src/pricing/rules.js` and `src/pricing/money.js` are internal helpers,
  imported only from `src/pricing/index.js`.
