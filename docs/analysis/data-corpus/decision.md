# Data corpus decision memo

- **Spec:** SPEC-0082 — A data corpus that can see a duplicated-key join;
  SPEC-0085 — The contract capability is measured before it is built
- **Date:** 2026-11-13
- **Status:** the corpus and its deterministic oracles are proved. The contract
  capability has a staged B arm and a paid A/B measurement (section 7);
  `join/quality` and `migration` have paid composition measurements (section 4)
  that decide them — `do not add` and `build` respectively; `review/ops` remains
  `unknown` with no draw. No skill is created by this memo.

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
| `migration-sliced-cutover` | `FIXTURE_STATE=staged` | **1** | `customer_map is not unique on legacy_id: C-200 x2; the slice join wrote 8 orders_v2 rows for 6 migrated orders (2 extra)`; `rollback did not restore the pre-cutover legacy table: 1 of 7 orders_legacy rows restored; the cutover copied the legacy table after deleting the migrated rows` |
| `migration-sliced-cutover` | `FIXTURE_STATE=corrected` | **0** | `PASS migration-sliced-cutover: 6 orders in orders_v2 from 3 mapping rows; rollback restored 7 legacy rows` |
| `migration-sliced-cutover` | `FIXTURE_STATE=mapping-fixed` | **1** | only `rollback did not restore the pre-cutover legacy table: 1 of 7 orders_legacy rows restored; the cutover copied the legacy table after deleting the migrated rows` |
| `migration-sliced-cutover` | `FIXTURE_STATE=cutover-fixed` | **1** | only `customer_map is not unique on legacy_id: C-200 x2; the slice join wrote 8 orders_v2 rows for 6 migrated orders (2 extra)` |
| `incompatible-contract` | `FIXTURE_STATE=staged` | **1** | `required column customer_id is missing; the producer renamed or dropped it`; `column customer_ref is not declared by the contract` |
| `incompatible-contract` | `FIXTURE_STATE=corrected` | **0** | `PASS incompatible-contract: table orders_export matches 4 required column(s)` |
| `schema-drift-documented` | documented (tree) | **0** | `PASS schema-drift-documented: table orders_export accepts 1 documented additive column(s)` |
| `schema-drift-documented` | undocumented variant | **1** | `column channel is not declared by the contract` |
| `negative-healthy` | tree | **0** | `PASS negative-healthy: 3 customer rows, 4 event rows after the retry` |
| `negative-safe-retry` | tree | **0** | `PASS negative-safe-retry: 6 rows, hash 8310b465261bd950` |
| `negative-safe-cutover` | tree | **0** | `PASS negative-safe-cutover: 6 subscriptions in subscriptions_v2 from 3 plan rows; rollback restored 7 legacy rows` |

The two `migration-sliced-cutover` mixed states are the independence proof: fixing
the mapping alone leaves the rollback line red, and fixing the cutover alone
leaves the duplicated-`legacy_id` line red. The default `staged` state reports
both; `corrected` reports neither.

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
means each tree's non-defective state: `corrected` for the four defect trees,
the documented state for `schema-drift-documented`, and the staged state for the
three negatives. Every run below returned exit 0 with zero `FAIL` lines.

| Check | Healthy input | Finding lines |
| --- | --- | --- |
| `join-duplicate-keys/check.sql` | `@state=corrected` | 0 |
| `migration-retry-backfill/check.py` | `FIXTURE_STATE=corrected` | 0 |
| `migration-sliced-cutover/check.py` | `FIXTURE_STATE=corrected` | 0 |
| `incompatible-contract/check.py` | `FIXTURE_STATE=corrected` | 0 |
| `schema-drift-documented/check.py` | tree's documented contract | 0 |
| `negative-healthy/check.sql` | staged tree | 0 |
| `negative-safe-retry/check.py` | staged tree | 0 |
| `negative-safe-cutover/check.py` | tree | 0 |

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
  `review-code`, …) judges data grain. The corpus shows a measurement gap, not a
  false positive; whether it is also a capability gap is what the composition arm
  below decides.
- **B arm:** `unknown` (dbt Labs / Databricks skills not staged).
- **Composition arm:** measured — SPEC-0092 staged the tree as
  `implement-from-prompt` case 14 and ran five draws per arm, 2026-11-15.
