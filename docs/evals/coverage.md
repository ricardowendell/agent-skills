# Eval coverage

Inventory of the cases in `skills/*/references/evals.md`: what exists, how it is
staged, and what has actually been measured. Counts come from
`node scripts/run-evals.mjs --root skills --list` and from the fixture
directories; they are not estimates.

| Skill | Cases | Trigger | Manual | Fixture | Evidence recorded |
| --- | --- | --- | --- | --- | --- |
| `audit-docs` | 4 | 2 | 0 | tree 1; tree 3 staged via `git.json`; tree 4 drift fixture | case 3: 3/3, skill loaded 3/3 (`why:`, no run dir); case 4: 3/3, defect + intentional evolution + future filtered, no writes (`2026-11-05T08-46-00--audit-docs`) |
| `bootstrap-project-harness` | 15 | 2 | 1 | trees 1, 2, 3, 5, 7, 9, 10, 11, 14, 15; 14 and 15 via `git.json` | case 14: 12/12 re-judged (first pass 9/12 on a reply regex); case 15: 3/3 (`why:`, no run dir) |
| `capture-idea` | 3 | 2 | 0 | trees 1–3 | published matrix: #1 5/5 with the skill; control **unresolved** under v2 (`2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`: 0/0 clean, 5 contaminated — every draw read the install under `/Users/wendell/.agents/skills` (`r1` the directory, the rest the `SKILL.md`)), after v1 clean subsets 0/2, 0/2 and 0/0 (every clean draw failed `status: unprocessed`; dirs `2026-11-06T16-40-32--capture-idea`, `…17-07-09--without-skill`, `…17-23-44…`, `…17-32-50…`, all dirty); #2 trigger 5/5; #3 routing **5/5** with `process-inbox` staged as the declared sibling in `2026-11-06T19-06-50--capture-idea` (v2, `isolated=yes`), replacing the pre-fix 0/4 clean cross-skill-staging record `2026-11-06T16-50-30--capture-idea` (findings=1); see `pipeline-bookends-matrix.md` |
| `find-blind-spots` | 4 | 2 | 0 | tree 4 | case 4: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `groom-backlog` | 7 | 2 | 0 | trees 1, 3, 4, 5 | ablation on 4 fixture cases, 2026-11-05: both arms 4/4; index-first not promoted (tokens +65% on the adversarial case) (`09-32-51`, `09-34-43`, `09-39-15`, `09-43-45`); #2: pre-detector 3/3 with and 3/3 without at `3d38b31` (`2026-11-05T17-09-40--groom-backlog`, `2026-11-05T17-13-34--groom-backlog--without-skill`); re-run under the leak detector at `8777e0b`: with skill 3/3 clean (`2026-11-06T07-53-16--groom-backlog`), without it 0/3 with 2 contaminated — clean control 0/1 (`2026-11-06T07-47-34--groom-backlog--without-skill`), so #2 is unresolved, not a regression case |
| `implement-from-prompt` | 8 | 2 | 0 | trees 1, 2, 3, 4, 7, 8 | discriminating set (SPEC-0033, v2, `agentworks/deepseek-v4-1-flash`): #1 **5/5 vs 0/5** (`2026-11-07T08-57-39--implement-from-prompt--agentworks-deepseek-v4-1-flash`, `…08-59-39--without-skill`, `findings=0 isolated=yes`) and #8 **5/5 vs 0/5** (`…09-01-25…`, `…09-04-41--without-skill`, clean); see `discriminating-cases.md`. Published matrix: #1 and #8 separate 12/12 vs 0/12 on the default (`2026-11-05T12-35-30--implement-from-prompt`, `2026-11-05T12-42-05--implement-from-prompt--without-skill`, `2026-11-05T12-48-46--implement-from-prompt`, `2026-11-05T12-56-03--implement-from-prompt--without-skill`; these four predate the leak field, so `check-eval-run` reports `warnings=12` — pre-detector history, the rates stand); on `gpt-6-luna` #1 is 5/5 vs **0/5** (the old 1/5 control pass read the installed `SKILL.md`; re-measured at `2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`) and #8 is 5/5 vs 1/5 (`2026-11-05T13-18-27--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`, `2026-11-05T13-25-10--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-28-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`; the one #1 control pass read the real `SKILL.md`); #7 non-discriminator 5/5 both arms; #2 readable after SPEC-0019: gate 12/12 at `07f4fe6`, 11/12 passed (`2026-11-06T10-38-39--implement-from-prompt`), so the Gate A 2/5 did not reproduce (the delta includes the SPEC-0016 rule change, so the cause is not isolated); its control re-read under the detector is **0/3 draws**, 1 contaminated (`r3`) and the two clean draws failed the reply assertion (**0/2 clean**) at `2026-11-06T07-31-00--implement-from-prompt--without-skill`; the load across #1/#2/#5/#8 at n=12 was 45 of 46 clean draws loaded the skill (`2026-11-06T10-34-26`, `…10-38-39`, `…10-45-29`, `…10-53-13`); the one miss is #5 r9, which read the staged SKILL.md directly without calling the skill tool (a trigger case, so the tool call stays the routing signal — TASK-39), and #5's two exclusions are one contamination and one stall; #4 re-measured after SPEC-0016 (write target vs read dependency + fixture `package.json`): 5/5 with vs 3/5 without at `6dd38aa` (`2026-11-05T15-00-48--implement-from-prompt`, `2026-11-05T15-06-58--implement-from-prompt--without-skill`; two control reds are 600 s provider timeouts), so #4 is a non-discriminator and stays as a regression case; #1/#7/#8 kept 5/5 with skill (`2026-11-05T15-30-10--implement-from-prompt`, `2026-11-05T15-36-40--implement-from-prompt`, `2026-11-05T15-44-35--implement-from-prompt`); #3 is no longer `manual` after SPEC-0022: 1/1 with skill (`2026-11-06T11-28-49--implement-from-prompt`), no control, so it is a regression case, not a separator; trigger #5 4/5, #6 5/5 (`2026-11-05T11-52-43--implement-from-prompt`) |
| `process-inbox` | 3 | 2 | 0 | tree 1 | published matrix: #1 5/5 with the skill; control **unresolved** — default `02-51-15` is 0/2 valid clean (1 abort, 2 contaminated), and `03-08-51` is 5 provider aborts, not evidence; agentworks 0/2. v1 subsets 0/1, 0/1 and 0/1 are history. #2 trigger 4/4 clean scored draws loaded (`2026-11-06T16-55-11--process-inbox`, findings=1); #3 routing **5/5** with `capture-idea` staged as the declared sibling in `2026-11-06T19-09-27--process-inbox` (v2, `isolated=yes`), replacing the pre-fix 0/5 cross-skill-staging record; see `pipeline-bookends-matrix.md` |
| `record-decision` | 5 | 2 | 0 | trees 1–5 | published matrix: #1 separator 4/5 vs **1/5** (`2026-11-06T16-43-33--record-decision`, `2026-11-06T17-11-37--record-decision--without-skill`); #2 separator 4/5 vs **0/5** (`2026-11-06T16-45-46--record-decision`, `2026-11-06T17-28-10--record-decision--without-skill`); #3 non-discriminator 4/5 vs 5/5 (`2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill`); triggers #4/#5 5/5 in `2026-11-06T17-04-07--record-decision`; see `pipeline-bookends-matrix.md` |
| `review-code` | 7 | 2 | 0 | trees 1–7 plus `base/` and `base-red/`; 1–4 and 7 via `git.json` | discriminating set (SPEC-0033, v2): #7 **5/5 vs 0/5** (`2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash`, `…09-11-14--without-skill`, clean; the control fails `verdict REJECT` 5/5, 3 approve and 2 miss the token), the **holdout**; see `discriminating-cases.md`. Published matrix; #4 fixture revised 2026-11-05: 5/5 with, 3/5 without (`2026-11-05T07-34-32--review-code`, `…07-47-21--review-code--without-skill`); #7 red gate: 3/3 with, 0/3 without (`…09-05-36`, `…09-32-10--without-skill`) |
| `survey-inflight-work` | 4 | 2 | 0 | tree 1 via `git.json` with a local bare `origin`; tree 2 without a remote | iteration 1, 1 draw/case: with-skill 4/4 (`2026-11-04T21-49-16`); control case 1 0/1, only the `unknown` PR state separated (`…21-45-26`); control case 2 0/1, only the no-remote line separated (`…21-57-53`) |
| `audit-code-quality` | 4 | 2 | 0 | trees 1 and 4 via `git.json` | iteration 1: with-skill 4/4 (`2026-11-04T21-55-53`); control case 1 0/1, only coverage `unknown` separated (`…21-47-51`); case 4 on the final 8-assertion version 1/1 with skill (`2026-11-04T21-59-17`) against 0/1 without (`2026-11-04T21-59-17--audit-code-quality--without-skill`) on `SCOPE:`/`rule`/`CAPTURE OPTIONS` — one draw per arm, so it does not separate reliably (`…21-57-53` is the pre-contract 5-assertion version) |
| `tighten-harness` | 6 | 2 | 0 | trees 1, 2, 3, 5, 6 | case 5: 3/3 passed, skill loaded 0/3 (`why:`, no run dir) |
| `write-implementation-prompt` | 6 | 2 | 1 | trees 1–4 | SPEC-0030 re-measure at `dcf5177` (`skillHash 046369c2…`, detector v2; the clean behavioural cells are `isolated=yes`, the trigger runs carry their findings): #1 5/5 clean (`2026-11-06T19-25-26--write-implementation-prompt`), control **unresolved** under v2: default 0/3 clean in two runs (`2026-11-07T01-46-26--write-implementation-prompt--without-skill`, `…02-58-14…`) and agentworks 0/2 (`08-17-29`); every clean draw failed `spec_sha:`. Four v1 attempts are history; #2 5/5 clean (`2026-11-06T19-28-47--write-implementation-prompt`), control **separator** under v2 on the default model (`2026-11-07T03-01-29--write-implementation-prompt--without-skill`: 5/5 clean, **0/5 passed**); the agentworks control (`08-20-10`) only reached 0/4 clean, a route difference. The v1 `15-30-39` 0/4 replay-clean is history; #4 5/5 clean (`2026-11-06T19-30-26--write-implementation-prompt`), control **non-discriminator** under v2: default **4/4 valid passed** (`2026-11-07T02-03-01--write-implementation-prompt--without-skill`; 1 rep aborted), agentworks 2/2 (`08-22-28`); the v1 `14-37-23` 4/4 passed is history; #3 `manual` (history `14-01-54` split 4/5; not re-run); triggers: #5 loaded 5/5 in both `2026-11-06T19-32-45` and `2026-11-06T19-53-34` but has no stall-free five-draw cell (stalls r1/r4 and r3/r5, event gaps in the matrix; contamination; best clean subsets 1/1 and 2/2); #6 clean 5/5 in `2026-11-06T20-12-15--write-implementation-prompt` (`findings=0 warnings=0 isolated=yes`), 5/5 in `19-32-45`, 4/5 in `19-53-34` (r3 loaded) — improved but not deterministic; canary 12/12 `13-51-35`; `13-46-05` discarded (`r8` read `.lane/trees`); see `write-implementation-prompt-matrix.md` |
| **total** | **76** | **26** | **2** | | |

