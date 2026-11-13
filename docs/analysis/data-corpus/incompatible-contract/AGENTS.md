# Agent conventions

## Contract

`orders_export` is the producer/consumer boundary. The consumer reads these
columns; the block below is the contract the oracle parses.

```contract
table: orders_export
required: order_id INTEGER NOT NULL
required: customer_id TEXT NOT NULL
required: amount_cents INTEGER NOT NULL
required: placed_on TEXT NOT NULL
```

- A required column may not be renamed or dropped, even if the producer keeps
  the data under another name.
- A required column may not become nullable, and it may not contain NULLs.
- A column outside `required` is not part of the contract: adding one is an
  incompatible change until the contract documents it.
- The check reads `PRAGMA table_info` and the NULL counts, not the generated
  text or the SQL that produced it.

The tree ships the defect as `FIXTURE_STATE=staged`: the producer renames
`customer_id` to `customer_ref`. `FIXTURE_STATE=corrected` keeps the documented
column, so the oracle is proved on both states without editing a file.

## Holdout

This tree is the frozen holdout for the later behavioural measurement. Its tree
hash is recorded in [`../decision.md`](../decision.md) before any candidate is
measured; the three files are not edited after that freeze.

## Check

Run from the repository root:

    python3 docs/analysis/data-corpus/incompatible-contract/check.py

Exit 0 means the contract holds; exit 1 means a finding. The corrected state:

    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/incompatible-contract/check.py

Requirements: `python3` (standard library only). No network, no fixture file
written, no bytecode cache left in the tree.
