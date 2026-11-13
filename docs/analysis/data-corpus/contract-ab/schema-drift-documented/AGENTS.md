# Agent conventions

## Contract

`orders_export` is the producer/consumer boundary. The block below is the current
contract (v2): the required columns plus the documented additive `channel`.

```contract
table: orders_export
required: order_id INTEGER NOT NULL
required: customer_id TEXT NOT NULL
required: amount_cents INTEGER NOT NULL
required: placed_on TEXT NOT NULL
allowed_additive: channel TEXT NULL
```

- `contract-v1.odcs.yaml` is the contract before the producer added `channel`.
  `contract-v2.odcs.yaml` documents `channel` as an optional, nullable addition.
- An additive, nullable column is **not** drift when the contract documents it
  under `allowed_additive`. `channel` is that column here; flagging it is the
  false positive this fixture exists to catch.
- The same `channel` column left undocumented is drift and fails.
- The check reads `PRAGMA table_info` and the NULL counts, not the generated
  text or the SQL that produced it.

## Check

Run from this directory (the tree root):

    python3 check.py

Exit 0 means the documented drift is accepted. Exit 1 means a finding. The
undocumented variant uses the same tree and the same check, with the
`allowed_additive` line removed from a temporary contract copy:

    sed '/^allowed_additive: channel TEXT NULL$/d' AGENTS.md \
      > /tmp/schema-drift-undocumented.md
    python3 check.py --contract /tmp/schema-drift-undocumented.md

The CLI classification of the contract change:

    datacontract breaking contract-v1.odcs.yaml contract-v2.odcs.yaml

Requirements: `python3` (standard library only) and `datacontract` 1.2.9. No
network, no fixture file written, no bytecode cache left in the tree.
