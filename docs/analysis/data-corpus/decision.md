# Data corpus decision memo

- **Spec:** SPEC-0082 — A data corpus that can see a duplicated-key join
- **Date:** 2026-11-13
- **Status:** the corpus and its deterministic oracles are proved. No candidate
  skill has been measured, no paid draw ran, and no rate is claimed.

This memo records what the instrument shows, freezes the holdout, and names the
decision per capability. It does not create a skill.

## 1. Oracle proof (F1)

Every command below runs from the repository root, with no network and no model.
The proof is the exit code plus the finding line; the commands are repeated in
`README.md` and in each tree's `AGENTS.md`.

| Tree | State | Exit | Observed line |
| --- | --- | --- | --- |
| `join-duplicate-keys` | `@state=staged` | **1** | `orders_enriched has more rows than the orders grain; the duplicated dimension key multiplied the join` |
| `join-duplicate-keys` | `@state=corrected` | **0** | `PASS join-duplicate-keys: 4 enriched rows for 4 orders` |
| `migration-retry-backfill` | `FIXTURE_STATE=staged` | **1** | retry moved the row count 4→8, changed the content hash, backfill left 12 rows for 6 `event_id`s; `event_id is not unique after the backfill: evt-1001, evt-1002, evt-1003, evt-1004` |
| `migration-retry-backfill` | `FIXTURE_STATE=corrected` | **0** | `PASS migration-retry-backfill: 6 rows, hash 1d15ef89c998785c` |
| `incompatible-contract` | `FIXTURE_STATE=staged` | **1** | `required column customer_id is missing; the producer renamed or dropped it`; `column customer_ref is not declared by the contract` |
| `incompatible-contract` | `FIXTURE_STATE=corrected` | **0** | `PASS incompatible-contract: table orders_export matches 4 required column(s)` |
| `schema-drift-documented` | documented (tree) | **0** | `PASS schema-drift-documented: table orders_export accepts 1 documented additive column(s)` |
| `schema-drift-documented` | undocumented variant | **1** | `column channel is not declared by the contract` |
| `negative-healthy` | tree | **0** | `PASS negative-healthy: 3 customer rows, 4 event rows after the retry` |
| `negative-safe-retry` | tree | **0** | `PASS negative-safe-retry: 6 rows, hash 8310b465261bd950` |

The undocumented variant is the same tree and the same `channel` column, with
only the `allowed_additive` line removed from a temporary contract copy:

```sh
sed '/^allowed_additive: channel TEXT NULL$/d' \
  docs/analysis/data-corpus/schema-drift-documented/AGENTS.md \
  > /tmp/schema-drift-undocumented.md
python3 docs/analysis/data-corpus/schema-drift-documented/check.py \
  --contract /tmp/schema-drift-undocumented.md        # exit 1
```

`join-duplicate-keys` counts `orders_enriched` against the source grain and
checks the measure; `incompatible-contract` reads `PRAGMA table_info` and the
NULL counts. Neither reads generated text.

## 2. Holdout freeze (F1.1)

`incompatible-contract` is the holdout for the later behavioural measurement.
Its tree hash is recorded here **before any candidate is measured**: this spec
runs no model, so no measurement exists at freeze time, and the memo was written
after the hash below was computed.

The harness `treeHash` is the anchor the measurement reports against: it is
path-independent and uses the same algorithm as
`scripts/lib/evals/fixture.mjs`, so it is comparable with the `treeHash` a run
record stores.

```
treeHash("docs/analysis/data-corpus/incompatible-contract")
= b96b88d3f95cf3b7ca69b6d3325fdb84e77d8df2df45443c0352a25faa3b384a
```

Command (from the repository root):

```sh
node --input-type=module -e "import { treeHash } from './scripts/lib/evals/fixture.mjs'; console.log(treeHash('docs/analysis/data-corpus/incompatible-contract'))"
```

The future behavioural measurement reports against this `treeHash` **and** the
per-file hashes below. The `find | shasum` recipe is path-dependent: it hashes
repo-relative paths into the manifest, so it only proves in-repo that the tree
did not change. It is not comparable with a run record's `treeHash`.

```
in-repo tree hash  6bef88affe0d23c73644c417853e30299cf714fbce89714f03528f379ea8c1d0
```

Command (the trailing `-` in shasum's output is its stdin placeholder, not part
of the hash):

```sh
find docs/analysis/data-corpus/incompatible-contract -type f \
  | LC_ALL=C sort \
  | xargs shasum -a 256 \
  | shasum -a 256
```

Per-file hashes at freeze time:

| File | SHA-256 |
| --- | --- |
| `AGENTS.md` | `4f186a24cc4f2021c91348627cb01d9a180d383c7657dfda702a91d7df3e678d` |
| `pipeline.py` | `b58de4db2810b17b8be6472209ce9c71df9b35abd19ab86c22b61c8af1866910` |
| `check.py` | `1a52f77cb390a1ee78f865158a0fa30aee89b731eb85888fa523941ee6638342` |

The three files are not edited after this freeze. A later spec that measures a
candidate must report against the `treeHash` above and the per-file hashes; any
change to the tree invalidates the holdout.

## 3. False-positive check (F2)

A contract check only judges a tree that declares that contract, so "healthy"
means each tree's non-defective state: `corrected` for the three defect trees,
the documented state for `schema-drift-documented`, and the staged state for the
two negatives. Every run below returned exit 0 with zero `FAIL` lines.