## Discriminating set (issue #5)

Three cases separate two arms at n=5 under detector v2, with both arms clean:
`implement-from-prompt` #1 (5/5 vs 0/5, `status: implemented`),
`implement-from-prompt` #8 (5/5 vs 0/5, `nofile src/format.js`) and `review-code`
#7 (5/5 vs 0/5, `verdict REJECT`). `review-code` #7 is the **holdout**, frozen
in `SPEC-0033` before the first draw; its control fails the token 5/5, but 3/5
approve and 2/5 only miss the token. One more separates on the default model:
`write-implementation-prompt` #2 (5/5 vs 0/5, `03-01-29`). The runs and hashes are
in [`discriminating-cases.md`](discriminating-cases.md).

## Evidence rules

- A run directory cited **as evidence** takes one of two explicit paths:
  - **v2** (`detectorVersion` `71bfb85a91cd68ab`): `node
    scripts/check-eval-run.mjs <run-dir>` reports `findings=0 warnings=0
    skillLeaks=0 hostReads=0 isolated=yes`. That means no skill or host read, no
    contaminated draw, no aborted draw (timeout, stall, provider limit), no lost
    gate, no missing provenance, no unfinished run, at least one draw that ran,
    and the manifest records an isolated run (`params.isolate: true`).
  - **v1** (`a31d58f79a6c7038` and earlier): history, never a clean measurement.
    It is citable as replay-verified history only when
    `node scripts/replay-evals.mjs --leaks <run-dir>` prints `clean`, and the
    citation names that replay. A v1 run never prints `isolated=yes`; with no
    read detected it prints `isolated=unknown`, because v1 did not look for host
    reads.
  A directory that fails may still be cited **as the record of the failure
  itself**, with the finding named; it cannot supply a clean pass rate.
  `isolated=no` means the checker saw a skill or host read; `unknown` is neither
  a dirty verdict nor a clean one.
