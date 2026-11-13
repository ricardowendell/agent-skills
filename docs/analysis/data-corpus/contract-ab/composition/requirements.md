# Requirements — `orders_export`

What the owner and the first consumer agreed on, 2026-11-12. Anything not here is
unknown and must not be invented.

## Purpose and consumers

- One reporting consumer ("revenue dashboard") reads the table.
- One row per order, one row per `order_id`. Orders are never split or merged.
- The table exists since 2020-01-01; cancelled orders are included.
- There is no hard-delete feed. Late-arriving corrections overwrite the row.

## Meaning of the columns

| Column | Meaning | Notes |
| --- | --- | --- |
| `order_id` | Internal order identifier | primary key, never reused |
| `customer_id` | Customer identifier | the consumer joins on it |
| `amount_cents` | Order amount in cents | divide by 100 for the currency amount |
| `placed_on` | Order date | UTC, no time component |
| `channel` | Acquisition channel | optional; known values `web`, `store`, `partner`, otherwise `NULL` |

## Platform and ownership

- Target: Postgres 16, database `sales`, schema `public`, table `orders_export`.
- Owning team: `sales`.
- Freshness TODO: the owner has not agreed a number yet; say `TODO` and name it
  for the owner instead of inventing an SLA.
- The contract is `draft` until the consumer signs off.

## Constraints

- The contract must be a valid ODCS v3 file and pass `datacontract lint`.
- No credentials in the contract; the platform connection is not part of this
  task.
- The description of `amount_cents` must state the unit.
