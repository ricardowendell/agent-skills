# Agent conventions

## Contract

`orders_legacy` is migrated to `orders_v2` in two date slices through
`customer_map`, then cut over with the legacy table kept for rollback.

- Exactly one `customer_map` row per `legacy_id`: replaying a mapping chunk
  leaves one row, the latest `mapped_on` winning.
- A slice writes exactly one `orders_v2` row per migrated legacy order. The
  mapping join must not fan an order out.
- `cutover()` keeps the legacy table as the rollback point: the backup is taken
  before any delete, so `rollback()` restores the full pre-cutover table.
- The migration sequence is fixed: legacy load, mapping load, mapping retry,
  slice 1, slice 2, cutover, rollback.

The tree ships both faults as `FIXTURE_STATE=staged`: `customer_map` has no
unique key on `legacy_id`, and the cutover copies the legacy table after
deleting the migrated rows. `FIXTURE_STATE=corrected` is the same tree with both
documented fixes. Two mixed states exist so the oracle is proved independent:
`mapping-fixed` fixes fault 1 only and must still fail on the cutover line;
`cutover-fixed` fixes fault 2 only and must still fail on the mapping line.

## Check

Run from the repository root:

    python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py

Exit 0 means the contract holds; exit 1 means a finding, one line each. The
corrected state:

    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py

Requirements: `python3` (standard library only). No network, no fixture file
written, no bytecode cache left in the tree.
