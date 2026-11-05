# Architecture

- Prices are plain numbers in the shop's currency; rounding happens inside the
  domain functions, never at the edge.
- `src/` holds pure functions with no I/O. Every exported function has at least
  one test in `test/`.
