# Agent conventions

## Contract

This tree is a **negative**: a correct pipeline whose oracle must report zero
findings. It carries the two behaviours the defect fixtures target, already done
right.

- `revenue_by_customer` is the aggregate join at the customer grain: one row per
  customer, `sum(revenue_cents)` equal to `sum(orders.amount_cents)`, and every
  row named from the `is_current = 1` dimension row.
- `daily_events` is an incremental load with a natural key. The pipeline applies
  the same batch twice on purpose (an at-least-once retry); the result is one row
  per `event_id`.
- A check that reports anything here has invented a defect. The expected result
  is exit 0 with no finding lines.

## Check

Run from the repository root:

    sqlite3 :memory: -bail \
      ".read docs/analysis/data-corpus/negative-healthy/pipeline.sql" \
      ".read docs/analysis/data-corpus/negative-healthy/check.sql"

Exit 0 means the contract holds. Exit 1 means the check manufactured a defect
and is itself broken.

Requirements: `sqlite3` only. No network, no Python, no fixture file written.
