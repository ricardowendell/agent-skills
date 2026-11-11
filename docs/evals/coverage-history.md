# Eval coverage — history

The material below is the historical record behind [`coverage.md`](coverage.md)
and it is moved from there verbatim (SPEC-0081): the detector evolution and its
re-judgements, the per-wave evidence, the staleness readings the current one
superseded, the iterative corpus's provenance and the discrimination audit. The
scorecard cites this file instead of carrying it. Some blocks were lifted
mid-section: where a preserved line says "the rows above", it refers to the
`coverage.md` section the block came from, not to the archive's preceding text.

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

Detector v3 (`d8478beab04a4e3e`, SPEC-0048) adds `denied`: a corpus path whose
call's output shows a permission denial for that path is a refused attempt, not
a read. It is recorded and counted, but it neither contaminates the draw nor
makes `isolated=no`; a successful read of the same path is still `leak`/`host`.

Detector v4 (`d3e95ef948f983b7`, SPEC-0049) closes the suppressed-probe gap.
Under an enforced run (`params.isolation.enforced: true`), a corpus hit whose
call returned nothing for that path and whose output carries no denial naming it
is a `denied` attempt, not a `leak`/`host`: `ls … 2>/dev/null` discards the only
line that would name the refusal, and the boundary plus its canary — not the
transcript — is what proves the read could not succeed. A call that demonstrably
returned the path's content (a non-shell result, or a shell output line naming
the path outside a denial) is still a leak. Without enforcement the v3 rule is
unchanged. Re-judging the 10-59-41 control with the replay yields five clean
draws and `deniedDraws=1`; its stored v3 artefact still reports the leak it
recorded, which is why the replay is the citation for that cell.

Detector v5 (`def64b2d6a1baa6e`, SPEC-0051) makes content count only for the
path it names: under enforcement a corpus hit is a `leak` only when the call
returned **that path's** content — a non-shell result carrying a body, or a
shell output line naming the path (or a child) with no error marker
(`No such file or directory`, `permission denied`, `Operation not permitted`,
`EPERM`, `EACCES`, `Is a directory`, `Not a directory`) and no ` -> ` symlink
arrow. Sibling output, an ENOENT line and an `ls` symlink listing are not a read
of the hit path; they fall to the enforced residual and are `denied`. Without
enforcement the v4 rule is unchanged. The two SPEC-0050 control runs
`2026-11-09T12-41-57--capture-idea--…--without-skill` and
`2026-11-09T12-55-35--groom-backlog--…--without-skill` replay to five clean
draws each with `isolated=yes`; SPEC-0050 publishes the cell verdicts. v6
re-judges the groom control (the store rule below).

Detector v6 (`9149d6ab1ca57343`, SPEC-0052) makes the eval store corpus. The
store is `<home>/.local/share/opencode/evals` — every answer key
(`<skill>/<n>.md`), every prior transcript and result, `baseline.json` and
`last-run.json`. `corpusRoots` adds the whole subtree to the seatbelt deny (and
its resolved path, because the throwaway home inherits the real `.local` as a
symlink), and a store hit is a `leak` (an answer key), never `host`. The rule is
checked before the isolated-home exclusion, so
`<isolated-home>/.local/share/opencode/evals/…` is the real store. Without
enforcement the hit is a leak; under enforcement it is `denied` unless the call
returned that path's content, which keeps the SPEC-0051 rule ahead of it. The
deny is scoped to `evals`:
`auth.json`, `evals-archive` and `evals-*-backup` are outside it.

The store-wide re-judge (`node scripts/eval.mjs inspect --leaks --all`, no model,
no write) found eight draws that touch the store. Five moved clean → `leak`, and
every one reads the store:

| run dir | cell | draw | before → after | store path |
| --- | --- | --- | --- | --- |
| `2026-11-02T01-25-09--bootstrap-project-harness` | `#14` | r2 | clean → `leak` | answer keys under `evals/bootstrap-project-harness/`, `evals/last-run.json` |
| `2026-11-06T15-33-16--write-implementation-prompt` | `#5` | r3, r5 | clean → `leak` | `evals/write-implementation-prompt/5.{md,json}` via the isolated `.local` symlink |
| `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` | `#19` | r1 | clean → `leak` | `evals/baseline.json`, `…/bootstrap-project-harness/12.json`, `13.json`, a prior transcript |
| `2026-11-09T12-55-35--groom-backlog--…--without-skill` | `#2` | r2 | clean → `leak` | `evals/groom-backlog/2.md`, the previous `result.json` and `2.r*.md` |

Three already-dirty draws gained store hits without a verdict change:
`2026-11-04T21-49-16--survey-inflight-work` #3,
`2026-11-06T15-49-43--write-implementation-prompt` #5 r3 and
`2026-11-06T16-02-56--write-implementation-prompt` #5 r4 (already `dirty(host)`
under v5 from a host read of `/Users/wendell/.agents`; v6 adds the store `leak`).
No other draw changed: every verdict change is a store read, no draw gained a
non-store hit, and no cell that was clean for another reason became dirty. The two SPEC-0050 controls affected
are re-judged above: `groom-backlog` #2 is 4/5 clean with 4/4 passed
(non-discriminator) and `bootstrap-project-harness` #19 is 4/5 clean with 0/4
passed over the clean base (separator 5/5 vs 0/4).

`node scripts/eval.mjs inspect --leaks <run-dir…>` (or `--all`)
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
the host; the deny-layer question (SPEC-0028) stayed open until SPEC-0046 /
TASK-71 added the OS boundary. The 12-draw canary at
`2026-11-06T13-51-35` is clean and remains citable as replay-verified v1
history.

A denied read is no longer a leak (SPEC-0048). Detection is still the
guarantee — a successful read is `leak`/`host` — but a path whose own call
output shows the permission denial is recorded as `denied`, counted on the
result and in the summary, and does not contaminate the draw. Denial is the
permission layer's decision, and the transcript is the record of it; the old
rule made a control that probed the corpus impossible to clean even when the
boundary held. The F0.1 control of SPEC-0047 is the worked example: its `r3`–`r5`
probes now replay clean with three denied draws and no `leak`/`host`.

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
cells stayed unresolved at that point and #4 stays a non-discriminator. The control arm still
reads the real install under `/Users/wendell/.agents/skills`; denying the `skill`
tool does not deny the text. Denying that read is **SPEC-0046 / TASK-71**: the
runner probes the host for an OS-level boundary (macOS seatbelt), launches the
child under it, and records `params.isolation` in the manifest. It does not
re-measure anything here. SPEC-0050 measured the four cells under the enforced
boundary at n=5 (separate rows above): `capture-idea` #1,
`process-inbox` #1 and `write-implementation-prompt` #1 are **separators**
(5/5 vs 1/5, 0/5 and 0/5), `groom-backlog` #2 is a **non-discriminator**
(5/5 vs 5/5) after SPEC-0051 re-judged its control read-only, and
`bootstrap-project-harness` #19 is a separator on the rule from SPEC-0047's
replay evidence. No cell remains unresolved for a contaminated control.

The replay above is the named v1 replay for every 0.5.0 row in the table: a row
not listed here is `clean` under it and citable as replay-verified history; a
row listed here is not a clean measurement.

### SPEC-0050 wave (five draws per arm, enforced boundary)

Measured 2026-11-09 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v4 `d3e95ef948f983b7`, then re-judged read-only under detector v5
`def64b2d6a1baa6e` (SPEC-0051) and again under v6 `9149d6ab1ca57343`
(SPEC-0052), both with `node scripts/eval.mjs inspect --leaks`. Every manifest
records `params.isolation.enforced: true` (seatbelt); under v6 every run is
`isolated=yes` except the two controls whose store-reading draw is named below;
`check-eval-run` on the two stored v4 controls still prints `isolated=no`. The #19 row is SPEC-0047's evidence, re-judged by
replay, not a new draw; its stored control artefact still records the v3
contamination. The `capture-idea` and `groom-backlog` control artefacts still
record the v4 contamination (`skillLeaks=1`; the groom also `hostReads=1`) while
the replay is the evidence, exactly as with #19. v6 turns the #19 control's r1
and the groom control's r2 into store leaks; the counts below are the v6 ones.