| Check | Healthy input | Finding lines |
| --- | --- | --- |
| `join-duplicate-keys/check.sql` | `@state=corrected` | 0 |
| `migration-retry-backfill/check.py` | `FIXTURE_STATE=corrected` | 0 |
| `incompatible-contract/check.py` | `FIXTURE_STATE=corrected` | 0 |
| `schema-drift-documented/check.py` | tree's documented contract | 0 |
| `negative-healthy/check.sql` | staged tree | 0 |
| `negative-safe-retry/check.py` | staged tree | 0 |

No check manufactured a defect on the healthy state of its own capability.

## 4. Decision per capability

The B arm for every capability is the same: dbt Labs and Databricks publish
agent skills for data work, but a pinned, licence-compatible copy has **not**
been staged. Licence compatibility and the pinned revision are therefore
unverified, so the comparison is `unknown` — not zero and not parity. No rate is
claimed until that arm is staged.

### `join/quality`

- **Evidence:** `join-duplicate-keys` fails on a duplicated dimension key (6 rows
  for 4 orders) and passes on the fix; `negative-healthy` accepts a correct
  aggregate join with zero findings.
- **Gap shown:** an oracle can distinguish a row-multiplying join from a healthy
  one, and no skill in the current inventory (`audit-code-quality`,
  `review-code`, …) judges data grain. The corpus shows a capability gap, not a
  false positive.
- **B arm:** `unknown` (dbt Labs / Databricks skills not staged).
- **Decision:** **build new** — provisional: the B arm is not staged, and
  `review-code`/`audit-code-quality` were not measured against these trees.
  Candidate host for the first measurement: `test-data-quality` (#16), chosen
  by the human gate before that spec is groomed. This memo does not create it.
- **Next step:** stage this tree under `evals/<candidate>/` and measure a
  candidate against it in a follow-up spec.

### `migration`

- **Evidence:** `migration-retry-backfill` fails after a retry (4→8 rows, content
  hash changed) and a backfill (12 rows for 6 events); the corrected loader is
  idempotent (4→4→6). `negative-safe-retry` accepts an upsert loader and
  `negative-healthy` accepts a correct incremental load, both with zero findings.
- **Gap shown:** retry/backfill idempotency is measurable by an oracle and is not
  covered by an existing skill.
- **B arm:** `unknown` for the same reason.
- **Decision:** **build new** — provisional: the B arm is not staged, and
  `review-code`/`audit-code-quality` were not measured against these trees.
- **Next step:** tag the two migration fixtures for the candidate the human gate
  picks, and stage them with the follow-up measurement.

### `contract`

- **Evidence:** `incompatible-contract` fails when a required column is renamed
  (`customer_id` → `customer_ref`) and passes when the producer keeps it.
  `schema-drift-documented` accepts the documented additive `channel` column and
  rejects the same column with the documentation removed.
- **Gap shown:** a schema-level oracle separates an incompatible change from
  documented additive drift; no existing skill does that for data contracts.
- **B arm:** `unknown` for the same reason.
- **Decision:** **build new** — provisional: the B arm is not staged, and
  `review-code`/`audit-code-quality` were not measured against these trees.
- **Next step:** the holdout stays frozen; the behavioural measurement uses this
  tree as its held-out case and must report against the `treeHash` in section 2.

### `review/ops`

- **Evidence:** none in this slice. No fixture asks a reviewer/ops skill to judge
  a data pipeline; the two negatives show that checks stay silent on healthy
  pipelines, which is not evidence that a review capability is missing.
- **Gap shown:** none. `unknown` evidence is not a zero-finding result.
- **B arm:** `unknown`.
- **Decision:** **do not add**. Nothing in this corpus supports a new
  review/ops skill. Revisit only if a pipeline-review fixture is groomed and
  shows a gap.

## 5. What this memo does not decide

- No skill id is created, renamed or extended here.
- No case is staged under `evals/<id>/`; that and the A/B/C run are the
  follow-up named above, after the human gate picks the capability and the id.
- No pass rate, no comparability claim: the B arm is `unknown`, not zero.
- DuckDB remains an option, not a requirement; these checks use `sqlite3` and
  `python3` only.

## 6. Known limitations

- **No file input.** No tree opens a CSV or a SQLite file: every input is
  embedded in the pipeline, so the "read the wrong file" failure class is out of
  scope for this corpus.
- **The conflict action is not distinguished.** The backfill re-sends the same
  values for the overlapping rows, so `ON CONFLICT ... DO UPDATE` and
  `DO NOTHING` are indistinguishable here. The fixtures prove row and content-hash
  idempotency, not which conflict action a candidate chose.
- **Drift checks the type, not the nullability.** `schema-drift-documented`
  compares the additive column's presence and type. A documented additive
  declared `NOT NULL` still passes (a stricter producer stays compatible); only a
  changed type or an undocumented column fails.
- **The corrected state is embedded in the pipeline.** The defect trees carry the
  fix behind `@state`/`FIXTURE_STATE`, so a read-only measurement can see the
  answer. Before measuring a candidate, freeze the holdout as a staged-only copy
  (the frozen tree with the corrected branch removed from `pipeline.py`) and
  report against that copy's `treeHash`; this memo's hash anchors the tree as it
  stands today.
