# Agent conventions

## Contract

This tree is a **negative**: a retry that is already safe. The oracle must report
zero findings; anything else is a manufactured defect.

- `shipments` has a natural key (`shipment_id`) and the loader upserts on it.
- Re-delivering the same batch (a retry) changes neither the row count nor the
  content hash.
- A backfill that overlaps an already-loaded batch leaves exactly one row per
  `shipment_id`, with the latest delivery's business content.
- The content hash covers `shipment_id|carrier|weight_grams`. `dispatched_on` is
  load metadata, so a retry may refresh it without failing the contract.

## Check

Run from the repository root:

    python3 docs/analysis/data-corpus/negative-safe-retry/check.py

Exit 0 means the contract holds. Exit 1 means the check manufactured a defect
and is itself broken.

Requirements: `python3` (standard library only). No network, no fixture file
written, no bytecode cache left in the tree.
