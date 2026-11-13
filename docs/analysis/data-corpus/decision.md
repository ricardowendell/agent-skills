# Data corpus decision memo

- **Spec:** SPEC-0082 — A data corpus that can see a duplicated-key join;
  SPEC-0085 — The contract capability is measured before it is built
- **Date:** 2026-11-13
- **Status:** the corpus and its deterministic oracles are proved. The contract
  capability has a staged B arm and a paid A/B measurement (section 7); the
  other capabilities remain `unknown` with no draw. No skill is created.

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

The four `contract-ab/` trees added by SPEC-0085 obey the same rule; the exact
commands are in [`contract-ab/README.md`](contract-ab/README.md) §"The proofs"
(lines 29–71):

| `contract-ab/` tree | State | Exit | Observed line |
| --- | --- | --- | --- |
| `incompatible-staged` | consumer contract v1 | **1** | `required column customer_id is missing`; `column customer_ref is not declared by the contract` |
| `incompatible-staged` | `--producer-contract contract-v2.odcs.yaml` | **0** | `PASS incompatible-staged: table orders_export matches 4 required column(s)` |
| `schema-drift-documented` | documented (tree) | **0** | `PASS schema-drift-documented: table orders_export accepts 1 documented additive column(s)` |
| `schema-drift-documented` | undocumented variant | **1** | `column channel is not declared by the contract` |
| `semantic-change` | tree / both ODCS versions | **0** | `PASS semantic-change: … schema unchanged between contract versions` |
| `composition` | empty (no contract) | **0** | `PASS composition: no contract staged` |

**Two different `schema-drift-documented` trees.** The row in the first table is
the 0.8.3 tree `docs/analysis/data-corpus/schema-drift-documented/` (its check
reads the `allowed_additive` contract block in `AGENTS.md`). The row in the
second table is the SPEC-0085 A/B copy
`docs/analysis/data-corpus/contract-ab/schema-drift-documented/`, which adds the
two `contract-vN.odcs.yaml` files and is the one staged in the mirror. They share
the oracle logic but are distinct trees with distinct hashes; do not read the
second as a re-proof of the first.

Also from the CLI: `datacontract lint` exits 0 on all six valid ODCS files
(`contract-v1`/`contract-v2` in the three contract trees), and
`datacontract breaking` exits 1 on the incompatible pair, 0 on the drift pair
(safe, INFO only) and 0 on the semantic pair — the semantic break is not
schema-detectable.

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

For `join/quality` and `migration` the B arm is `unknown`: dbt Labs and
Databricks publish agent skills for data work, but a pinned, licence-compatible
copy has **not** been staged. Licence compatibility and the pinned revision are
therefore unverified, so the comparison is `unknown` — not zero and not parity.
No rate is claimed until that arm is staged. `contract` is different: the official
`datacontract-skills` are pinned at `dc06664` (MIT) and measured in section 7.

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
  documented additive drift; the semantic case shows a break the schema oracle
  cannot see. Whether the official skill adds anything over the control is
  measured in section 7.
- **B arm:** staged and measured — `datacontract-skills` at `dc06664` (MIT) with
  `datacontract-cli` 1.2.9; five clean draws per arm, eight clean runs, no
  contamination.
- **Decision:** **reuse external**. No capability gap was measured: the control
  reproduced every behavioural assertion in all four cells (5/5 on the
  non-load assertions), so the official skill adds procedural consistency, not a
  measured behavioural delta. C is not justified.
- **Next step:** no local contract skill is authored. If the thin routing
  reference from issue #18 is still wanted, it is a separate decision and is not
  underwritten by this measurement. The staged-only holdout and the
  `contract-ab/` fixtures are the durable evidence; the mirror stays gitignored.

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
- No case is staged in this checkout's `evals/`: the contract cases live in the
  gitignored mirror `.lane/pinned/datacontract/`, and the other capabilities
  still have no case and no draw.
- No pass rate and no comparability claim for `join/quality` or `migration`: their
  B arm is `unknown`, not zero. The contract counts in section 7 are per draw,
  for the model and detector named there, and are not a product claim.
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
  answer. The contract capability resolved this in SPEC-0085:
  `contract-ab/incompatible-staged/` is a staged-only copy (no corrected branch)
  with its own recorded `treeHash`; the frozen original keeps `b96b88d3…`. The
  other capabilities still need the same staged-only copy before a draw.
- **The A/B control also solves the contract cells.** The measured model
  reproduced every non-load assertion in all four cells without a skill (section
  7). That is a limit of the measurement's discriminating power, not evidence
  that the official skill is useless: these fixtures test a competent workflow,
  and the model already has it. A harder cell would have to fail the control for
  a reason the skill fixes.

## 7. The contract A/B measurement (SPEC-0085)