- The two paths above apply to runs covered by a named replay (the 0.5.0 wave
  and later). Rows whose runs predate that replay — the pre-detector
  `implement-from-prompt` 12/12 vs 0/12 cells (`warnings=12`) are the example —
  are **history**: their numbers are cited as historical direction, not as a
  clean measurement, and cannot underwrite a v2 claim.
- `stoppedEarly: true` is a complete run, not an unfinished one: the stop rule
  fired between waves and `reps` is the number of draws actually run. Cite
  `reps`/`passed` (e.g. "8/8, stopped early"), never the requested `--repeat`.
- A control from an earlier wave is citable only when `fixtureHash`, `promptHash`
  and `detectorVersion` match the new run. Any divergence — one fixture byte, a
  prompt edit, a detector change — re-runs the control (SPEC-0020).
- A pre-SPEC-0017 run that started before the detector landed and has no `leak`
  field at all is `not checkable`: the checker emits `warn leak-missing`, and a
  citation must state its `warnings=N`. It is history, not a clean measurement.
- A cell names a measurement only when it names the run directory or cites a
  `why:` note that records the number. A note without a run directory is marked
  `no run dir`: the count is honest, the provenance is not. Anything else reads
  `none`.
- `status: manual` cases are counted in `Cases` and excluded from a run; they are
  design intent, not evidence.
