# Eval repo

## Rules

- `src/orders/**` owns the invariants of creating an order: validation, the
  transaction boundary and the retry on a write conflict.
- `src/api/**` only translates a request into a service call and the result into
  a response. It does not validate domain rules or manage transactions.
- `src/orders/repository.js` is storage only: one statement, no business rule.

## Commands

- Test: none configured
- Coverage: none configured
- Lint: none configured
