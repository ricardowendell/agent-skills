# Agent conventions

## Contract

`orders_enriched` is the join of `orders` and the versioned `dim_customers`
dimension at the order grain.

- `orders_enriched` has exactly one row per `orders.order_id`.
- `sum(orders_enriched.amount_cents)` equals `sum(orders.amount_cents)`.
- `dim_customers` is a slowly changing dimension: an order may only be enriched
  by the row with `is_current = 1`. A customer with history must still produce
  one enriched row.
- An incompatibility is a finding even when the query runs: the check asserts
  the grain, not whether sqlite3 accepted the SQL.

The tree ships the defect as `@state = staged`. `@state = corrected` is the same
tree with the documented fix applied, so the oracle is proved on both states
without editing a file.

## Check

Run from the repository root:

    sqlite3 :memory: -bail \
      -cmd ".parameter set @state staged" \
      ".read docs/analysis/data-corpus/join-duplicate-keys/pipeline.sql" \
      ".read docs/analysis/data-corpus/join-duplicate-keys/check.sql"

Exit 0 means the contract holds; exit 1 means a finding. Replace `staged` with
`corrected` to run the fixed state.

Requirements: `sqlite3` only. No network, no Python, no fixture file written.