- A per-case number belongs in its `why:` line. A measured set belongs in a doc
  beside `review-code-matrix.md`.
- Before a release, `node scripts/audit-provider-aborts.mjs` lists every stored
  transcript with a `provider.*` abort and whether its result recorded it. An old
  artefact can abort while the result says only `failed — exit 1`; the audit and
  its dispositions are in [`provider-aborts.md`](provider-aborts.md). It reads the
  store, writes nothing and spends no model call.
- A draw that stalls **after** the skill loaded is provider noise until proven
  otherwise: if a paid run stalls post-load again, stop the wave, record the
  event gap and the attempt, and reopen `TASK-50` with those events. In the
  SPEC-0030 trigger runs 4 of 10 draws stalled this way, each with one retry and
  150–355 s lost; that is a known cost, not a clean measurement.
- Never round a repetition into a rate: `--repeat 3` gives three draws, and the
  matrix says five is enough to see a direction, not to publish a per-case rate.

## Detector v2

The rows above were measured with detector v1 (`a31d58f79a6c7038`), which saw
installed skill roots and `references/evals.md` but not the host checkout.
Detector v2 (`71bfb85a91cd68ab`) adds a separate `host` finding for a read into
the checkout root or one of its documented subdirectories (`docs/`, the checkout
`AGENTS.md`, `scripts/`, `skills/`, `runs/`) or into `.lane/trees/`; a `leak`
finding keeps its v1 meaning (installed skill or answer key). The numbers above
are unchanged. The 0.5.0 rows are **replay-verified v1 history**, not v2
measurements: none of them can print `isolated=yes`, and each is citable only
through the replay below.

`node scripts/replay-evals.mjs --leaks <run-dir…>` (or `--leaks --all`)
re-judged the 0.5.0 wave from its transcripts, with no model and no write into
the run directories: 49 run directories and 57 cells (the four skills, their
controls, the two `write-implementation-prompt` canaries, and the
`agentworks-gpt-oss-120b` pilot cells, which all replay clean). 26 cells are
dirty; a cell is listed once, with the rules the replay found.

