# Contract A/B fixtures

Four small contract trees beside the 0.8.3 corpus, built so the official
`datacontract-skills` can be measured against a control on the same prompt and
the same fixture hash. The case definitions are in
[`ab-cases.md`](../ab-cases.md); the pin, the run directories and the verdict are
in [`decision.md`](../decision.md).

| Tree | Cell | Capability | Oracle |
| --- | --- | --- | --- |
| `incompatible-staged/` | breaking change | `contract` | `check.py` exits 1; `datacontract breaking` exits 1 |
| `schema-drift-documented/` | documented drift | `contract` | `check.py` exits 0; `datacontract breaking` exits 0, safe |
| `semantic-change/` | semantic change | `contract` | `check.py` exits 0; `datacontract breaking` exits 0 — the break is not schema-detectable |
| `composition/` | creation | `contract` | no contract staged; a created one must pass `datacontract lint` |

Unlike the 0.8.3 trees, these carry the two ODCS v3 versions of the contract
(`contract-v1.odcs.yaml` → `contract-v2.odcs.yaml`) where a contract applies:
that is the change the official `breaking-change-check` reads, and the
`datacontract` CLI is the tool it uses. `composition/` has no contract; it ships
a DDL and the requirements and asks for one.

## Requirements

- `python3` (standard library only) for every `check.py`.
- `datacontract` 1.2.9 on `PATH` for `lint` and `breaking`. No network: the CLI
  validates against the bundled ODCS schema and reads local files.
- No credential, no live source. Every pipeline is in memory.

## The proofs

Run from the repository root. The exit code is the proof; the finding line names
it.

```sh
# incompatible-staged: the consumer contract v1 fails against the staged export
python3 docs/analysis/data-corpus/contract-ab/incompatible-staged/check.py   # exit 1
# the same schema, declared by the producer contract v2, matches
python3 docs/analysis/data-corpus/contract-ab/incompatible-staged/check.py \
  --producer-contract \
  docs/analysis/data-corpus/contract-ab/incompatible-staged/contract-v2.odcs.yaml  # exit 0
# the CLI classifies the v1 -> v2 change as breaking
datacontract breaking \
  docs/analysis/data-corpus/contract-ab/incompatible-staged/contract-v1.odcs.yaml \
  docs/analysis/data-corpus/contract-ab/incompatible-staged/contract-v2.odcs.yaml   # exit 1

# schema-drift-documented: the documented additive column is accepted
python3 docs/analysis/data-corpus/contract-ab/schema-drift-documented/check.py  # exit 0
# the same column with the documentation removed is drift
sed '/^allowed_additive: channel TEXT NULL$/d' \
  docs/analysis/data-corpus/contract-ab/schema-drift-documented/AGENTS.md \
  > /tmp/schema-drift-undocumented.md
python3 docs/analysis/data-corpus/contract-ab/schema-drift-documented/check.py \
  --contract /tmp/schema-drift-undocumented.md                                # exit 1
# the CLI classifies the v1 -> v2 change as safe (INFO only)
datacontract breaking \
  docs/analysis/data-corpus/contract-ab/schema-drift-documented/contract-v1.odcs.yaml \
  docs/analysis/data-corpus/contract-ab/schema-drift-documented/contract-v2.odcs.yaml  # exit 0

# semantic-change: the schema oracle passes, so the break is not schema-detectable
python3 docs/analysis/data-corpus/contract-ab/semantic-change/check.py        # exit 0
# the CLI also exits 0: only a description changed
datacontract breaking \
  docs/analysis/data-corpus/contract-ab/semantic-change/contract-v1.odcs.yaml \
  docs/analysis/data-corpus/contract-ab/semantic-change/contract-v2.odcs.yaml # exit 0

# composition: no contract yet
python3 docs/analysis/data-corpus/contract-ab/composition/check.py            # exit 0
# a contract created for the tree must pass lint
python3 docs/analysis/data-corpus/contract-ab/composition/check.py \
  path/to/created/contract.odcs.yaml                                          # exit 0
```

## The staged-only holdout

`incompatible-staged/` is a **staged-only** copy of the frozen
`../incompatible-contract/`. The original embeds the corrected branch behind
`FIXTURE_STATE`; this copy keeps only the staged producer (`customer_ref`), so no
draw can read a passing branch. The original tree is untouched and keeps the
`b96b88d3…` hash recorded in [`../decision.md`](../decision.md); this copy has its
own recorded `treeHash` there.

## Rules

- The oracle is `check.py` and the CLI, not the prose.
- These are fixtures, not a skill. Nothing here is copied into `evals/` except
  through the gitignored mirror; no skill is authored from them.
