# Agent conventions

## Contract

This tree is a **negative**: a sliced migration whose cutover is already
reversible. The oracle must report zero findings; anything else is a
manufactured defect.

- `subscriptions_legacy` is migrated to `subscriptions_v2` in two date slices
  through `plan_map`, then cut over with the legacy table kept for rollback.
- Exactly one `plan_map` row per `legacy_plan_id`: replaying a plan chunk leaves
  one row, the latest `mapped_on` winning.
- A slice writes exactly one `subscriptions_v2` row per migrated subscription;
  the mapping join does not fan out.
- `cutover()` takes the legacy backup **before** deleting the migrated rows, so
  `rollback()` restores the full pre-cutover table.
- The migration sequence is fixed: legacy load, plan load, plan retry, slice 1,
  slice 2, cutover, rollback.

## Check

Run from the repository root:

    python3 docs/analysis/data-corpus/negative-safe-cutover/check.py

Exit 0 means the contract holds. Exit 1 means the check manufactured a defect
and is itself broken.

Requirements: `python3` (standard library only). No network, no fixture file
written, no bytecode cache left in the tree.