| cell | run dir | draws | replay verdict | clean under v1? |
| --- | --- | --- | --- | --- |
| `write-implementation-prompt#1` | `2026-11-06T13-46-05--write-implementation-prompt` | 8 | `dirty(host)` | yes — already discarded by hand (r8 read `.lane/trees`) |
| `write-implementation-prompt#5` | `2026-11-06T14-07-04--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** |
| `write-implementation-prompt#6` | `2026-11-06T14-07-04--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** |
| `write-implementation-prompt#1` | `2026-11-06T14-28-07--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T14-30-42--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#3` | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#4` | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | 5 | `dirty(host)` | yes — **new** (r5 grep of the checkout root, denied) |
| `write-implementation-prompt#2` | `2026-11-06T14-40-36--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#5` | `2026-11-06T14-43-01--write-implementation-prompt` | 5 | `dirty(leak)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-15-52--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-18-26--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-20-43--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-25-06--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-27-30--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-30-39--write-implementation-prompt--without-skill` | 5 | `dirty(host)` | yes — **new** (r1 glob of the checkout root, denied) |
| `write-implementation-prompt#5` | `2026-11-06T15-33-16--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#6` | `2026-11-06T15-33-16--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** (r1 grep of the checkout root, denied) |
| `write-implementation-prompt#5` | `2026-11-06T15-49-43--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#5` | `2026-11-06T16-02-56--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `capture-idea#3` | `2026-11-06T16-50-30--capture-idea` | 5 | `dirty(leak)` | no |
| `capture-idea#1` | `2026-11-06T17-07-09--capture-idea--without-skill` | 5 | `dirty(leak)` | no |
| `process-inbox#1` | `2026-11-06T17-08-43--process-inbox--without-skill` | 5 | `dirty(leak)` | no |
| `capture-idea#1` | `2026-11-06T17-23-44--capture-idea--without-skill` | 5 | `dirty(leak,host)` | no |
| `process-inbox#1` | `2026-11-06T17-25-52--process-inbox--without-skill` | 5 | `dirty(leak,host)` | no |
| `capture-idea#1` | `2026-11-06T17-32-50--capture-idea--without-skill` | 5 | `dirty(leak,host)` | no |
| `process-inbox#1` | `2026-11-06T17-34-41--process-inbox--without-skill` | 5 | `dirty(leak)` | no |

Five cells that were clean under v1 are newly invalidated by a host read (the
sixth, `13-46-05`, was already discarded by hand):

- `2026-11-06T14-07-04--write-implementation-prompt` #5: r1 read the checkout
  `AGENTS.md` and `docs/specs/SPEC-0012-paraphrase-lens-spec-reviewer.md`
  (both denied). #6: r1 read only
  `docs/specs/SPEC-0012-paraphrase-lens-spec-reviewer.md`; the `AGENTS.md` read
  is `#5.r1`, not `#6.r1`.
- `2026-11-06T14-37-23--write-implementation-prompt--without-skill` #4: r5
  grepped `/Users/wendell/.agents` (denied). The published "5/5 in both arms" is
  now 4/5 clean on the control.
- `2026-11-06T15-30-39--write-implementation-prompt--without-skill` #2: r1
  globbed `/Users/wendell/.agents` (denied). The #2 separator's published "0/5
  clean control" is 0/4 clean — the direction is unchanged, but the clean
  five-draw control is not.
- `2026-11-06T15-33-16--write-implementation-prompt` #6: r1 grepped
  `/Users/wendell/.agents` (denied), so this trigger run's clean subset is one
  draw smaller.

The `record-decision` controls (`17-11-37`, `17-15-33`, `17-20-53`, `17-28-10`)
and the two agentworks controls replay clean, so not every 0.5.0 control reads
the host; the deny-layer question (SPEC-0028) stays open. The 12-draw canary at
`2026-11-06T13-51-35` is clean and remains citable as replay-verified v1
history. A denied read still counts: detection is the guarantee, denial is the
permission layer's separate decision.