- **Decision:** **do not add** — measured on the composition arm, not assumed. A
  bare model fixes the grain defect from the one-line symptom in **5/5** clean
  draws, so no new data-quality capability is underwritten. `compose` is not what
  the numbers show either: with the platform skill staged the arm is 3/5 scored
  and 4/5 behavioural — one draw never loaded it, one left the pipeline untouched
  — so the route that reaches the grain is the model plus the tree's own oracle,
  not an existing skill. The old wording — **build new**, provisional: "the B arm
  is not staged, and `review-code`/`audit-code-quality` were not measured against
  these trees" — is kept as history: the dbt B arm is still unstaged, and this
  measurement covers the composition arm only.
- **Next step:** no local data-quality skill is authored. `TASK-81` closes on this
  negative result unless the dbt B arm is staged and shows a gap the composition
  arm missed. The case stays in the corpus as a regression cell; its residual
  oracle limit is named below and is a follow-up, not an edit after the draws.

**The composition arm, measured (SPEC-0092).** `evals/implement-from-prompt/fixtures/14/`
is `join-duplicate-keys/` copied verbatim apart from the two `AGENTS.md` check
paths (treeHash `db7b76861a8a2718b6e60c35a86c95fe5e69fcfda482301ef4c88e8f77e02612`;
`pipeline.sql` and `check.sql` byte-identical to the corpus tree), and case 14's
prompt is the symptom only: "The joined table has more rows than the orders grain.
Fix the pipeline." The oracle is the tree's own `check.sql` (`ranpass`), the fix
must be an edit (`changed pipeline.sql`), and `check.sql`/`AGENTS.md` are asserted
`unchanged`.

Measured with `node scripts/eval.mjs compare implement-from-prompt 14 --repeat 5
--root skills --refresh` at `repoSha 6446e9f`; model
`opencode-go/deepseek-v4.1-flash` (config default), level `behavior`,
concurrency 4, detector `cf2e2e319d975a5b`, five draws per arm. Both arms stage
the same fixture (`fixtureHash db7b7686…`) and prompt (`promptHash f2918c5f…`).

| arm | run directory | draws / check-eval-run | passed | pipeline edited | red assertions |
| --- | --- | --- | --- | --- | --- |
| without skill | `2026-11-15T13-16-31--implement-from-prompt--without-skill` | 5/5, `findings=0` | 5/5 | 5/5 | — |
| with skill | `2026-11-15T13-21-22--implement-from-prompt` | 5/5, `findings=1` | 3/5 | 4/5 | r3 `skill implement-from-prompt` (load gate); r5 `changed pipeline.sql` (untouched) |

**The reds, named.** r3 never loaded the skill — the prompt is a bug report, not
an implementation prompt, so `implement-from-prompt`'s own description did not
route on it — and `check-eval-run` counts the miss (`findings=1`), so that arm's
3/5 is a raw draw count cited with the finding named, not a clean pass rate. r5
loaded the skill and did not touch `pipeline.sql`: it diagnosed the join in its
reply and left the file alone, which is the no-op `changed pipeline.sql` exists to
catch.

**Class: non-discriminator.** A bare model fixes the duplicated-key join from one
sentence in **5/5 clean draws**; the skill arm reaches the same fix in four of five
behavioural draws (r1, r2, r3, r4) and loses r5 to the untouched pipeline, with r3
red on its own routing gate. The cell measures the model's reach, not a missing
capability, and no new data-quality skill is underwritten.

**The oracle, corrected before publication.** Two earlier forms of this case were
measured and are history, not results. The first asserted `ranpass sqlite3
.*check\.sql` alone: the tree documents `@state = corrected`, which exits 0 on the
defective pipeline, so a draw that edited nothing scored green — **r2** of
`2026-11-15T10-49-31--implement-from-prompt` passed that way with no edit at all,
while r1 and r5 did edit (r1 passed, r5 was red on `unchanged AGENTS.md`) and r3
and r4 were red only on the load gate (`findings=2`); that pair read 2/5. A second form
also demanded the literal `staged` in the invocation: two clean control draws were
green while it read red (`2026-11-15T11-03-56--implement-from-prompt--without-skill`
r1 ran `for s in staged corrected`, so no invocation carries the literal; r3
printed `EXIT staged=0`, a marker the exit resolver cannot read), so it was
rejected as an oracle rather than published. The form above keeps the gate
state-agnostic and forces the edit. Residual limits, named: an edit plus a
`corrected` run still passes, so `changed` is what makes the **untouched** no-op
impossible;
asserting the state instead false-fails the two shapes above; and a draw whose
check status the resolver cannot read (`2026-11-15T11-03-56--…` r3 printed
`EXIT staged=0`) fails `ranpass` closed by the harness's declared masked-exit
rule, which this case does not override. A retry pair
(`2026-11-15T11-25-40--implement-from-prompt--without-skill` /
`2026-11-15T11-57-05--implement-from-prompt`) stalled at the provider — five
skill draws and two control draws are `infrastructure`, and the skill arm records
`isolated=unknown` — and contributes no count. The corpus's declared limits (§6)
apply unchanged; n=5, as everywhere, does not exclude a small effect.