The contract capability is measured against the official skills, not assumed.
The B arm is [`datacontract/datacontract-skills`](https://github.com/datacontract/datacontract-skills)
at `dc06664` (MIT, Copyright 2026 Entropy Data), copied verbatim into the
gitignored mirror `.lane/pinned/datacontract/` with `datacontract-cli` 1.2.9
pre-installed. The A arm is the same prompt and the same fixture with no skill
staged. Nothing from the mirror is committed, and the third-party check stays
green because no upstream file enters the repository.

### Comparability

- **Model:** `opencode-go/deepseek-v4.1-flash` — the effective model id recorded
  in every manifest as `opencode-go/deepseek-v4.1-flash (config default)`, i.e.
  no `--model` flag was passed and the host config selected it. **Level:**
  `behavior`, concurrency 4. **Detector:** `cf2e2e319d975a5b`. **Draws:** five per
  arm, forty in the wave.
- **Same prompt, same fixture:** each arm's stored `promptHash` and
  `fixtureHash` match for the cell. The `fixtureHash` is the harness `treeHash`
  of the staged tree, so the mirror copy and the durable tree are the same bytes.
- **Clean:** all eight runs report `findings=0 warnings=0 skillLeaks=0
  hostReads=0 isolated=yes deniedDraws=0` from `node scripts/check-eval-run.mjs`;
  no draw is contaminated and no draw is infrastructure.
- **Two probes before the wave:** `node scripts/eval.mjs check --root
  .lane/pinned/datacontract` staged all four cells with no finding, and one
  screening draw of the semantic cell (repeat 1,
  `2026-11-13T15-39-34--breaking-change-check`) proved the CLI runs inside the
  sandbox before the paid wave. The screening draw is not part of the counts.

Durable fixture hashes (path-independent, same algorithm as the run record):

| Tree | `treeHash` |
| --- | --- |
| `incompatible-staged/` (staged-only holdout) | `067a2e7f605ab4059ba6e4968b5fa02379c3e4cf729344502339f08977c233fe` |
| `schema-drift-documented/` | `d1ce610b5071af06843a2a0b1d6d18ba98e7b06d28e1b4202ba508323ae52527` |
| `semantic-change/` | `d9953d88ccf59bdefbb86a4cdf473540a8b9e3847cf432e464544248494957f7` |
| `composition/` | `7c51771435d36d72a67458e8b526ea7ed142acfd4001dc11dc60bd1749ed18f2` |

The frozen original `incompatible-contract/` is untouched at
`b96b88d3f95cf3b7ca69b6d3325fdb84e77d8df2df45443c0352a25faa3b384a`. The
staged-only copy carries no `corrected` branch, so no draw can read the answer.

### Per-cell counts

`scored` counts a draw that passed every assertion, including the declared
`skill` load. `behavioural` counts a draw that passed every assertion except
`skill`, i.e. the output the capability promises. Both are raw counts out of five
clean draws.

| Cell (case) | A run | B run | A clean / scored / behavioural | B clean / scored / behavioural |
| --- | --- | --- | --- | --- |
| incompatible (1) | `2026-11-13T15-42-21--breaking-change-check--without-skill` | `2026-11-13T15-44-52--breaking-change-check` | 5/5 / 0/5 / 5/5 | 5/5 / 5/5 / 5/5 |
| documented drift (2) | `2026-11-13T15-47-08--breaking-change-check--without-skill` | `2026-11-13T15-50-18--breaking-change-check` | 5/5 / 0/5 / 5/5 | 5/5 / 5/5 / 5/5 |
| semantic (3) | `2026-11-13T15-53-23--breaking-change-check--without-skill` | `2026-11-13T15-56-23--breaking-change-check` | 5/5 / 0/5 / 5/5 | 5/5 / 5/5 / 5/5 |
| composition (1) | `2026-11-13T15-58-40--create-data-contract--without-skill` | `2026-11-13T16-10-51--create-data-contract` | 5/5 / 0/5 / 5/5 | 5/5 / 4/5 / 4/5 |

### The reds, named

- **Every A draw** fails exactly one assertion: `skill breaking-change-check`
  (or `skill create-data-contract`). The other 5–9 assertions pass in every
  control draw. The scored `0/5` is the load assertion, not a behavioural miss.
- **Composition B r2** fails `ranpass datacontract lint`: the draw created
  `contracts/orders_export.odcs.yaml`, matched every `filematch` assertion, and
  reached lint through the fixture's `check.py` (`python3 check.py
  contracts/orders_export.odcs.yaml`, which runs `datacontract lint
  --all-errors`) instead of invoking `datacontract lint` directly. The contract
  passed lint; the process assertion is what missed. The red is preserved, not
  softened: the oracle was not edited after the first draw, and the honest fix — if
  any — belongs to a later case that asserts the artifact rather than the command
  text.
- No other draw has a red assertion.

### Class and verdict

**No behavioural separation in any cell — the instrument did not discriminate.**
The control reproduced every non-load assertion in all four cells (5/5 each),
including the semantic break (cell 3) and the ODCS composition (cell 4). The
official skill was loaded and used in every B draw of the three
`breaking-change-check` cells and in four of five composition draws, and it
produced the same verdicts and artifacts. The scored `0/5` is the declared load
assertion, not a behavioural miss.

The per-cell decision is `reuse external`, with two separate parts:

- **No local skill (C) is justified.** That is the result the measurement
  supports: there is no gap the control fails and the official skill closes. C
  stays un-authored.
- **The official skills are the recommended process route** — MIT, maintained
  upstream, and the `datacontract` CLI is the domain tool they wrap — **not a
  separator measured against the control.** The evidence says the official skill
  is a reasonable default, not that it beats a competent model+CLI baseline.

Three limits of this instrument, declared:

- **(a) The semantic prompt leaks the direction.** "the schema check passes, yet
  I am not sure the change is safe" points the agent at the semantic read, so the
  cell measures whether the property description is read, not whether the break
  is discovered without a hint.
- **(b) `datacontract` is on `PATH` in both arms.** The A arm still has the CLI,
  so this compares "official skill card vs the same CLI used ad hoc", not
  "official family vs no tooling".
- **(c) n=5 does not exclude a small effect.** Five clean draws per arm can show
  a large separation or its absence; it cannot bound a small delta.

A valid separation measurement would need a neutral prompt and an A arm without
the CLI (or with the CLI hidden). That is a follow-up in its own spec with its
own budget; it is not run here, and no claim in this memo depends on it. A thin
routing reference remains a separate, optional decision and is not underwritten
by these counts.