| cell | arm | run directory | clean draws | passed | deniedDraws | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bootstrap-project-harness` #19 | with-skill (SPEC-0047) | `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/4) |
| `bootstrap-project-harness` #19 | control (SPEC-0047, replay) | `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` | 4/5 (v6; r1 read the store) | 0/4 | 1 | `file AGENTS.md`, `file justfile`, `filematch eslint.config.js`, `filematch justfile eslint` | **separator** (5/5 vs 0/4) |
| `capture-idea` #1 | with-skill | `2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 1/5) |
| `capture-idea` #1 | control | `2026-11-09T12-41-57--capture-idea--…--without-skill` | 5/5 (v5 replay; stored r1 `skillLeaks=1`) | 1/5 | 2 | `filematch docs/inbox/*.md status: unprocessed` | **separator** (5/5 vs 1/5) |
| `process-inbox` #1 | with-skill | `2026-11-09T12-44-11--process-inbox--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/5) |
| `process-inbox` #1 | control | `2026-11-09T12-46-48--process-inbox--…--without-skill` | 5/5 | 0/5 | 3 | `unchanged docs/inbox/2026-01-01-digest-email.md`, `nodir docs/backlog` | **separator** (5/5 vs 0/5) |
| `groom-backlog` #2 | with-skill | `2026-11-09T12-50-37--groom-backlog--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **non-discriminator** (5/5 vs 5/5) |
| `groom-backlog` #2 | control | `2026-11-09T12-55-35--groom-backlog--…--without-skill` | 4/5 (r2 is a store leak; stored r2 `skillLeaks=1`, `hostReads=1`) | 4/4 | 2 | — (r2 is a store leak) | **non-discriminator** (5/5 vs 5/5) |
| `write-implementation-prompt` #1 | with-skill | `2026-11-09T13-07-02--write-implementation-prompt--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/5) |
| `write-implementation-prompt` #1 | control | `2026-11-09T13-11-33--write-implementation-prompt--…--without-skill` | 5/5 | 0/5 | 1 | `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:` | **separator** (5/5 vs 0/5) |