### `migration`

- **Evidence:** `migration-retry-backfill` fails after a retry (4→8 rows, content
  hash changed) and a backfill (12 rows for 6 events); the corrected loader is
  idempotent (4→4→6). `migration-sliced-cutover` fails on a duplicated
  `legacy_id` (`C-200` twice, 8 `orders_v2` rows for 6 migrated orders) and on a
  cutover whose rollback restores 1 of 7 legacy rows; the corrected state passes.
  `negative-safe-retry` accepts an upsert loader and `negative-safe-cutover`
  accepts a sliced migration whose backup precedes the delete, both with zero
  findings; `negative-healthy` accepts a correct incremental load with zero
  findings.
- **Gap shown:** retry/backfill idempotency, sliced migration, a duplicated
  mapping that fans out the join, and a reversible cutover are all measurable by
  an oracle and are not covered by an existing skill. Whether the platform
  already reaches them is what the composition arm below decides.
- **B arm:** `unknown` for the same reason.
- **Composition arm:** measured — SPEC-0093 staged `migration-sliced-cutover` as
  `implement-from-prompt` case 15 and ran five draws per arm, 2026-11-15.
- **Decision:** **build** — measured on the composition arm, not assumed. The
  platform skill does not fix the two faults: **1/5** draws scored, and the one
  that scored greened the documented check by making the default run the tree's
  own `corrected` path, not by fixing the fault branches. **0/5** skill draws
  touched `fixes()`, the function the two faults live behind, while 5/5 changed
  the default state. The control is **2/5** under the same oracle and **1/5**
  edits `fixes()`, so composition supplies no route either: what is missing is
  the procedure — fix the mapping key and the cutover's backup order where the
  fault is, and do not re-point the state at the pre-fixed branch. That is what
  a migration capability would underwrite. The old wording — **build new,
  provisional**: "the B arm is not staged, and `review-code`/`audit-code-quality`
  were not measured against these trees" — is kept as history: the decision no
  longer rests on it.
- **Next step:** a `build` follow-up spec, which owes the one cell this screen
  cannot supply: a staged-only copy of `migration-sliced-cutover` (no
  `corrected` branch, no state switch) as its first case, so a draw cannot green
  the check by flipping the default. `TASK-82` stays open until that follow-up
  lands. The oracle's limit is named below and is not an edit after the draws.

**The composition arm, measured (SPEC-0093).**
`evals/implement-from-prompt/fixtures/15/` is `migration-sliced-cutover/` copied
verbatim apart from the two `AGENTS.md` check commands (treeHash
`abc9aec85e791b4e6ee41d2ef9aad7aac7f284d681983871f665118318cc65b2`;
`pipeline.py` and `check.py` byte-identical to the corpus tree), and case 15's
prompt is the symptom only: "The migration is failing its contract. Fix it."
The oracle is the tree's own `check.py` (`ranpass`), the fix must be an edit
(`changed pipeline.py`), and `check.py`/`AGENTS.md` are asserted `unchanged`.
The documented check exits 1 on the shipped `staged` state and 0 on `corrected`;
`mapping-fixed` and `cutover-fixed` stay red on the other line.

Measured with `node scripts/eval.mjs compare implement-from-prompt 15 --repeat 5
--root skills` at `repoSha 5588b08`; model
`opencode-go/deepseek-v4.1-flash` (config default), level `behavior`,
concurrency 4, detector `cf2e2e319d975a5b`, five draws per arm. Both arms stage
the same fixture (`fixtureHash abc9aec8…`) and prompt (`promptHash 20739417…`).

