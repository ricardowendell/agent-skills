# Architecture

## Rules

- `OrderService.create` owns the invariants of creating an order: it validates
  the request, opens and commits the transaction, and retries on a write
  conflict.
- `src/api/**` only maps input to a service call and the saved order to a
  response; it does not validate orders or manage transactions.
- `src/orders/repository.js` is storage only: it runs one statement and holds no
  business rule.