The four measured cells resolve to three separators (`capture-idea` #1,
`process-inbox` #1, `write-implementation-prompt` #1) and one
non-discriminator (`groom-backlog` #2). The two cells that the v4 detector
reported as leaked controls are clean under the v5 per-path rule — the stored
artefacts keep the old contamination, the replay is the evidence. The v6 store
rule re-judges one draw in each of the two replayed controls: the `#19` control
r1 and the `groom-backlog` control r2 read the eval store. The store is corpus
and denied under enforcement, so both draws are store leaks; the evidentiary
bases are the other four draws each, and no cell verdict moves. No oracle,
fixture, `why:` line or expected output changed after the draws.

### SPEC-0055 wave (five draws per arm)

Measured 2026-11-10 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v6 `9149d6ab1ca57343`, level `behavior`. Every valid manifest records
`params.isolation.enforced: true` (seatbelt), and `check-eval-run` on each of the
ten published cells prints `findings=0 warnings=0 skillLeaks=0 hostReads=0
isolated=yes deniedDraws=0`. "Clean draws" is the non-contaminated count;
"passed" is the assertion count.

| case | arm | run directory | clean draws | passed | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| #5 | with-skill | `2026-11-10T13-28-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | — | **separator** (5/5 vs 0/5), keep |
| #5 | control | `2026-11-10T13-31-04--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #6 | with-skill | `2026-11-10T13-33-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r2) | **separator** (4/5 vs 0/5), keep |
| #6 | control | `2026-11-10T13-36-02--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #7 | with-skill | `2026-11-10T13-40-49--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r5) | **separator** (4/5 vs 0/5), keep |
| #7 | control | `2026-11-10T13-43-14--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #8 | with-skill | `2026-11-10T13-45-48--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 3/5 | `reply SCOPE:` (r1, r3) | **separator** (3/5 vs 0/5), keep |
| #8 | control | `2026-11-10T13-49-08--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #9 | with-skill | `2026-11-10T13-59-02--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r4) | **separator** (4/5 vs 0/5), keep |
| #9 | control | `2026-11-10T14-02-40--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply (unmeasured\|not measured\|not configured\|not installed\|no dependency tool)`, `reply CAPTURE OPTIONS` | **separator** |

Case 8's deterministic assertions passed in both arms: every draw ran
`./bin/dependency-cruiser` and `./bin/knip` (`ran`), named the
`src/app.js` ↔ `src/legacy.js` cycle and the `src/unused.js` /
`unusedHelper` dead code. The separator is the `SCOPE:`/`CAPTURE OPTIONS`
contract, not the ability to read the stubs. Case 9 is the classification
separator: the skill says `unmeasured` in 5/5 draws, the control in 0/5, and the
control invents no metric.

The first case-9 with-skill attempt (`2026-11-10T13-51-55--audit-code-quality--agentworks-deepseek-v4-1-flash`) is **not evidence** (stall, `findings=1`): `evals/9` did not exist yet, so the
staged tree held only the skill; r3 stalled for 171 s (the 120 s watchdog fired; 2 attempts, one runner retry) and the other draws failed
`unchanged` because the fixture files were absent. The fixture pointer
`evals/9/git.json` (`base: "../6"`) was added and the cell re-run. That is one
extra cell of five paid draws, so the wave spent 55 draws, not 50; the overrun
is published rather than hidden.

Decisions: `keep` for all five cases; no `change`, no `drop`. The strict
`reply SCOPE:` line is the skill's own output contract, and the skill draws that
missed it used a `## SCOPE` heading. It was not relaxed after the draws. The
4/5 and 3/5 pass rates are published as rates; they are not reported as five
clean passes, and no oracle, fixture (apart from the missing case-9 pointer) or
`why:` line was changed to reach a pass after the first draw.

### SPEC-0056 wave (five draws per arm)

Measured 2026-11-10 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v6 `9149d6ab1ca57343`, level `behavior`. Every cited manifest records
`params.isolation.enforced: true` (seatbelt), and `check-eval-run` on each
directory prints `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes
deniedDraws=0`. "Clean draws" is the non-contaminated count; "passed" is the
assertion count. New cases 8–10 plus regression cases 1, 2 and 7: **65 paid
draws** — 55 evidence draws, 5 draws of an invalid case-10 setup attempt, and
the 5 case-10 control draws. The human approved the extra 5 draws above the
original 60 ceiling to close the case-10 control.

| case | arm | run directory | clean draws | passed | replayed (verdict / passed) | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #8 | with-skill | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both reject), keep |
| #8 | control | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 5/5 / 5/5 | `verdict REJECT` (the control rejects in prose 5/5; the token misses `changes requested`/`needs changes`) | **token/contract separator**, non-discriminator on judgement |
| #9 | with-skill | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both reject), keep |
| #9 | control | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 3/5 | 4/5 / 4/5 | `verdict REJECT` (r3, r4), `reply src/export\.js:[0-9]+` (r3 only) | **token/contract separator**, non-discriminator on judgement |
| #10 | with-skill (fixed fixture) | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both approve), keep |
| #10 | control | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 3/5 / 0/5 | `verdict APPROVE`, `reply Not verified` (the control approves in prose; no token and no `Not verified` section) | **token/contract separator**, non-discriminator on judgement |
| #1 | with-skill | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both approve), keep |
| #1 | control | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 5/5 / 0/5 | `verdict APPROVE` (r1, r4), `reply Not verified` (5/5) | **token/contract separator**, non-discriminator on judgement |
| #2 | with-skill | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | 4/5 / 4/5 | `verdict REJECT`, `reply AC-2`, `reply 21\.63\|noise\|float` (r4) | **non-discriminator** (4/5 vs 4/5), keep |
| #2 | control | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 4/5 | 5/5 / 5/5 | `verdict REJECT` (r5) | **non-discriminator** |
| #7 | with-skill | `2026-11-10T15-31-48--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **separator** (5/5 vs 0/5), holdout, keep |
| #7 | control | `2026-11-10T15-35-51--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 0/5 / 0/5 | `verdict REJECT` | **separator** |

The **replayed** column is the same stored transcripts read with the closed stance
table of SPEC-0062, no new draw: `node scripts/eval.mjs inspect <dir> --replay` over
the eight directories the four citations name (the `#1`, `#8`, `#9` and `#10`
cells; the `#2` and `#7` rows replay with it and are shown for completeness). The
measured `passed` column is untouched — it records what the assertion said when
the draws were run. The first number is the `verdict` assertion, the second is the
cell. Per cell: #1 control 3/5 → 5/5 on the token and 0/5 on the cell (`reply Not
verified` fails 5/5); #8 control 0/5 → 5/5 on both; #9 control 3/5 → 4/5 on both,
because r3 states the rejection in prose and names no listed stance; #10 control
0/5 → 3/5 on the token and 0/5 on the cell (r1 and r4 are prose, and `reply Not
verified` fails 5/5). One row moved that SPEC-0056 did not re-judge: the #2
control's r5 (`changes requested`) now reads `REJECT`, so that arm replays 5/5;
its skill arm stays 4/5 because r4 emits no `VERDICT:` line, so #2 remains a
non-discriminator.

**(SPEC-0062) What the `verdict` assertion measures.** It scores the stance line —
the words after `VERDICT:`/`Veredicto:`/`Parecer:` — and not the engineering
judgement the reply carries. A reviewer who rejects the change in a paragraph but
names no stance token is a *miss* for this assertion, exactly as a reviewer who
writes `VERDICT: REJECT` and then argues for merging is a hit: the assertion is a
token/contract reader, and a token/contract separator is not a capability
separator. The replayed column is therefore the judgement-corrected rate: same
draws, same replies, read with the vocabulary the controls actually wrote. The
measured column stays as the historical record of the token's behaviour, and the
two columns are not interchangeable.

Case 8's skill arm ran `npm test`, saw it pass and rejected the public-contract
break in 5/5. Its control rejects the same break in prose 5/5 ("changes
requested", "needs changes", "one blocking defect"), but the `verdict`
assertion's closed stance vocabulary only accepts `request changes`/`reject`, so
the control scores 0/5 on the token. The case is a token/contract separator, not
a substantive one: both arms reject the change and the 0/5 is the missing token.

Case 9's skill arm named `filename` → `buildExportCommand` → `execSync` in 5/5.
Its control rejects the injection in prose 5/5; r1, r2 and r5 emit a recognised
`VERDICT:` stance, r3 and r4 do not, so it scores 3/5. The `reply
src/export\.js:[0-9]+` red is r3 only; r4 cites the `file:line`. Same
classification: token/contract separator, non-discriminator on the substantive
judgement (both reject).

Case 10's fixed skill arm is 5/5. Its control
(`2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill`)
is 5/5 clean and 0/5 passed: it approves the same correct retry in prose 5/5 but
emits no `VERDICT: APPROVE` and no `Not verified` section, so those two
assertions fail. Same classification: token/contract separator,
non-discriminator on the substantive judgement (both approve). The control
closes the arm comparison; #10 is no longer unresolved.

Case 1's control approves the clean diff in prose 5/5 ("compliant — approve",
"approve", "Passes SPEC-0007"), but fails `reply Not verified` in 5/5 and
`verdict APPROVE` in r1/r4. It is a token/contract separator, non-discriminator
on the substantive judgement, and the case stays.

These four per-case readings describe the token's behaviour **at measurement
time**, under the stance table that preceded SPEC-0062; no measured number above
is rewritten. The **replayed** column is the same transcripts under the current
table, and it changes only the token: #1 control r1/r4 now read `APPROVE` (#8
control 5/5, #9 control r4, #10 control r2/r3/r5 likewise), while #9 r3 and
#10 r1/r4 still state their stance only in prose.

**Case 10's first skill arm is not evidence.** The run
`2026-11-10T15-15-21--review-code--agentworks-deepseek-v4-1-flash` (5/5 clean,
0/5 passed) reviewed the original fixture and correctly blocked it: the tests
covered AC-1, the call budget and the rethrow, but not AC-2's delay schedule or
AC-3's defaults and non-integer inputs, so the spec's "correct and tested"
premise was false. The fixture was strengthened — an injected `sleep` seam and
tests for the `[10, 20, 40]`/`[100, 200]` waits, the defaults, and `1.5`/`2.5`
rejections — and the case re-measured. The fixed arm is 5/5; no `expect:` line or
assertion was changed, and the fixture change did not lower the bar. The control
was run after the human approved the extra 5 draws.

Case 2 remains the non-discriminator it already was (4/5 vs 4/5); the r4 skill
failure had no `VERDICT:` line. Case 7's holdout stands at 5/5 vs 0/5.

**AC-6 disclosure.** The wave re-ran #1, #2 and #7 at `skillHash 9a28572…`.
Cases #3–#6 were **not** re-measured at that hash; their published cells in this
document are historical at older `skillHash` values and are not a claim of green
at `9a28572…`. **(SPEC-0078, 2026-11-11)** That gap is closed: #3–#6 were
re-measured at `9a28572…`, and the wave below publishes their cells.

Decisions: `keep` for #8, #9, #1, #2 and #7; `change` for #10 (the fixture was
strengthened before the fixed arm) and keep it. No case was dropped and no case
is unresolved.

The human-facing reading of this table — one screen per case, with the measured
and replayed columns kept apart and attributed to their waves — is
[`review-code-matrix.md`](review-code-matrix.md). It is a reading aid over the
cells above, not a second count: it publishes no number that is not in this
table or in the run directory it cites, and where the two would disagree this
table wins.

### SPEC-0078 wave (review-code cases 3–6, five draws per measured cell)

Measured 2026-11-11 in the `SPEC-0078` worktree at `repoSha aabb206`, model
`agentworks/deepseek-v4-1-flash`, detector `cf2e2e319d975a5b`, level `behavior`,
concurrency 4, `stallMs` 120000. Every cited manifest records
`params.isolation.enforced: true` (seatbelt), and `check-eval-run` on each of the
six directories prints `findings=0 warnings=0 skillLeaks=0 hostReads=0
isolated=yes deniedDraws=0`. Six runs, five scored draws each — **30 scored
draws, 32 paid attempts**: `#5 r4` and `#6 r4` each record `execution.attempts:
2, retries: 1`, an infrastructure attempt discarded and re-run once by the
harness's own infra retry (`stalled`/`timeout`, `execute.mjs:30`), not by
`--resume` and not a redraw for a greener number. The recorded cost `0.349374`
is the final attempt's usage only, so real spend is `≥ $0.349374`. No draw
outside the four cases.

Cases 5 and 6 are trigger cases measured with the skill arm only: a control
stages no skill, so case 5's `skill review-code` fails and case 6's
`notskill review-code` passes by construction.

| case | arm | run directory | clean draws | passed | class | skillHash | model | isolated= |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #3 | with-skill | `2026-11-11T14-32-10--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | **separator** | `9a28572…` | `agentworks/deepseek-v4-1-flash` | yes |
| #3 | control | `2026-11-11T14-37-56--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | **separator** | `9a28572…`† | `agentworks/deepseek-v4-1-flash` | yes |
| #4 | with-skill | `2026-11-11T14-43-55--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | **non-discriminator** | `9a28572…` | `agentworks/deepseek-v4-1-flash` | yes |
| #4 | control | `2026-11-11T14-46-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 2/5 | **non-discriminator** (red `verdict REJECT`, r3–r5; replayed 5/5 under SPEC-0079) | `9a28572…`† | `agentworks/deepseek-v4-1-flash` | yes |
| #5 | with-skill, trigger | `2026-11-11T14-49-32--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | **trigger** | `9a28572…` | `agentworks/deepseek-v4-1-flash` | yes |
| #6 | with-skill, trigger | `2026-11-11T14-54-36--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | **trigger** | `9a28572…` | `agentworks/deepseek-v4-1-flash` | yes |

† The control arm stages no skill, so its stored result records `skillHash:
null` plus the governed files it shares with the same checkout (`SKILL.md
c43fb3e2…`, `references/deterministic-checks.md 9c92a4e7…`); the tree hash
`9a28572…` is the with-skill identity over that checkout.

**#3 is a separator at `5/5 vs 0/5`, not a token difference.** The skill
withholds and asks for the intent in r1–r5; the control reviews the diff anyway,
invents a rounding policy as an acceptance criterion, and issues a stance in all
five. Both red assertions (`reply` refusal vocabulary, `noreply` verdict line)
fail in all five control draws. This is not the `5/5 vs 4/5` the spec warned
about; the control did not answer the question, so the draw is red for the
behaviour, not for a token the guard failed to read.

**#4 is a non-discriminator.** Both arms reject the branch against the stale
spec. The control's r3–r5 write `Verdict: not ready — the spec is not
implemented at all`, `Verdict: not implemented` and `Verdict: not implemented`;
at measurement time the closed stance table read a negated form as a miss
(`got NOT`), so only `verdict REJECT` failed, in r3–r5. SPEC-0079 added the
anchored stance-slot rule — a verdict line that *opens* with `not ready`,
`not implemented`, `not done` or another set member is a rejection — and the
2026-11-11 replay (`node scripts/eval.mjs inspect <dir> --replay`, no model, no
new draw) reads all three as `REJECT`: the control's token moves `2/5 → 5/5` and
the cell with it. The class is unchanged, because the arms already agreed on the
judgement. The `passed` column stays `2/5`: it records what the assertion said
when the draws ran, and the corrected reading is published beside it. The
matrix keeps the older
"token/contract separator" phrasing in its history section for the pre-detector
cell, but the class for this wave is the definition in SPEC-0078 F2.


## Staleness readings (superseded)

First run (2026-11-10, 62 cited cells): **17 stale** —
`audit-code-quality` #1–#4; `groom-backlog` #1, #3 and #4 (the ablation runs at
`1ebd1f1c…`); `implement-from-prompt` #5 and #6; `review-code` #3–#6 (#5 and #6
have no recorded run — they are the cells SPEC-0056 did not re-measure; #3 is
stale against `2026-11-03T10-10-09--review-code--opencode-go-gpt-6-luna`,
measured under a different model); and `survey-inflight-work` #1–#4. Three
citations are `uncited`: the audit pair on line 20 and the two time-only tokens
on lines 683–684 each match more than one directory. The cited cells that SPEC-0056 re-ran at `skillHash 9a28572…`
(`review-code` #1, #2 and #7–#10) are fresh, and
`write-implementation-prompt` #5 is fresh through its later
`2026-11-06T19-53-34` citation.

Second run (2026-11-11, after the `SPEC-0068` description edit): **66 cited
cells, 54 stale, 3 uncited**. Staleness is not a behavioural signal — it records
that a published cell ran against a skill tree the checkout no longer produces.
Exactly one cell moved because of this spec: `implement-from-prompt` #11 was
fresh against `9147487f…` and is stale against `218f51bb…`, the tree the new
description produces. The other 53 stale cells and the four extra citations
since the first run are the store's own history (the `SPEC-0058` layout move
already left `implement-from-prompt` #1–#10 stale) and are not attributable to
this spec. The draws keep their stored verdicts; this paragraph is dated so the
first run stays history.

Third run (2026-11-11, after the `SPEC-0069` revert): **66 cited cells, 55
stale, 3 uncited**, taken in the primary checkout and reproduced in a clean
worktree after an empty, untracked directory was removed. The delta from the
second reading (54) is **`groom-backlog` #2**, and it is not this spec's: its
recorded tree hash `e2a3b99f…` was computed over a tree that included an empty,
untracked `skills/groom-backlog/references/` directory; with that directory gone
the tree hashes `724bb8ad…` and the cell is stale. `implement-from-prompt` #11
**swaps citation** — control `2026-11-11T06-43-38…` → smoke
`2026-11-11T11-21-09…` — and stays stale in both readings, so it contributes
**zero** to the count; the smoke is routing evidence, not the cell. The three
uncited citations are the second run's unchanged history. The draws keep their
stored verdicts; this paragraph is dated too.

## Iterative corpus provenance

† `#10`'s with-skill count is the SPEC-0066 replay (`node scripts/eval.mjs
inspect <run-dir> --replay`, no draw): the effect-aware `ranpass` resolves `npm
test` through the fixture's `package.json`, so r1 joins r4 as a pass. The control
is unchanged at 5/5 and no other published count moves. The stored artefact still
records the pre-fix `1/5`; the before/after table is in
[`SPEC-0066`](../specs/active/SPEC-0066-a-passing-run-is-an-effect.md#results).

The #12 control is the resumed directory: `r3` stalled post-load on 2026-11-08
and `--resume` re-ran only that slot on 2026-11-11 (one paid draw). The control is
`isolated=unknown`, not `isolated=yes`, because **four of the five draws predate
the enforcement probe** and carry no enforcement record; `r3` was re-run on
2026-11-11 by the build at `8aab5bd` under detector `cf2e2e319d975a5b` — the same
pair that recorded `enforced: true` (seatbelt) in the `2026-11-11T06-41-39` and
`06-43-38` runs that morning — but the re-run's own draw carries no mechanism
record, so `check-eval-run` reports five unproven draws and `findings=0`. The
record is per draw now (`SPEC-0067`): a resumed cell is enforced only when every
behavioural draw proves it, and a draw with no record is unproven, not "not
enforced". That does not weaken the separator: the control's red is an **edit**
(`unchanged **`), so a leak would bias toward passing, not
toward the 0/5. The other seven directories keep their stored verdicts, three of
them exiting 1 for a recorded routing `gate-miss` (#9 r5, #10 r2/r3/r5, #11
r2–r5). Those misses are
a routing failure of the artefact, not a behavioural verdict; no assertion,
fixture or oracle was moved to make a cell separate. The 2026-11-08 draws were
scored under detector `71bfb85a91cd68ab` and `skillHash 0389466e…`; the two
holdout draws and the resumed #12 `r3` under `cf2e2e319d975a5b`. The #12 control
is the one mixed-detector directory (four v2 draws and the re-run `r3`); its
stored `result.json` reports the first draw's detector. `SKILL.md` is
byte-identical; the tree hash moved because `SPEC-0058` removed the in-skill
corpus copy.

## Dispositions

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
(`16-43-33`/`17-11-37`) and #2 (`16-45-46`/`17-28-10`). `process-inbox` #1 now
has a clean control pair from SPEC-0050 (5/5 vs 0/5) and is a separator;
`capture-idea` #1 has one under the v5 replay (5/5 vs 1/5) and is a separator;
`groom-backlog` #2 is the non-discriminator (5/5 vs 5/5), and
`record-decision` #3 is also a non-discriminator.