| arm | run directory | draws / check-eval-run | passed | pipeline edited | `fixes()` touched | red assertions |
| --- | --- | --- | --- | --- | --- | --- |
| without skill | `2026-11-15T13-56-31--implement-from-prompt--without-skill` | 5/5, `findings=0` | 2/5 | 5/5 | 1/5 (r1) | r1 `unchanged AGENTS.md`; r4 `ranpass` + `unchanged AGENTS.md`; r5 `ranpass` |
| with skill | `2026-11-15T14-06-13--implement-from-prompt` | 5/5, `findings=0` | 1/5 | 5/5 | 0/5 | r1, r2, r5 `unchanged AGENTS.md`; r3 `ranpass` + `unchanged AGENTS.md` |

**The reds, named.** Four of the five skill draws are red on
`unchanged AGENTS.md`, and the fifth (r4) is the one pass. The four edited the
paragraph that says the tree ships both faults as `FIXTURE_STATE=staged`,
because they had changed which state is the default; the edit is what makes the
documentation true again, and the assertion cannot tell that from rewriting the
contract to fit. r3 is red on `ranpass` as well: its last invocation of the
check exited 1. On the control, r1 fixed `fixes()` (so `staged` no longer
injects either fault) and edited `AGENTS.md`, and r4 and r5 left the check red.

**The limit this oracle has, named.** Nine of the ten draws worked on the state
switch — 5/5 with the skill and 4/5 without changed which `FIXTURE_STATE` value
is the default — and the shipped `staged` state still returns `(False, False)`
from `fixes()` in all five skill draws, so the two faults remain reachable
behind the flag and `ranpass` on the documented command is satisfied by running
the tree's own `corrected` branch. The case cannot separate "fixed the loader
and the cutover" from "made the documented command run the pre-fixed branch",
and `changed pipeline.py` catches only an untouched file. The counts are
therefore a **screen**: they show the platform route does not fix the faults,
and they do not measure how well it could. `unchanged AGENTS.md` is what caught
the switch in the draws that recorded it, so it is not the assertion to drop;
the follow-up's staged-only copy is the cell that would measure the fix.

**Class: red for the capability, no separator.** Both arms fail, so the cell
does not separate skill from control, and it is not a non-discriminator either —
neither arm solved the task. It is the input to the `build` above, with its
limit carried into the follow-up.

**Corrections during implementation: none to the oracle.** The first draw was
read before anything was published, and two forms were considered and rejected
rather than measured. Dropping `unchanged AGENTS.md` was rejected: it would have
read 4/5 with the skill and 5/5 without, and every one of those greens was a
draw that had re-pointed the default at `corrected`. Asserting
`FIXTURE_STATE=staged` in the invocation was rejected for the reason SPEC-0092
already recorded — a literal state in the command is not a shape the transcript
guarantees (a loop over both states, or a masked exit marker, reads red while
the run is green) — and it would not repair the switch either, because
`staged` is still the state a fix must make green. The fixture stays the corpus
tree, the oracle stays as specified, and the tree's embedded answer key is the
declared limit (section 6), not a thing to edit after the draws.


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
  a data pipeline; the negatives show that checks stay silent on healthy
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
- No pass rate and no comparability claim for the `migration` B arm: it is
  `unknown`, not zero. `join/quality` and `migration` now have paid composition
  measurements (§4) whose counts are per draw, for the model and detector named
  there, and are not a product claim; the external (dbt) B arm is still
  `unknown` for both. The contract counts in section 7 are per draw, for the
  model and detector named there, and are not a product claim.
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
  `join/quality` composition measurement (§4) hit the cost before publication: the
  first form of case 14 asserted `ranpass` alone, and two skill draws that never
  edited the pipeline passed by running the documented `@state = corrected`. The
  case now also asserts `changed pipeline.sql`, which closes the no-op without
  asserting the fix's shape; the copy stays as-is because the assertion, not the
  tree, was the defect. Residual: an edit plus a `corrected` run still passes.
  The `migration` composition measurement (§4) hit the same cost from the other
  side: the tree's default state *is* the defect switch, so nine of ten draws
  changed which state is the default without touching the fault branch, and
  `ranpass` recorded three of those as passes. `migration` therefore still needs
  the staged-only copy, and it is the `build` follow-up's first cell rather than
  a screen.
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
