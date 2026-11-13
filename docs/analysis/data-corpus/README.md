# Data corpus

Six small, realistic data-pipeline trees and the deterministic oracles that judge
them. The corpus is an **instrument**: it exists so a later spec can measure
whether a skill sees a data defect. It is not a skill, it is not staged under
`evals/`, and no model runs here.

The per-capability decision and the frozen holdout hash are in
[`decision.md`](decision.md).

## What is here

| Tree | Role | Capability | Default exit |
| --- | --- | --- | --- |
| `join-duplicate-keys` | defect | `join/quality` | 1 |
| `migration-retry-backfill` | defect | `migration` | 1 |
| `incompatible-contract` | defect, **holdout** | `contract` | 1 |
| `schema-drift-documented` | documented drift (must pass) | `contract` | 0 |
| `negative-healthy` | negative | `join/quality`, `migration` | 0 |
| `negative-safe-retry` | negative | `migration` | 0 |

Each tree has exactly three files:

- `AGENTS.md` — the contract and the exact check command.
- `pipeline.sql` or `pipeline.py` — the pipeline that produces the tree.
- `check.sql` or `check.py` — the oracle. Exit 0 means the contract holds; exit
  1 means a finding, one line each.

The defect trees are state-switched, so the same tree proves the oracle on both
the defect and the fix without editing a file:

- SQL trees take the sqlite3 parameter `@state` (`staged` or `corrected`).
- Python trees read `FIXTURE_STATE` (`staged` or `corrected`).

The negatives have no switch: their only state is the healthy one.

## Requirements

- `sqlite3` for `join-duplicate-keys` and `negative-healthy`.
- `python3`, standard library only, for the other four.
- No network, no credential, no external data. Every input is embedded in the
  pipeline and lives in memory. A check writes nothing into the tree.

## Running a check

Run from the repository root.

```sh
# join-duplicate-keys: defect, then fixed
sqlite3 :memory: -bail -cmd ".parameter set @state staged" \
  ".read docs/analysis/data-corpus/join-duplicate-keys/pipeline.sql" \
  ".read docs/analysis/data-corpus/join-duplicate-keys/check.sql"          # exit 1
sqlite3 :memory: -bail -cmd ".parameter set @state corrected" \
  ".read docs/analysis/data-corpus/join-duplicate-keys/pipeline.sql" \
  ".read docs/analysis/data-corpus/join-duplicate-keys/check.sql"          # exit 0

# migration-retry-backfill: defect, then fixed
python3 docs/analysis/data-corpus/migration-retry-backfill/check.py        # exit 1
FIXTURE_STATE=corrected \
  python3 docs/analysis/data-corpus/migration-retry-backfill/check.py      # exit 0

# incompatible-contract (holdout): defect, then fixed
python3 docs/analysis/data-corpus/incompatible-contract/check.py           # exit 1
FIXTURE_STATE=corrected \
  python3 docs/analysis/data-corpus/incompatible-contract/check.py         # exit 0

# schema-drift-documented: the documented drift is accepted
python3 docs/analysis/data-corpus/schema-drift-documented/check.py         # exit 0

# the same column left undocumented is rejected
sed '/^allowed_additive: channel TEXT NULL$/d' \
  docs/analysis/data-corpus/schema-drift-documented/AGENTS.md \
  > /tmp/schema-drift-undocumented.md
python3 docs/analysis/data-corpus/schema-drift-documented/check.py \
  --contract /tmp/schema-drift-undocumented.md                             # exit 1

# negatives: zero findings
sqlite3 :memory: -bail \
  ".read docs/analysis/data-corpus/negative-healthy/pipeline.sql" \
  ".read docs/analysis/data-corpus/negative-healthy/check.sql"             # exit 0
python3 docs/analysis/data-corpus/negative-safe-retry/check.py             # exit 0
```

The proof of every exit code, the holdout hash and the per-capability decision
are recorded in [`decision.md`](decision.md).

## Rules

- The oracle is the check script, not the prose. A tree whose check exits 0 on
  its healthy state and non-zero on its defect is the evidence.
- `incompatible-contract` is frozen as the holdout. Its hash is in
  `decision.md`; do not edit its three files before the behavioural measurement.
- Known limits of the instrument — no file input, conflict action not
  distinguished, drift compared by type only, and the corrected state embedded in
  the pipeline — are in
  [`decision.md`](decision.md#6-known-limitations).
- The fixtures are an instrument, not a product. No skill is created from them
  here: the program's rule is that a skill follows a corpus that shows a gap, not
  the other way round.
- Staging a tree under `evals/<candidate>/` and running A/B/C is the follow-up
  named in `decision.md`, owned by a later spec.
