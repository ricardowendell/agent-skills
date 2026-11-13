# Agent conventions

## Contract

`daily_events` is an incremental table loaded from at-least-once deliveries.

- Exactly one row per `event_id`: the natural key is unique.
- Re-delivering the same batch (a retry) changes neither the row count nor the
  content hash.
- A backfill that overlaps an already-loaded batch leaves the table equal to one
  row per `event_id`, with the latest delivery's business content.
- The content hash covers `event_id|customer_id|amount_cents`. Load metadata
  (`loaded_on`) is not part of the contract, so a retry may refresh it without a
  finding.

The tree ships the defect as `FIXTURE_STATE=staged`: the table has no natural-key
constraint and the loader inserts every delivery. `FIXTURE_STATE=corrected` is
the same tree with the documented fix (unique index plus upsert), so the oracle
is proved on both states without editing a file.

## Check

Run from the repository root:

    python3 docs/analysis/data-corpus/migration-retry-backfill/check.py

Exit 0 means the contract holds; exit 1 means a finding. The corrected state:

    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/migration-retry-backfill/check.py

Requirements: `python3` (standard library only). No network, no fixture file
written, no bytecode cache left in the tree.