A cell-level dirty verdict does not by itself shrink every published clean
subset: where a row above cites a subset (for example,
`write-implementation-prompt` #5 at `2026-11-06T16-02-56`, 3/3), the replay's
per-draw pass leaves that subset intact. The cells above keep their published
numbers; SPEC-0031 re-measured the arms that still mattered under v2.

That re-measure ran at `eb9903e` on `agentworks/deepseek-v4-1-flash` (the default
provider's weekly limit was exhausted), five draws per arm. The skill arms are
clean 5/5 (`2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash`,
`2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash`); the
controls are still dirty or too short: `capture-idea` #1 0/0 clean,
`process-inbox` #1 0/2 clean, `write-implementation-prompt` #1 0/2 and #2 0/4,
and #4 2/2 clean passed. No control reached five clean draws, so the unresolved
cells stay unresolved and #4 stays a non-discriminator. The control arm still
reads the real install under `/Users/wendell/.agents/skills`; denying the `skill`
tool does not deny the text. That is the deny-layer half of TASK-43, not a
measurement this spec can fix.

The replay above is the named v1 replay for every 0.5.0 row in the table: a row
not listed here is `clean` under it and citable as replay-verified history; a
row listed here is not a clean measurement.

## Known holes

- **Three SPEC-0017 draws are not checkable, not invalid.** The
  `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`,
  `2026-11-05T12-00-00--implement-from-prompt--without-skill` and
  `2026-11-05T17-13-34--groom-backlog--without-skill` artefacts predate the
  `leak` field. The checker cannot re-judge them; it reports `warn leak-missing`.
  Their published numbers stay as historical evidence, not as a clean rate.
- **`groom-backlog` #2 is unresolved, not a non-discriminator.** The earlier
  reading — 3/3 in both arms — was measured before the runner detected external
  reads. Re-run at `8777e0b` with the detector: with the skill 3/3 clean
  (`2026-11-06T07-53-16--groom-backlog`); without it, 0/3, of which **2/3 were
  contaminated** by the installed `SKILL.md`/`evals.md`
  (`2026-11-06T07-47-34--groom-backlog--without-skill`). The one clean control
  draw failed the split assertion, so the case may separate, but one draw cannot
  carry the claim. Re-measure after the control arm can no longer read the
  install, then classify.
- **`write-implementation-prompt` #1 is unresolved.** Four v1 control attempts
  never produced a five-draw clean run: clean subsets 0/3
  (`2026-11-06T15-15-52--write-implementation-prompt--without-skill`), 0/4
  (`2026-11-06T15-18-26--write-implementation-prompt--without-skill`), 0/3
  (`2026-11-06T15-20-43--write-implementation-prompt--without-skill`) and 0/4
  (`2026-11-06T14-28-07--write-implementation-prompt--without-skill`). The v2
  re-measure
  (`2026-11-07T08-17-29--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 0/2 clean with 3 contaminated; both clean draws failed `spec_sha:`. No run
  has five clean draws, so it stays unresolved, not a separator. See
  `write-implementation-prompt-matrix.md`.
- **`write-implementation-prompt` #4 is a non-discriminator.** 5/5 in both arms
  under v1 (`2026-11-06T14-04-25--write-implementation-prompt`,
  `2026-11-06T14-37-23--write-implementation-prompt--without-skill`). The v2
  re-measure
  (`2026-11-07T08-22-28--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 2/2 clean passed with 3 contaminated, so the control passes when clean and
  the case cannot separate the arms. The decision stands; the control's 2/2 clean
  subset is not a five-draw rate. A bare agent mirrors the existing prompt and
  records `spec_sha` as often as the skill. Recorded as a regression case; see
  `write-implementation-prompt-matrix.md`.
- **`capture-idea` #1 is unresolved.** 5/5 with the skill under v2
  (`2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash`); the v2
  control
  (`2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 0/0 clean with 5 contaminated. The v1 attempts were 0/2, 0/2 and 0/0
  (`2026-11-06T17-07-09--capture-idea--without-skill`, `…17-23-44…`,
  `…17-32-50…`), and every clean draw failed `status: unprocessed`. The direction
  is a separator, but no control run has five clean draws; it stays unresolved,
  not a regression case. See `pipeline-bookends-matrix.md`.
- **`process-inbox` #1 is unresolved, not the expected non-discriminator.** 5/5
  with the skill under v2 on both routes
  (`2026-11-07T02-45-54--process-inbox`,
  `2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash`). The
  default control `02-51-15` is 0/2 valid clean (1 abort, 2 contaminated); the
  agentworks control
  (`2026-11-07T08-31-34--process-inbox--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 0/2 clean with 3 contaminated. `03-08-51` is **not evidence**: all five
  reps aborted on the provider go-limit, so its assertions are trivially green.
  The v1 controls were 0/1 in each of
  `2026-11-06T17-08-43--process-inbox--without-skill`, `…17-25-52…` and
  `…17-34-41…`. Every valid clean control draw marked the note processed and
  created `docs/backlog`, failing `unchanged` and `nodir`; the case was not
  redesigned. It stays unresolved, not a regression case. See
  `pipeline-bookends-matrix.md`.
- **`record-decision` #3 is a non-discriminator.** 4/5 with the skill against
  5/5 without it (`2026-11-06T16-48-00--record-decision`,
  `2026-11-06T17-20-53--record-decision--without-skill`): a bare agent performs
  the reversal as reliably as the skill. Recorded as a regression case; see
  `pipeline-bookends-matrix.md`.
- **The cross-skill routing pair was a staging defect; fixed and measured by
  SPEC-0029.** `capture-idea` #3 asserts `skill process-inbox` and
  `process-inbox` #3 asserts `skill capture-idea`; until SPEC-0029 only the skill
  under review was staged, so the target was absent without a read of the real
  install and the pair measured 0/4 and 0/5
  (`2026-11-06T16-50-30--capture-idea`, `findings=1`;
  `2026-11-06T16-55-11--process-inbox`, `findings=1`). The cases now declare the
  sibling with `stage:`; the runner stages and hashes it and records
  `stagedSkills`. Re-measured five draws each on detector v2:
  `2026-11-06T19-06-50--capture-idea` and
  `2026-11-06T19-09-27--process-inbox`, both 5/5 and both `isolated=yes`. The
  0/4 and 0/5 rows remain the pre-fix record. See
  `pipeline-bookends-matrix.md`.
- **The mutation pilot is inconclusive by design**: both controls in
  `experiments/mutation/review-code/` came back `invalid` (SPEC-0006). The
  durable artefact is the rule-coverage map, not a pass rate. Re-run against the
  revised #4 fixture (SPEC-0009), `ignore-spec-sha` is a **survivor**: the rule
  is redundant there because the prompt's `spec_sha` supplies the cue.
- **`implement-from-prompt` has no load defect left**: #1
  and #8 separate (12/12 vs 0/12 on the default model, pre-detector history —
  `warnings=12`, the rates stand); #7 is a
  non-discriminator (5/5 both arms); #2's load defect did not reproduce at
  `07f4fe6` (gate 12/12, 11/12 passed; `2026-11-06T10-38-39--implement-from-prompt`),
  so it is readable but still not a separator — its control has 0/2 clean draws
  at `2026-11-06T07-31-00--implement-from-prompt--without-skill`; #4 was fixed by
  SPEC-0016, which taught the skill to
  tell a write target from a read dependency, and re-measured at 5/5 with the
  skill against 3/5 without it — the fixture's new `package.json` lowered the
  control's bar as well, so #4 is now a regression case instead of broken; #3
  is no longer `manual` after SPEC-0022 (1/1 with skill at
  `2026-11-06T11-28-49--implement-from-prompt`, no control), so it is a
  regression case, not a separator. Since SPEC-0021 the judge reads the
  tool-call ledger: the #7 control moved from 1/5 to 5/5, while #1 with the skill
  stays 0/5 on a behavioural residual (TASK-40) and `unverifiable` still fails
  the case; both re-judged cells are `provenance: partial` because they predate
  SPEC-0020's hashes. See `implement-from-prompt-matrix.md`.
- **`review-code` #2 left the matrix**: it measured 5/5 in both arms on the
  replaced fixture (`2026-11-02T10-27-26--review-code`,
  `2026-11-02T10-31-40--review-code--without-skill`; both pre-detector,
  `warnings=5`), so it is kept as a regression case — regression, not a
  discriminator; decision recorded 2026-11-06 (TASK-34). See
  `review-code-matrix.md`.
- **`audit-code-quality` #4 does not separate reliably**: the pre-contract
  version (`2026-11-04T21-57-53--audit-code-quality--without-skill`, five
  assertions) had no `SCOPE:`, `rule`/`judgement` or `CAPTURE OPTIONS` rule to
  fail, so its pass says nothing about the contract. On the final version (eight
  assertions) the case separated once —
  `2026-11-04T21-59-17--audit-code-quality` 1/1 with the skill against
  `2026-11-04T21-59-17--audit-code-quality--without-skill` 0/1 on those three
  assertions — but one draw per arm cannot carry a discriminator claim. It stays
  a regression case — regression, not a discriminator; decision recorded
  2026-11-06 (TASK-34). Re-measure with n≥5 before promoting it.
- **Two cases are `manual`**: `bootstrap-project-harness` #8 and
  `write-implementation-prompt` #3. They run nowhere today.

## Dispositions

A case published as `regression` is kept to catch a control that misses the
spec, the contract or the gate; `removed` would mean it adds no evidence. The
rows below were decided on existing runs, not a new draw.

| case | decision | reason | run directories | date |
| --- | --- | --- | --- | --- |
| `audit-code-quality` #4 | `regression` | On the final 8-assertion case it separated once (1/1 with the skill vs 0/1 without), but one draw per arm cannot carry a discriminator claim; the earlier 5-assertion run predates the contract. | `2026-11-04T21-57-53--audit-code-quality--without-skill` (pre-contract 5-assertion version), `2026-11-04T21-59-17--audit-code-quality` and `2026-11-04T21-59-17--audit-code-quality--without-skill` (final 8-assertion pair; `warnings=1` each) | 2026-11-06 |
| `review-code` #2 | `regression` | 5/5 in both arms on the replaced fixture: the control finds the spec and cites AC-2, so a diff-reading case cannot discriminate. | `2026-11-02T10-27-26--review-code`, `2026-11-02T10-31-40--review-code--without-skill` (`warnings=5` each, pre-detector) | 2026-11-06 |
| `write-implementation-prompt` #4 | `regression` | 5/5 in both arms under v1. The v2 control is 2/2 clean passed (3 contaminated), so a bare agent mirrors the existing prompt and records `spec_sha` as often as the skill does; the case cannot separate the arms, and the control's 2/2 clean subset is not a five-draw rate. | `2026-11-06T14-04-25--write-implementation-prompt`, `2026-11-06T14-37-23--write-implementation-prompt--without-skill`, `2026-11-07T08-22-28--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` (v2, `contaminated`) | 2026-11-06 |
| `record-decision` #3 | `regression` | 4/5 with the skill against 5/5 without it: the control writes ADR-0003, marks ADR-0002 superseded and updates the index as reliably as the skill. | `2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill` | 2026-11-06 |

No case is removed: each fails a control that breaks the contract or ignores an
acceptance criterion, which is evidence a later wave can cite.

### Discrimination audit

Every separator claim the audit walked has a control on the same fixture and
prompt, so none is reclassified. `implement-from-prompt` #1 and #8 use the same
`repoSha 3779a20` in both arms on the default model
(`2026-11-05T12-35-30`/`12-42-05` and `12-48-46`/`12-56-03`); the with-skill
cells predate SPEC-0016, so the pairing is historical for that arm while the
control does not load the skill. Luna #1 pairs `2026-11-05T13-18-27` at `3779a20`
(pre-fix `SKILL.md`) with the `2026-11-06T07-05-38` control at `8777e0b`:
`references/evals/1/` and the case-1 assertions are unchanged, but `SKILL.md`
changed in SPEC-0016 and there is no post-fix with-skill luna #1; luna #8 pairs
`13-25-10`/`13-28-38` at `3779a20` (also pre-fix on the with-skill side).
`review-code` #1 was re-measured at `61978f1`
(`20-26-40--matrix`/`20-34-11--matrix--without-skill`) and on luna at `81cba18`
(`20-43-48`/`20-48-34`); #3 at `8b74222`
(`10-06-33--review-code`/`09-56-47--review-code--without-skill`, luna
`10-10-09`/`10-02-34`); #4 and #7 at `7a44564`
(`07-34-32`/`07-47-21`, `09-05-36`/`09-32-10`). `survey-inflight-work` #1/#2 and
`audit-code-quality` #1 share `3784ae7` (`21-49-16`/`21-45-26`,
`21-49-16`/`21-57-53`, `21-55-53`/`21-47-51`). None of the runs cited here
carries `fixtureHash`/`promptHash`, so matching is by `repoSha` plus the
identical case prompt.

Caveats: the default `implement-from-prompt` cells are pre-detector
(`warnings=12`); the luna with-skill and #8 cells and `review-code` #4/#7 are
pre-detector too (`warnings=5`; #7 `warnings=3`), with the luna #1 control the
one clean re-measure (`warnings=0`); the `review-code` #1/#3 runs are pre-detector
as well (`warnings=15` on the matrix dirs, `warnings=5` on the #3 re-measures);
and the `survey` and `audit-code-quality` #1 cells are one draw per case —
directional, not rates. A post-SPEC-0016 with-skill re-measure of
`implement-from-prompt` #1/#8 would close the skill-version gap; it is not opened
as a task here.

The `record-decision` separators are paired at `db7c49a` with matching
`fixtureHash`, `promptHash` and `detectorVersion`: #1
(`16-43-33`/`17-11-37`) and #2 (`16-45-46`/`17-28-10`). `capture-idea` #1 and
`process-inbox` #1 have no clean control pair, so they are not claimed as
separators, and `record-decision` #3 is the non-discriminator.

## How to update

```sh
# the inventory
node scripts/run-evals.mjs --root skills --list

# which cases stage a committed repo
find skills -name git.json

# which cases are manual (format lines also contain the string)
grep -rn '^[[:space:]]*- status: manual' skills/*/references/evals.md
```

Recount the totals, update the row you changed, and leave `none` alone unless a
run directory or a `why:` note backs the claim.
