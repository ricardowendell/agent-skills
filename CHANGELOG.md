# Changelog

All notable changes to the skills and to the eval harness are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project uses [Semantic Versioning](https://semver.org/). The artifact is the set
of skills plus the evidence that backs them, so a version is a claim: which
skills, which cases, and which published measurements.

## [0.8.1] — 2026-11-13

The status report's claim is measured.

`report-project-status` case 3 was `status: manual`: a reader, not a harness,
checked that a repo without a GitHub remote degrades issues and CI to `unknown`.
It now stages `evals/report-project-status/fixtures/3/` — a plain repo with no
remote, an `AGENTS.md` that names its backlog index, its specs directory and its
gates, one `ready` spec, one backlog task, a two-entry changelog and a sentinel
`src/app.js` — and asserts the surface the skill promises: the skill loads,
`STATUS:` is printed, both `unknown` blocks appear, a `NEXT STEPS` block appears,
no issue number is invented and the sentinel is byte-identical. The "at most
three next steps" cap stays a human `expect:`; no assertion kind counts lines, so
the coverage row says the count is human-checked.

Five draws per arm on 2026-11-13 (`opencode-go/deepseek-v4.1-flash`, detector
`cf2e2e319d975a5b`, both runs `isolated=yes`, `deniedDraws=0`): with the skill
5/5 clean and 4/5 passed, control 5/5 clean and 0/5 passed — a **separator**.
The one red draw is named: r1 loaded the skill and printed every block but
localised the token (`**desconhecido**`), so the literal `unknown` never appears.
The oracle was not edited after the first draw; the fix is a follow-up.

`evals/corpus-baseline.json` moves **once**: case 3's `fieldsSha256` is updated
and the previous value
`b6b89b3baa7aa4ae337938bf750056ec6c7efef6b1abaf471362329c15da17a6` is quoted in
`SPEC-0083` as history. Every other baseline case and fixture still matches, so
the SPEC-0058/0065 move proof holds for the rest of the corpus.

The one-week pilot is instrumented at this cut: user turns from session start to
the first action in status sessions, against the 15-session / 635-turn baseline
of `docs/analysis/skills-from-sessions-2026-11-07.md`, starting 2026-11-13 and
reporting after 2026-11-20 as a follow-up.

What did not change: `skills/report-project-status/SKILL.md`, the runner, the
detector and every other corpus. The rollup drops the `report-project-status`
manual case (1 → 0) and the total's manual column (3 → 2).

## [0.8.0] — 2026-11-13

The branch can be synced safely.

`sync-branch` turns the top uncovered cluster in the session analysis into a
skill. The stub's workflow is kept intact — read the policy, capture the
pre-state, `fetch --prune`, handle a dirty tree, check out, compute the relation,
`ff-only` or rebase/merge, stop at the first conflict, run the gates, report the
delta — and so are its refusals: no `--force`, no `--force-with-lease`, no
`reset --hard`, no `clean -fd`, no branch deletion, no side-picking a conflict,
and no push without an explicit request. `survey-inflight-work` stays the
read-only counterpart; the new description does not reuse its vocabulary.

The corpus has six cases. Four stage real history: `mainPatch` commits on `main`
after the branches are cut (a branch is genuinely behind or diverged) and `dirty`
leaves a file modified and uncommitted. Both keys are additive and optional, with
unit tests in `fixture.test.mjs`; a manifest without them stages exactly as
before. Cases 1–4 assert the deterministic git state (`unchanged` for the files
the sync must not touch), case 2 is the dirty-tree adversarial case and case 3 the
conflict one; cases 5–6 pin the trigger and the near-miss against the read-only
survey. The harness has no "did not run" assertion kind, so "never force-pushes"
and "no `reset --hard`" are observed only by the surviving bytes and the reply;
that gap is recorded in `docs/evals/coverage.md`, not claimed as a measurement.
No paid draw was spent: the six fixtures stage 6/6 with `--level smoke`
(`SPEC-0039`).

## [0.7.7] — 2026-11-11

A verdict that opens with a negation is a rejection, and the corpus reads it that
way.

`SPEC-0078` published `review-code` #4 with its control at 2/5: three of its five
draws wrote `Verdict: not ready` / `Verdict: not implemented`, the judgement was
right, and the closed stance vocabulary had no entry for it (`got NOT`). That is
the last known place where the oracle turned "refused correctly" into "said
nothing" — the same class as `ranpass` scoring the command string.

`stance()` now reads a **stance slot** that opens with `not ready`,
`not implemented`, `not done`, `not mergeable`, `not complete`,
`not approved` or `not approvable` as REJECT. It is anchored, so
`VERDICT: APPROVE — the spec is not ready but ship it` still approves: the rule
can only fire on what the verdict line opens with, never on a later clause. No
form and no blocker was added to the closed vocabulary; the contract comment says
that this rule wins over the last-clause rule for that one shape, and that no
stored line has it.

Replaying **2079 stored transcripts** (2033 matched to a current case) moves
**6 verdict lines in 6 transcripts across 4 run dirs**: five flip a `verdict`
assertion and the sixth sits in a case that has none. `review-code` #4's control
goes **2/5 measured → 5/5 replayed**; the class stays `non-discriminator`, and the
measured count is kept beside the replayed one. One unpublished cell
(`review-code` #2, `2026-11-07`) moves 2/3 → 3/3 and is named, not published.

## [0.7.6] — 2026-11-11

The review-code corpus is measured again at the tree it actually runs, and the
four cells that were history are now evidence.

`SPEC-0056` changed `review-code`'s `SKILL.md` and re-measured cases 8–10 and the
regressions, leaving **3, 4, 5 and 6** at pre-edit evidence. This wave drew them
again on the instrument that came out of 0.7.1–0.7.4 — `ranpass` by effect,
isolation per draw, deterministic tree hash, stance by last clause:

- **#3 (no spec in the repo) — separator, 5/5 vs 0/5.** The control reviews the
  diff anyway, invents an acceptance criterion and issues a stance in all five;
  the skill withholds and asks for the intent in all five.
- **#4 (spec moved after the prompt) — non-discriminator, 5/5 vs 2/5.** Both arms
  reject the moved spec; the control's three reds wrote "Verdict: not ready /
  not implemented", which the closed stance table does not read (`got NOT`). The
  judgement agrees, so the case does not separate — the artifact is named, and
  the vocabulary gap is filed as `TASK-109`.
- **#5/#6 (triggers) — 5/5 each**, one arm by design: a control stages no skill,
  so `skill review-code` and `notskill review-code` would be tautologies.

**30 scored draws, 32 paid attempts, 2 discarded** (two infrastructure retries the
harness re-ran once), **real spend ≥ $0.349374**. All six runs at
`skillHash 9a28572…`, `isolated=yes`, `findings=0`. Staleness drops from 55 to 51
with **zero** `review-code` cells stale.

Historical rows are kept and marked; nothing is deleted. No case, prompt, fixture,
assertion or gate changed.

## [0.7.5] — 2026-11-11

Four backlog decisions closed, none of them by spending a draw.

- **The vocabulary contract matches the matcher (`SPEC-0074`).** `kinds.mjs` said a
  comma was not a clause boundary; after 0.7.4 it is, for every blocker except
  `if`/`unless`/`whether`. The comment now states the rule, and the file that *is*
  the contract no longer contradicts its own tests. Comment-only.
- **The pipeline's task link is documented (`SPEC-0075`).** `pdlc` derives the task
  id from the spec's **slug**, so `SPEC-00NN` is sent to a task that does not
  exist and every dispatch prints "não foi possível marcar". `CONTRIBUTING.md` now
  says why, that the run is not blocked, that only dispatch needs a hand, that
  merge already resolves the declared task (and a manual `Done` would skip
  `pendingSisters`), and that verify needs both an existing id *and* the status
  declared in `backlog/config.yml`.
- **The stall is diagnosed (`SPEC-0076`).** `write-implementation-prompt` #5's four
  stalls all happen after the load and are killed by the 120 s **byte-based**
  watchdog. The decisive witness is a live shell tool silent for **118.5 s**: the
  watchdog kills a child that is working. Prompt excluded, provider undecided with
  its falsifier named, and `#5` stays a trigger case at `loaded 5/5` with no
  behavioural cell. The follow-up is a child heartbeat, never a longer timeout.
- **No visual oracle, and the claim says so (`SPEC-0077`).** The roadmap no longer
  opens the 0.8.0 wave with a browser oracle; the two visual cases rest on a
  **declared human review**, and no release claims measured separation for a
  visual change. The oracle stays a future item with a runner-sized cost.

## [0.7.4] — 2026-11-11

The matcher stops reading a verdict line backwards, and seven sentences stop
claiming more than their artefact. Zero paid draws.

- **The stance is the last clause (`SPEC-0073`).** `stance()` collected every form
  in the line and let REJECT beat APPROVE whatever the order, so
  `reject the alternative; approve the change` read REJECT. It now takes the
  stance from the last clause that names one, with rejection still winning inside
  a clause, and a comma ends a clause — so `AC-2 is not implemented, changes
  requested` scores REJECT instead of nothing. The three conditionals
  (`if`/`unless`/`whether`) are read across the comma, which is what keeps the
  two `SPEC-0062` conditional misses unscored. Across **343 stored transcript
  rows, zero verdicts move** against 0.7.3; against the pre-`SPEC-0062` reader the
  same 17 draws move, and nothing else.
- **Seven sentences corrected (`SPEC-0072`).** The seatbelt is attributed to the
  2026-11-11 invocation that recorded it, not to a re-run draw that carries no
  mechanism record; a quoted `check-eval-run` line matches the tool's own label; a
  comment that described a parenthetical no caller can produce is gone; the `#12`
  aggregation says all five asked through the cancelled `question` tool and four
  restated it in text; the reopening condition is narrowed to where the case
  measures that the work be done; the `#10 r4` quote is complete.

One known residue is filed, not fixed: `kinds.mjs`'s contract comment still says a
comma is not a clause boundary, true now only for the three conditionals
(`TASK-108`, comment-only).

## [0.7.3] — 2026-11-11

Two closes, no behaviour change to a skill and no paid draw.

- **An empty directory is not part of a skill (`SPEC-0071`).** The published tree
  hash hashed directory entries, so an empty, untracked directory changed it and
  `check-staleness` answered 54 or 55 stale depending on the checkout — a number
  that moved with the working directory. The hash now skips a directory only when
  it is physically empty; a directory with content is hashed exactly as before,
  and all 14 skill hashes are identical before and after. `groom-backlog`'s cell
  was the one that flipped in practice, and it is the only one the fix touches —
  by staying put.
- **The body already matches what the skill does (`SPEC-0070`).** The suspicion
  was that "This skill starts from prompt artifacts" derailed bare requests. It
  did not: of the 11 loaded bare-request draws, 7 mention the rule, **0 stopped or
  redirected because of it**, and the 4 that never mention it are clean. The 5
  `#12` draws stop and ask precisely because that is what the case measures.
  `SKILL.md` is byte-identical and the decision carries its reopening condition.

The corpus keeps its counts. `#9` 4/5, `#10` unresolved at 2/5 on routing,
`#11` a non-discriminator, `#12` the only separator at 4/5 vs 0/5.

## [0.7.2] — 2026-11-11

The description hypothesis was tested and failed; it ships reverted.

`SPEC-0068` changed the `implement-from-prompt` description to name three corpus
triggers and published that as a hypothesis. `SPEC-0069` measured it on the worst
position — `#11`, where 1 of 5 skill-arm draws had loaded the skill — with a
three-draw smoke and a hard stop.

**0 of 3 draws loaded the skill** (`skillGate.source: null` in every draw), both
assertions still passed, and the stop rule fired at the first point: no five-plus-
five cell, no control arm, no redraw. Three paid draws, **$0.0189**.

The description is reverted byte-for-byte to the 0.7.0 wording, so the tree is
`9147487f…` again and the stored `#11` cell is cited against the tree it ran on.
No class moves, no count moves, no draw is re-scored. What the smoke shows is
narrow and is published that way: the edited description did not route `#11`. It
does not show that routing got worse — the baseline was already 1 of 5.

The next lever is the body and the menu, not the description: the skill's body
still opens from prompt artifacts while the corpus exercises bare requests
(`TASK-105`). One harness defect surfaced while publishing the reading — an
empty untracked directory changes a skill's tree hash and flips a staleness
count between checkouts — and is filed as `TASK-107`, not fixed here.

## [0.7.1] — 2026-11-11

The patch that fixes the measuring instrument, with zero paid draws.

Three defects that the 0.7.0 corpus surfaced are closed, and the corpus is
re-derived by replay rather than re-measured:

- **`ranpass` and `ran` score the effect, not the command string.** A package
  manager invocation is resolved through the fixture's `package.json` scripts
  before the assertion regex is compared, so `npm test` satisfies the gate that
  the project maps to `node --test`. A masked exit (`; echo "exit: $?"`,
  `| tail`, `|| true`) is read from the status the command printed or from the
  runner's own counters, and a printed `$?` that belongs to a pipe is not
  attributed to the gate. Nothing readable is a red, not a pass. Replaying the
  published cells moves exactly one number: `implement-from-prompt` #10
  with-skill **1/5 → 2/5**; the other 17 cells replay to their published counts,
  and the control stays 5/5.
- **Isolation is recorded per draw.** A resumed cell no longer collapses every
  draw into one claim, and a draw with no record reads as *unrecorded* — not as
  "not enforced" and not as "older than the probe". Across all 355 stored runs
  exactly one cell changes, and only its reason line: `#12` control now reports
  `5 of 5 draws carry no enforcement record` instead of asserting they were
  unenforced. Every `isolated` value and exit code is unchanged.
- **The routing misses are diagnosed.** In 8 of 15 skill-arm draws the skill
  never loaded: 4 of 10 on `#9`/`#10`, 4 of 5 on `#11`. All eight are *offered,
  not chosen* — staged, no `skill` call, no read — and none was a gate rejection
  or a lost context. The `implement-from-prompt` description now names the three
  triggers the corpus exercises (a small change to an existing component; a bug
  fixed with a regression test; one question on an ambiguous request) and still
  does not name the unsafe-request case. **The fix is unverified**: it changes
  `skillHash` to `218f51bb…`, `#11` flips fresh → stale, and proving the routing
  costs draws that this patch does not spend.

Nothing here re-scores a stored draw, lowers a bar, or raises a timeout.

## [0.7.0] — 2026-11-11

The corpus that can see a small change. The release carries two things that only
work together: a harness that measures one draw cheaply and one command deep, and
four frozen cases that answer whether `implement-from-prompt` handles a small
iterative change. Eleven paid draws finished a wave that had been parked since
2026-11-08.

The verdict is uncomfortable and published: the skill separates on exactly one of
the four cases, and it separates in its own favour. It also **fails to load in 8 of 15
skill-arm draws**, which is a routing defect, not a behavioural one — `TASK-101`.
Two harness defects surfaced while measuring and are tracked, not hidden:
`ranpass` scores the command string instead of the effect (`TASK-102`), and
`--resume` downgrades a legacy cell's isolation record (`TASK-103`).

### Changed

- **The quick-refine spike closes without a skill (SPEC-0035, TASK-57).** F0
  stopped at the corpus: there is no behavioural loss to extend on. #12 separates
  in the incumbent's favour (4/5 vs 0/5), #9 and #11 are non-discriminators, and
  #10 is `unresolved` on the routing defect (`TASK-101`) plus the `ranpass`
  matcher artifact (`TASK-102`), not on behaviour. Verdict **`do not add skill`**
  — and no `implement-from-prompt` extension either, since there is no clause to
  add. The real defect is that the skill does not load (4 of 10 `#9`/`#10`
  skill-arm draws, 4 of 5 `#11`), which a new lightweight skill would inherit
  unchanged. Zero draws, no skill edit.
- **The iterative corpus is measured (SPEC-0034, TASK-56).** The wave resumed
  after three days parked: 11 paid draws finished it (one re-run of the stalled
  `#12` control draw, then the frozen holdout `#11` on both arms). Four cases, two
  arms, five draws each. **#12 (ambiguous scope) is the only separator and it
  separates in the incumbent's favour — 4/5 vs 0/5, the control always edits a
  file the request never resolved.** #9 (localized change) and #11 (unsafe
  request, the holdout) are non-discriminators; #10 (functional fix) is
  `unresolved` on a routing defect plus a literal matcher artifact, not a
  behavioural gap. The real finding is routing: the skill never loaded in 4 of the
  10 `#9`/`#10` skill-arm draws and in 4 of 5 `#11` draws. Two harness defects
  surfaced and are tracked separately — `ranpass` scores the command string
  rather than the effect (`TASK-102`) and `--resume` downgrades a legacy cell's
  isolation record (`TASK-103`).
- **The parked corpus comes back (SPEC-0065, TASK-56).** The four iterative cases
  and their 23 fixture files were recovered byte-identically from
  `parked/SPEC-0034-iterative-corpus`: cases 9–12 land in
  `evals/implement-from-prompt/cases.md` and the trees in
  `evals/implement-from-prompt/fixtures/`, with all four `treeHash` values equal
  to the tag's. `corpus.test.mjs` moved from whole-corpus equality to subset
  semantics — a record of a past state cannot constrain every future state — so
  the corpus grew from 97 to 101 cases (98 runnable, 3 manual) without weakening
  the move proof. The holdout #11 was not read.
- **`--resume` re-runs the draws the harness discarded (SPEC-0064, TASK-100).** A
  stored draw is reused only when it is a result: `passed`, `failed`, `unscored`
  without infrastructure, or `contaminated`. An `unscored` draw with
  `infrastructure: true` — a stall, a timeout or a provider abort — was discarded
  by the harness and is not evidence, so resuming the SPEC-0034 control wave now
  repeats `#12 r3` instead of replaying the stall, and the case can reach a
  complete cell. The resumed run prints
  `resume: re-running N infrastructure draw(s) (#<case> r<i>, <reason>)`, or
  `resume: reusing N draw(s), 0 re-run` when it reused every slot. No status
  value, contamination rule or watchdog changed; no paid draw was spent.

- **One eval CLI, one decision (SPEC-0060, TASK-99).** `scripts/run-evals.mjs`
  (921 lines) and `scripts/replay-evals.mjs` (481) are deleted; `scripts/eval.mjs`
  is the only entry point, with `list`, `check`, `run`, `compare` and `inspect`.
  Defaults now follow the cost of the question: `run` is one draw and `compare`
  is three per arm, with 1–3 labelled **screening** and 5+ **evidence**; the
  scorecard prints the numerator and denominator per arm on one screen and
  compares rates, never numerators (`5/5` and `4/4` are both 100%), and `--stop`
  reports the draws that actually ran. `check` parses, validates,
  resolves and dry-stages every fixture without a model. `compare` reuses an arm
  only when model+provider, prompt hash, fixture hash, assertion/grading hash,
  skill hash and the isolation contract all match, and prints `reused <dir>` or
  `ran <dir>` for each; `--refresh` forces a rerun and `--against <ref>` pins the
  baseline by commit, while a stopped-early, short or judged arm is never reused.
  `compare <run-dir-a> <run-dir-b>` restores the whole-run regression gate and
  exits 1 on any regressed or missing cell. `--no-skill` became `--arm without`;
  `--baseline`,
  `--save-baseline`, `--shared`, `--i-know` and `--no-isolate` are gone rather
  than accepted and ignored. `docs/pipeline.md`'s `selftest:` names the new
  command, so that policy edit is in this change and needs the human gate at
  merge. No paid draw was spent.

- **The `review-code` matrix covers the ten cases and separates measured from
  replayed (SPEC-0063, TASK-98).** `docs/evals/review-code-matrix.md` now has a
  row for every case 1–10 with its arm, run directory, clean draws and class,
  and two labelled columns: `measured` is what the assertions said when the
  draws ran, `replayed` is the same stored transcripts read under SPEC-0062's
  closed stance table, attributed to SPEC-0062 and never averaged with the
  measured one. The header names the model, the detector at measurement time,
  the seatbelt boundary, the repository state and the two 2026-11-10 waves.
  Classes were copied from `coverage.md` for cases 1, 2 and 7–10 and derived for
  cases 3 and 4, which carry no published class and are marked `(derived — no
  class published)` in every class cell: cases 1, 8, 9 and 10 are
  token/contract separators after the re-judge, 4 is one by derivation, 7 is the
  separator holdout, 2 is a non-discriminator, 3 separates on the judgement, and
  cases 5 and 6 are
  trigger cases with no arm cell. The old header's 15/15 vs 0/15 aggregate and
  its reading that case 1 "separates" were corrected against `coverage.md`. The
  replayed column carries the cell, not the token, so cases 1 and 10 read
  `measured == replayed` while their prose records the token moving. No draw was
  spent; every cited run directory resolves.
- **The verdict vocabulary is closed and the rates are re-judged (SPEC-0062,
  TASK-91).** The `verdict` assertion now maps a stance against a published table
  of 55 forms (18 approve, 30 reject, 7 withheld) and 26 blockers written the way
  a reviewer writes them, with negation scoped to the clause and a rejection
  winning over an approval in the same line. A form not on the list still misses.
  Re-judging the stored `review-code` draws moved exactly 17 of 315
  verdict-bearing transcripts, all false → true, and no measured cell changed:
  `coverage.md` gains a `replayed` column beside the historical one. Under the
  corrected reading cases 1, 2, 8, 9 and 10 separate on the contract only, not on
  the engineering judgement, and the table says so. No draw was spent.
- **`AGENTS.md` is a routing contract (SPEC-0061, TASK-95).** The root file went
  from 39 to 44 lines and now carries only what an agent needs on the first turn:
  purpose, the four documents that are authoritative, the working agreement, the
  operational cycle as one line of commands, and what to check before reporting.
  The PDLC lifecycle graph and the pdlc version caveats moved out, and
  `docs/pipeline.md` is named as the only home of the policy. The bootstrap
  template halved, from 102 to 50 lines: no `[tech stack]` placeholder, no
  universal `just` block, no duplicated workflow body, every command conditional
  on the project. `references/typescript.md` lost 207 lines of measurement and
  kept every decision. The no-placeholder and command-provenance checks run on
  the rendered document, with mutation tests proving they fail.
- **The eval corpus leaves the skill (SPEC-0058, TASK-94).** The 14
  `skills/<id>/references/evals.md` files moved to `evals/<id>/cases.md` and the
  13 fixture trees to `evals/<id>/fixtures/<n>/`, with history following via
  `git mv`. Discovery reads that layout only: `parse.mjs` and `fixture.mjs` no
  longer resolve `references/evals*`, `validate-skills.mjs` fails on any stray
  eval path inside a skill, and `speccheck` accepts a trailing-slash `files:`
  entry as a subtree. `emit-promptfoo.mjs` and `promptfoo/provider.mjs` were
  deleted; a skill now packages runtime references only.
- **The speculative surface is deleted and `check-evidence` is narrowed
  (SPEC-0059, TASK-96).** `scripts/audit-provider-aborts.mjs`,
  `provider-audit.mjs` and its test (280 lines) went: provider aborts are
  classified per draw and recorded in `execution.error`, so the
  stored-transcript sweep answered a question the runner already answers.
  `harness-health.mjs`, `health.mjs`, its test and `docs/evals/harness-health.md`
  (1,622 lines) went with the release report they served. `check-evidence` keeps
  its path, its command name and its exit contract, but it reads only the
  publication — `docs/evals/coverage.md`, `discriminating-cases.md` and the
  matrix files — and a citation must name a run directory exactly: the
  repository-wide markdown sweep and the 100 dirty-marker warnings are gone, so
  the next real finding is visible. `docs/pipeline.md` is
  untouched and its `selftest` line still runs `check-evidence`.

### Added

- **Architecture judgement and deterministic slots for `audit-code-quality`
  (SPEC-0055, TASK-79).** The skill now reads
  `references/architecture.md` when a finding turns on a module boundary — deep
  vs shallow interface, leaked invariants, distributed responsibility, the
  deletion test, seams, dependency direction and change cost — and probes the
  deterministic slots in `references/deterministic-checks.md` with a
  detect/run/record/classify protocol. A slot with no declared tool or project
  script is `unmeasured`, never "clean"; the audit never installs, upgrades or
  configures a scanner, uses no network and no `npx --yes`. Case 8 uses local
  stubs that emit a known cycle and a known unused file; case 9 stages fixture 6
  via `evals/9/git.json` without the stubs and must say `unmeasured`.
  `SKILL.md` keeps its description and trigger.
- **Risk-proportional review and diff-scoped deterministic slots for
  `review-code` (SPEC-0056, TASK-80).** `SKILL.md` keeps the spec hash and the AC
  walk first and adds a fast/deep risk profile: the fast profile checks
  correctness, tests, secrets and scope; the deep profile is chosen only when the
  diff touches a public interface, auth/security, persistence,
  schema/migration, concurrency or project policy. Only the dimensions the diff
  touches are deepened, so no checklist is scored. `references/deterministic-checks.md`
  adds a diff-scoped registry (semgrep baseline, gitleaks, osv-scanner,
  actionlint/zizmor, shellcheck, knip/dependency-cruiser filtered to the changed
  files, and the project's type/test/lint commands) with the
  detect/run/record/classify protocol. An absent or broken tool is `unverified`,
  never clean; the review never installs, upgrades or configures a scanner and
  never uses `npx --yes`. Cases 8–10 are new. The description and trigger are
  unchanged.

### Changed

- **Loud staging, a clock seam and a staleness report (SPEC-0057, TASK-93).**
  A `git.json` whose `base` does not resolve now throws at staging, naming the
  case, the resolved path and the fixture directory, and `--list --check`
  reports the same pointer without staging anything. Every regex-bearing
  assertion must compile through `safeRegex`, and an oracle check inspects every
  fixture: an `unchanged`/`changed` target with no staged match is an error,
  while a `file`/`dir`/`filematch` target the draw must create is a warning
  printed by `--list --check`. `runAgent` accepts injectable `now`,
  `setTimeout` and `clearTimeout` — no CLI flag reaches them — which drops
  `node --test scripts/lib/evals/*.test.mjs` from 4.75 s to 1.81–1.91 s while
  keeping one real-clock watchdog integration test. Every draw now records
  `skillHashes` and the resolved `governs:` list; `skillHash` still carries the
  tree hash, and `--resume` defaults the new maps on a manifest written before
  this change. New `node scripts/check-staleness.mjs` compares the cited cells'
  governed hashes with the working tree, resolves bare timestamps and bare
  `HH-MM-SS` citations only by a unique match, and names what it cannot verify
  (first run: 17 stale cells and 3 uncited citations, including `review-code`
  #3–#6 and `groom-backlog` #1/#3/#4). It is report-only: the default exits 0,
  `--check` exits 1, and promoting it to a gate is a follow-up.

### Measured

- **SPEC-0056 wave, five draws per arm on `agentworks/deepseek-v4-1-flash`.**
  Cases 8, 9 and 10 plus regressions 1, 2 and 7; every cited cell is
  `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`
  under detector v6. Cases 8 and 9 are **token/contract separators**: both arms
  reject the interface break / injection in prose 5/5, but the control scores
  0/5 and 3/5 because the `verdict` stance vocabulary misses `changes
  requested`/`needs changes` (and, in #9, r3/r4 emit prose after the label).
  They are non-discriminators on the substantive judgement. Case 10's fixed skill
  arm is **5/5**; its control is 5/5 clean and **0/5** passed — it approves the
  same correct retry in prose 5/5 but emits no `VERDICT: APPROVE` and no `Not
  verified`, so #10 is the same token/contract separator and a non-discriminator
  on judgement. Regression #1 is the same kind of token/contract separator
  (**5/5 vs 0/5**; the control approves in prose 5/5 but misses `Not verified`
  in 5/5 and the token in r1/r4), #2 stays a **non-discriminator** (4/5 vs
  4/5), and the #7 holdout is **5/5 vs 0/5**. Case
  10's first skill arm (5 draws) correctly blocked a fixture whose tests did not
  prove AC-2's delay or AC-3's defaults/non-integer inputs; the fixture was
  strengthened and the arm re-run, with no `expect:` or assertion changed. The
  wave spent 65 paid draws: 55 evidence + 5 invalid setup + 5 case-10 control,
  with the human approving the extra 5 above the original 60 ceiling. Decisions: `keep` for #8, #9, #1, #2 and #7; `change` for #10 (fixture
  strengthened) and keep it. #3–#6 were not re-measured at `skillHash 9a28572…`;
  their cells are historical. Run directories are in `docs/evals/coverage.md`.
- **SPEC-0055 wave, five draws per arm on `agentworks/deepseek-v4-1-flash`.**
  Cases 5–9 were run with and without the skill; every published cell is
  `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`
  under detector v6. The skill arms passed 5/5, 4/5, 4/5, 3/5 and 4/5; every
  control passed 0/5. Case 8's `ran dependency-cruiser`, `ran knip`, cycle and
  unused-file assertions passed in both arms; case 9 is the classification
  separator (the skill says `unmeasured` 5/5, the control 0/5). The only
  skill-arm red is the strict `SCOPE:` line — five draws used a `## SCOPE`
  heading — and it stays. Decisions: `keep` for all five. One invalid case-9
  attempt (empty fixture, r3 stalled) is published and not counted; the wave
  spent 55 draws, not 50. Run directories are in `docs/evals/coverage.md`.

## [0.6.3] — 2026-11-10

The stack is chosen with numbers and the control arm is enforced. The
TypeScript/Node default is decided by a reproducible matrix, and the eval
detector can tell a refused corpus read from a leak. The control arm is denied
the installed skills and the eval store, so a behavioural cell can finally
separate two arms; the release itself spent no new paid draw.

### Added

- **The eval store is an answer key (SPEC-0052, TASK-77).** `corpusRoots` now
  denies `<home>/.local/share/opencode/evals` under the same seatbelt boundary
  as the installed skill roots: every answer key (`<skill>/<n>.md`), every prior
  transcript and result, `baseline.json` and `last-run.json`. The root is
  resolved through `realpath` because the throwaway home inherits the real
  `.local` as a symlink, and the deny is scoped to `evals` — `auth.json` and the
  rest of `.local` stay reachable. The detector gained its own rule (v6,
  `9149d6ab1ca57343`): a store hit is a `leak` (answer key), never `host`, and it
  is checked through the isolated home's `.local` link; without enforcement it is
  a leak, under enforcement it is `denied` unless the call returned that path's
  content, so the SPEC-0051 rule stays ahead of it. Proven by replay, not a new
  draw: `groom-backlog` #2's control r2 is a store leak, so the control is 4/5
  clean with 4/4 passed and the published 4/4 evidentiary / non-discriminator row
  holds; `bootstrap-project-harness` #19's control is 4/5 clean with 0/4 passed
  over the clean base (separator unchanged, 5/5 vs 0/4). The store-wide re-judge
  found eight store-affected draws: five moved clean → `leak` and three were
  already dirty and gained a store hit without a verdict change. Every verdict
  change is a store read, no draw gained a non-store hit, and nothing else
  became dirty. Source:
  `docs/specs/SPEC-0052-the-eval-store-is-an-answer-key.md`.
- **Content counts only for the path it names (SPEC-0051, TASK-76).** The eval
  detector now credits a corpus hit with content only when the call returned
  **that path's** content (detector v5, `def64b2d6a1baa6e`). A non-shell result
  carrying a body counts; a shell call counts only through an output line naming
  the path (or a child) with no error marker and no ` -> ` symlink arrow. Sibling
  output, `No such file or directory`, a permission marker and an `ls -l` arrow
  are not a read of the hit path: under enforcement the residual is `denied`, and
  without enforcement the v4 rule is unchanged. This fixes two false positives
  SPEC-0050's control wave published as leaks — `capture-idea` #1 `r1` (the
  skills listing was empty; the body came from another file and a symlink line)
  and `groom-backlog` #2 `r2` (`cat …/groom/SKILL.md` returned `No such file or
  directory`) — both of which had recorded their assertions. Proven by replay, not
  by a new draw: `2026-11-09T12-41-57--capture-idea--…--without-skill` and
  `2026-11-09T12-55-35--groom-backlog--…--without-skill` go from
  `findings=1`/`findings=2` and `isolated=no` to five clean draws each with
  `isolated=yes`; the cell verdicts are SPEC-0050's. Source:
  `docs/specs/SPEC-0051-content-counts-only-for-the-path-it-names.md`.
- **The four remaining blocked cells are measured under the enforced boundary
  (SPEC-0050, TASK-75).** Five draws per arm, `agentworks/deepseek-v4-1-flash`;
  every manifest records `params.isolation.enforced: true`. Three cells separate:
  `capture-idea` #1 (5/5 vs 1/5 on `filematch docs/inbox/*.md status:
  unprocessed`), `process-inbox` #1 (5/5 vs 0/5 on `unchanged
  docs/inbox/2026-01-01-digest-email.md` and `nodir docs/backlog`) and
  `write-implementation-prompt` #1 (5/5 vs 0/5 on
  `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:`). One is a
  **non-discriminator**: `groom-backlog` #2 (5/5 vs 5/5). One `groom-backlog`
  control draw read prior run artefacts in the eval store (answer key and prior
  transcripts) and is excluded from the evidentiary base; the other four control
  draws pass, so the verdict stands, and **TASK-77** owns the boundary/detector
  fix. The `capture-idea` and `groom-backlog` controls were measured under
  detector v4 and re-judged read-only under v5 (`def64b2d6a1baa6e`, SPEC-0051):
  their stored artefacts still record the v4 contamination, while the
  `replay-evals --leaks` result — five clean draws each, `isolated=yes`,
  `deniedDraws=2` — is the evidence.
  `bootstrap-project-harness` #19 is cited from SPEC-0047, not re-run: 5/5 vs
  1/5, a separator on the rule, with the same artefact-vs-replay caveat. No rate
  is recomputed and no oracle, fixture or `why:` line changed. Source:
  `docs/specs/SPEC-0050-measure-the-four-remaining-cells.md`.
- **A corpus hit under enforcement is a denied attempt (SPEC-0049, TASK-74).**
  The eval detector now receives the run's enforcement state, and under
  `params.isolation.enforced: true` a corpus hit that returned nothing for the
  path and carries no denial naming it is `denied`, not `leak`/`host` (detector
  v4, `d3e95ef948f983b7`). This is the suppressed-probe shape SPEC-0047's
  resumed control measured: `ls /Users/wendell/.agents/skills 2>/dev/null`
  discarded the only line that would name the refusal, and v3 published a leak.
  The boundary and its canary prove the read could not succeed; the detector
  classifies attempts. A call that demonstrably returned the path's content — a
  non-shell result, or a shell output line naming the path outside a denial — is
  still a leak, and without enforcement the v3 rule is unchanged. In the same
  change, `check-eval-run` decides `isolated` by the detector's `host-reads`
  capability rather than by digest equality, so it agrees with `check-evidence`
  about the same run: a clean v2 run is `isolated=yes`, v1 and an unknown digest
  stay `unknown`. Proven by replay, not by a new draw: the control
  `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` goes from
  `leak`/`isolated=no` to five clean draws with `deniedDraws=1` and
  `isolated=yes`, and the v2 with-skill run
  `2026-11-09T07-37-44--bootstrap-project-harness--…` goes from
  `isolated=unknown` to `isolated=yes` with zero findings. Source:
  `docs/specs/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md`.
- **A denied read is not a leak (SPEC-0048, TASK-73).** The eval detector now
  classifies a corpus path whose call output shows a permission denial for that
  path as `denied` instead of `leak`/`host` (detector v3,
  `d8478beab04a4e3e`). `contaminate` ignores `denied` and records the count, so a
  control draw that probed the installed corpus and was refused by SPEC-0046's
  seatbelt boundary is clean and scorable; `check-eval-run` prints `deniedDraws=N`
  without making it a finding, and `isolated=yes` still requires zero
  `leak`/`host`. A successful read of the same path remains a leak. The change is
  proven by replay, not by a new draw: SPEC-0047's control
  `2026-11-09T07-52-50--bootstrap-project-harness--…--without-skill` goes from
  `skillLeaks=3 hostReads=1 contaminated=3` to zero leaks/hosts, three denied
  draws and five clean draws, while the with-skill run stays clean. Re-judging is
  `node scripts/replay-evals.mjs --leaks <run-dir>`. Source:
  `docs/specs/SPEC-0048-a-denied-read-is-not-a-leak.md`.
- **The control arm is denied the installed corpus (SPEC-0046, TASK-71).** The
  eval runner now probes whether the host can deny corpus reads below the tool
  layer, and on macOS launches the child under a seatbelt profile that denies the
  installed skill roots and every host root it already records, applied to both
  arms: `isolated=yes` requires the boundary, so limiting it to `--no-skill`
  would force every with-skill run to `unknown`. The with-skill behaviour under
  the sandbox is unmeasured (no draw was run). The answer is
  written to the run manifest as `params.isolation = { enforced, mechanism,
  reason }`; a host without the boundary writes an explicit unenforced marker and
  the summary reports `isolated=unknown`, never `yes`. A deterministic canary
  reads a known corpus path under the wrapper (must fail) and without it (must
  succeed), so the layer cannot pass vacuously. Manifests written before this
  change carry no record and keep the old `isolated=yes` rule. No model call: the
  probe is a PATH lookup and the canary is a local read. Source:
  `docs/specs/SPEC-0046-deny-control-arm-corpus.md`.
- **`report-project-status`** — one-page project status: git/PR state delegated
  to `survey-inflight-work`, open GitHub issues, backlog and spec readiness, CI
  health, and at most three next steps. Read-only. Three trigger and near-miss
  cases plus one manual behavioural case; no fixture yet. The trigger boundary
  against `survey-inflight-work` is pinned by a near-miss case on each side, and
  `pdlc plan` is the authoritative backlog order. Source:
  `docs/analysis/skills-from-sessions-2026-11-07.md`. Also exposes `/status`.
- **The stack review is measured (SPEC-0045).** `bootstrap-project-harness` now
  ships behavioural cases and fixtures for the empty-repo default, preservation
  of an existing Bun, pnpm, ESLint and Biome project and an npm workspace, and
  refusal of an ambiguous stack. A template/reference parity test fails a
  deliberate divergence between `templates/ts/` and
  `references/typescript.md`. The default stays Node 24 + npm + TypeScript 7 +
  Oxlint + Prettier + `node:test`; the supported alternatives are pnpm, Bun,
  Biome, ESLint + typescript-eslint, Vitest, Oxfmt and tsdown. The with-skill
  draws carry the claim; the control arm still reads the real install and host
  corpus, so every behavioural cell is published as **unresolved**, not a
  separator. Run directories and per-cell counts are in
  `docs/evals/coverage.md` and the spec's Results; this entry states the claim,
  not a new measurement. The control was later unlocked by `SPEC-0046`–`SPEC-0052`;
  the SPEC-0050 entry re-publishes the cells, and `bootstrap-project-harness`
  #19 became a separator (5/5 vs 0/4 over the clean base).

## [0.6.2] — 2026-11-07

A reliability patch: an aborted run is never clean, a dead run loses no paid
draw, and a stored transcript can be audited for the abort the old result
dropped. Zero agent draws.

### Added

- **TASK-52 — a provider abort is infrastructure.** `provider.go-limit`,
  `provider.rate-limit` and `provider.transport` are classified before behaviour,
  recorded in `execution.error`, and a run whose draws all aborted no longer
  prints `isolated=yes`.
- **TASK-38 — no paid draw is lost.** Every completed draw is written to
  `cases/<case>/draws/r<i>.json` before the next one starts; `--resume <dir>`
  reopens a dead run and runs only the missing indexes. An auth probe over
  `opencode auth list`/`models` fails fast and names the provider before the first
  paid draw.
- **TASK-54 — the stored transcripts are audited.** `scripts/audit-provider-aborts.mjs`
  lists every transcript with a `provider.*` abort and says whether its result
  recorded it, classified it as infrastructure, or retried. The 0.6.2 scan found
  14 unrecorded aborts in 1413 transcripts; the cited lines are marked in
  `docs/evals/provider-aborts.md`.

### Changed

- **TASK-39 — a direct read is a load.** For a behavioural case, reading the
  staged `SKILL.md` counts as a load and `skillGate.source` records `tool` vs
  `read`; a trigger case keeps the `skill` tool call as its routing signal, and a
  read outside the scratch is never a load.
- **TASK-40 — composite expectations can cite two facts.** The judge prompt
  allows two verbatim passages joined by ` | `; `verifyEvidence` still rejects a
  fabricated join. `implement-from-prompt` #1's reading expectation is sharpened
  to "before the first edit" and proved on the stored `r5` draw, not a new one.
- **TASK-53 — Done tasks with open ACs are reconciled.** TASK-3, TASK-17,
  TASK-24 and TASK-27 now name the evidence or the reason an AC stays open;
  TASK-35 can archive without hiding one.
- **TASK-36 — the pdlc task binding is documented.** pdlc 1.2.0 resolves
  `dispatch`/`verify` by the spec slug (`SPEC-NNNN`), not the frontmatter `task:`;
  the cause and the one-line upstream fix are in the task, and the manual status
  workaround is in `AGENTS.md`. The upstream test cycle is still blocked.

### Notes

- **TASK-35 deferred.** The Done tasks are reconciled but not yet moved to
  `backlog/archive/tasks/`; the archive is its own chore.
- Gates: `lint`, `selftest` (365 eval tests, 17 bootstrap, sensor parity 2/2),
  `check-evidence` with 0 errors, and `pdlc preflight` over 19 specs. Evals are
  local evidence, not a CI gate; this release spent no draw.

## [0.6.1] — 2026-11-07

A correction release: the first measurement attempt was already in the store,
and the documentation now uses it.

### Added

- **The discriminating set for issue #5** (`docs/evals/discriminating-cases.md`):
  three held-out separators at n=5 — `implement-from-prompt` #1 (5/5 vs 0/5,
  `status: implemented`), #8 (5/5 vs 0/5, `nofile src/format.js`) and
  `review-code` #7 (5/5 vs 0/5, `verdict REJECT`). All six runs are
  `findings=0 isolated=yes`. `review-code` #7 is the holdout, frozen at
  `5fe56fc` before the first draw. `write-implementation-prompt` #2 also
  separates (5/5 vs 0/5) and is listed beside the held-out three.
- **TASK-52**: a provider abort could pass `check-eval-run` as a clean run.

### Fixed

- **SPEC-0031's first attempt was uncited.** Ten default-model v2 runs (50
  repetitions) were left in the store when the second pass started. Including
  them makes `write-implementation-prompt` #2 a clean separator (5/5 vs 0/5)
  and confirms #4 as a non-discriminator (4/4 valid passed). `process-inbox` #1
  stays unresolved: its `03-08-51` control died on the provider go-limit in all
  five reps, and its green assertions are an abort artifact.
- **The draw budget is stated honestly.** The wave scheduled 86 repetitions,
  82 produced model work and 4 made no model call — 2 over the 80 cap. The
  original Results counted only 36. AC-5 is not met; the overrun is published,
  not redefined.
- **The stale `pending SPEC-0031` markers** in both matrices, `coverage.md` and
  the forward references in SPEC-0028/0030 now carry the measured outcome.

### Measured

- **30 draws** for the issue #5 set: three separators, five draws per arm, both
  arms clean, one holdout.
- **Health delta** at `2026-11-07T18:45:51Z`: 279 runs, 1,362 draws; eligible
  **66.9%**, strict **72.9%**. The strict base grew by 131 draws (75 passed, 56
  failed); the failures are control arms by design plus the pdlc-orca pilot.

### Known gaps

- **Three cells remain `unresolved`**: `capture-idea` #1, `process-inbox` #1 and
  `write-implementation-prompt` #1. Their controls never reached five valid
  clean draws.
- **The holdout's control is not uniform**: `review-code` #7 fails the verdict
  token 5/5, but 3/5 approve despite the red gate and 2/5 only miss the token.
- **Provider aborts are not classified as infrastructure** (TASK-52):
  `go-limit`, `rate-limit` and `overloaded` can leave a run with trivially green
  assertions and `isolated=yes`.
- **The pdlc-orca pilot** (36 draws) is in the health window; the skill was
  removed before this release and is not part of the artifact.

## [0.6.0] — 2026-11-07

The harness stops reporting what it cannot see, and two mechanical review
classes move into code.

### Added

- **A detector that sees the host corpus** (`SPEC-0028`): `leak.mjs` classifies
  reads under the host roots as `host`, so "no skill leak" is no longer read as
  "isolated". `check-eval-run` prints `skillLeaks=N hostReads=N
  isolated=yes|no|unknown`; `yes` requires a v2 run and a recorded isolated
  mode. `replay-evals --leaks` re-judges stored transcripts and writes nothing.
- **`stage:` for cross-skill routing** (`SPEC-0029`): a case names the sibling
  skill it expects to load and the runner stages it, so `capture-idea #3` and
  `process-inbox #3` measure the declared route instead of failing by
  construction.
- **`spec-check` and `check-evidence`** (`SPEC-0032`): the spec contract
  (`files:` vs the diff, `task:`, dependency links, placeholders) and every run
  directory cited in `docs/evals/` are checked in code. `check-evidence` runs in
  `selftest` and the pre-commit hook; `spec-check` runs in CI for changed specs.
- **`docs/integrations/opencode.md`**: which paths the kit owns and which ones
  the machine links.

### Changed

- **The load canary is 12 draws, not "up to 12".** `CONTRIBUTING.md` runs it
  with `--stop 12/0`, because the default `5/3` stop cuts a clean canary at
  eight. `check-eval-run` prints `warn stopped-early … reps=N of requested 12`,
  so a short canary cannot be published as 12/12 (`TASK-47`).
- **`commands/` is canonical and the machine links it** (`TASK-48`):
  `~/.config/opencode/commands` is one directory symlink, not a copy. A command
  added to the repo appears without an install step.
- **`write-implementation-prompt` draws the boundary** (`SPEC-0030`): it
  produces an executable prompt; a summary or an explanation is not its job.

### Fixed

- **A control run that reads the host is dirty, not clean** (`SPEC-0028`). The
  26 cells whose verdict changed under the host rules are published as
  invalidated, not re-scored; the v2 replay of the 0.5.0 store is in
  `docs/evals/coverage.md`.
- **`#6` no longer loads on a summary request** (`SPEC-0030`): 5/5 clean in
  `2026-11-06T20-12-15--write-implementation-prompt`, against 4/5 in an earlier
  run. Improved, not proven deterministic.
- **A stopped run is named.** `check-eval-run` reports a case that ran fewer
  draws than the manifest requested, instead of letting the summary hide the
  denominator.
- **`spec-check` survives non-ASCII paths**: `git diff -z` with
  `core.quotepath=false`.
- **CI runs the spec contract only on pull requests.** A push to `main` carries
  the cumulative local fan-in, so the step compared merged specs with later
  changes and failed the first 0.6.0 build; the branch point is the only base a
  `files:` list is written against.

### Measured

- **51 draws**: 10 for the staged routing pair, 40 for the near-miss/trigger
  re-measure and 1 control draw.
  - `capture-idea #3` and `process-inbox #3` are **5/5** with the sibling
    staged, replacing a 0/N by construction.
  - `#6` is 5/5 clean in one run; across three runs it is 5/5, 5/5 and 4/5.
  - `#5` loaded **10/10**; four of the ten trigger draws stalled after the
    load, so there is no stall-free five-draw cell.
  - The re-measured with-skill cells `#1`, `#2` and `#4` are 5/5 clean.

### Known gaps

- **The `#5` stall is provider-side and follows the load** (TASK-50): event
  gaps of 27.2 s to 355.0 s, one retry each. A stall-free run is not yet
  measured.
- **Five controls still cannot carry a rate.** `capture-idea #1`,
  `process-inbox #1` and `write-implementation-prompt #1` are `unresolved`;
  `write-implementation-prompt #2` and `#4` are pending SPEC-0031. The routing
  cells are triggers, so they have no control arm by design.
- **pdlc still records one duration per cycle.** Implementation and review
  cannot be separated; the phase markers stay in PDLC-83.
- **`#3` of `write-implementation-prompt` stays `manual`**: a 4/5 historical
  split, not re-run.

## [0.5.0] — 2026-11-06

Coverage closes: every skill in the repo now has evidence or a written reason.

### Added

- **The `write-implementation-prompt` matrix** (`SPEC-0025`) and **the
  `pipeline-bookends` matrix** (`SPEC-0026`) — the last four unmeasured skills.
- **`unresolved` as a published classification**: a case whose control arm never
  produced five clean draws in one run. The raw counts are published; no rate is
  taken from a rejected run.

### Changed

- **`check-sensor-parity` names the interpreter it used** (`python 3.15
  (/opt/homebrew/bin/python3)`), resolved from `PDLC_PYTHON`, `python3`,
  `python` and the absolute fallbacks, with a version floor of 3.8.

### Fixed

- **A missing interpreter no longer reads as a sensor divergence.** The check
  says `no usable Python 3 interpreter found`, lists the candidates and exits 1,
  instead of printing `FAIL clean` and `undefinedundefined`.
  `PDLC_ALLOW_MISSING_PYTHON=1` turns it into a named skip; the default stays
  closed, and the verdict on a machine with Python is byte-identical.

### Measured

- **286 draws, no judge.** Of nine behavioural cells: three separators, two
  non-discriminators, three unresolved and one manual (a 4/5 split).
  - `write-implementation-prompt` #2 separates 5/5 vs **0/5** clean.
  - `record-decision` #1 separates 4/5 vs 1/5; #2 separates 4/5 vs **0/5**.
  - `write-implementation-prompt` #4 (5/5 both arms) and `record-decision` #3
    (4/5 vs 5/5) do not separate.
- **Six routing triggers**: four routed cleanly, #6 is unstable, and the two
  cross-skill cases cannot pass by construction.
- **Health pass** at `2026-11-06T20:52:31Z`: the eligible rate is unchanged at
  **67.2%**. The strict base went from 90 to 338 draws and its rate from 96.7% to
  75.7%: this is the first wave with full provenance, and its control arms fail
  by design. That is a mix change, not a regression.

### Known gaps

- **Three cells are `unresolved`, not separated.** The control arm can still read
  the host install and, in one case, the host `docs/` corpus, which the leak
  detector does not classify (TASK-43).
- **`capture-idea` #3 and `process-inbox` #3 cannot pass** until staging can copy
  a sibling skill (TASK-44).
- **`write-implementation-prompt` #6 loads the skill on a summary request**, and
  #5 stalls in three of five trigger runs (TASK-45).
- **Cost is still unmeasured**: `cost` is 0 in 829 of 848 draws.

## [0.4.1] — 2026-11-06

The per-release retro stopped being a promise and got a number.

### Added

- **`harness-health`** — a read-only report over the eval store and
  `.pdlc/runs.json`: draws and outcomes, wall time, tokens, judge disagreements,
  provenance, pdlc retries and red gates. `--json`, `--since`, `--until`; the
  output is deterministic over a bounded snapshot.
- **The 0.4.0 baseline** in `docs/evals/harness-health.md` (173 runs, 844 draws),
  reproducible with `--until 2026-11-06T16:12:50Z`.
- **The loop** in `CONTRIBUTING.md`: per release, before the CHANGELOG, at most
  three findings and one spec.

### Changed

- **"Clean" is split.** `Eligible` means completed runs without contamination or
  infrastructure; `Strict` adds a `checkRun` finding-free draw and full
  provenance. The strict rate is per draw; `coverage.md`'s rule is per run
  directory, so it is the closest comparable trend, not a substitute.
- Usage and judge counts are raw over the whole store; the rates, the dirty
  partitions and wall time exclude unfinished runs.

### Fixed

- The report reuses `runcheck.infrastructureOf`, so eight pre-SPEC-0020 timeouts
  count as infrastructure (9 total), not as eligible failures.
- The baseline is reproducible: the store only grows, and `--until` closes the
  upper end. A record with no parseable start is kept, not dropped.

### Measured

- **173 runs, 844 draws**: eligible 827, denominator 814, **67.2%**; strict 90
  draws, 87 passed / 3 failed, **96.7%**; infrastructure 9; provenance 95
  complete / 745 partial; wall 12h 10m 14s.
- **pdlc**: 10 runs (9 merged, 1 active), 0 retries, 0 red gates, median 43m 11s.
- `pdlc audit` still reports no durable fact after ten runs. The generic signal
  is queued as PDLC-83; the loop reads the record directly and does not wait.

### Known gaps

- The eligible rate mixes partial provenance. Use the strict rate for a clean
  comparison, and name the run directory before calling a delta a regression.
- The report is evidence, not a gate: no number in it fails CI.

## [0.4.0] — 2026-11-06

The evidence got a better instrument and a written disposition; two published
numbers were corrected along the way.

### Added

- **The judge sees the run's tool calls.** A derived ledger (`skill`, `read`
  path, `edit` diff, `write` content, `shell` command/exit/output) is the single
  evidence block, and `verifyEvidence` searches exactly the text the prompt
  shows. The separate command log was removed: it was unmetered, so a judge could
  cite a line that was not in the corpus.
- **`replay-evals --judge`.** Re-judges stored draws without an agent run;
  `--run` selects one directory, and each report carries the stored
  `repoSha`/`skillHash` plus `provenance: complete|partial`.
- **`Dispositions` in `coverage.md`.** Every decided case names the decision, the
  reason, the run directories and the date.

### Changed

- `pdlc_version` floor is `>=1.0.0`; v1.0.0 is published and the run records
  already store it.
- **Case #3 left `manual`.** Its fixture now makes the prompt's literal path fail
  (a generated barrel with a test, plus the convention that text helpers live in
  `src/text.js`), and one sanity draw proved the scope change. It is a regression
  case, not a separator: no control was measured. 76 cases, 74 runnable, 2 manual.

### Fixed

- **The judge's evidence matcher** normalises a leading `$ ` and accepts a short
  literal quote. Re-judging the #7 control moved **1/5 → 5/5**.
- **`--run` is a prefix match**, `--json` requires `--judge`, and a draw that
  failed deterministically is reported as `skipped` rather than `0/0 judged`.
- **Two published numbers corrected by the audit.** `review-code` #3 is **1/10**
  against 10/10, not 0/10 (the pass is a `Hold the merge` stance the guard did not
  name); `audit-code-quality` #4's earlier "passed once / failed once" compared
  two different case versions — the final 8-assertion pair is 1/1 vs 0/1, one
  draw per arm.

### Measured

- **#1 with skill stayed 0/5, for a new reason.** Expectation 1 is `not-met` in
  4/5 (no draw read `AGENTS.md` first; r5 did and was `met`), and expectations 2/4
  are unverifiable by construction. The residual is TASK-40; the instrument was
  not tuned to reach a number.
- The re-judged draws are byte-identical before and after (`result.json` sha256),
  and the ten judge calls spent no agent draw.

### Known gaps

- **#1's with-skill cell predates the SPEC-0016 skill rewrite** (default 12/12 and
  luna 5/5 were measured on the old `SKILL.md`); refreshing that arm needs a
  current-skill re-run.
- **`audit-code-quality` #4 needs n≥5** on the final 8-assertion version before it
  can be called a discriminator.
- **Both re-judged cells are `provenance: partial`** (they predate SPEC-0020), so
  the reuse rule cannot certify them.

## [0.3.0] — 2026-11-06

The runner stopped paying for evidence it does not need, and the load question
was answered: the defect did not reproduce.

### Added

- **Parallel repetitions.** `--concurrency` now limits draws, not cases, so
  `--case 1 --repeat 12` runs four draws at a time. A 12-draw cell went from
  `387 s` of draw time to `176.6 s` of wall time (the same artifact, 12/12).
- **`--stop <passes>/<fails>`.** Defaults to `5/3` when `repeat > 5`; the artifact
  records `stoppedEarly` and the observed `sequence`, and `reps` is what actually
  ran. The stop is evaluated between waves, so a 5-pass target with four lanes
  can finish at eight draws.
- **Provenance for reuse.** Each result records `fixtureHash`, `promptHash` and a
  derived `detectorVersion`; `CONTRIBUTING.md` allows citing an earlier control
  only when all three match.
- **`--stall-seconds`** (default 120). A draw whose event stream goes quiet is
  killed as `stalled`, distinct from `timeout`, instead of waiting the full 600 s.
- **Infrastructure outcomes.** `timeout` and `stalled` become `unscored` with an
  infrastructure reason, at most one retry, and never count as a pass or a
  behavioural failure. `check-eval-run` reports them as findings.

### Changed

- `manifest.json` records `concurrency`, `repeat`, `stop` and `stallMs`.
- A retry re-stages the fixture and the skill into a fresh scratch, so `unchanged`
  assertions cannot be satisfied by the dead attempt.

### Fixed

- `check-eval-run` now sees a legacy `execution.exit: "timeout"`; two 2026-11-05
  directories stopped reading as clean.
- A draw that both stalled and leaked is counted once, as infrastructure.

### Measured

- **The load defect did not reproduce.** At `07f4fe6`, 45 of 46 clean draws
  loaded the skill across `#1`, `#2`, `#5` and `#8` at `n=12`. `#2` is readable
  (11/12 passed) instead of gate 2/5; the description was not changed.
- The Gate A reading is recorded as "did not reproduce", not "fixed": the delta
  includes the SPEC-0016 rule change, so the cause is not isolated.

### Known gaps

- The control arm can still read the installed skill; detection remains the only
  guarantee.
- A direct read of the staged `SKILL.md` is not counted as a load (`TASK-39`).
- `groom-backlog` #2 stays unresolved: its clean control is 0/1.

## [0.2.0] — 2026-11-06

The trust wave: a control run can no longer score a pass by reading the skill it
is supposed to be measured against.

### Added

- **Leak detection** (SPEC-0017). Every repetition records `leak` (the tool calls
  that touched an installed skill or the eval corpus outside the scratch) and
  `contaminated`. A contaminated repetition is not a pass in either arm.
- **`scripts/check-eval-run.mjs`** (SPEC-0018). A model-free checker over a run
  directory: it fails on a leak, on a contaminated repetition, on a lost skill
  gate in the `with-skill` arm, and on an incomplete run (not `completed`, or a
  case directory without `result.json`). `CONTRIBUTING.md` requires it before a
  run directory is cited as a clean measurement.

### Changed

- A contaminated repetition is `unscored`, not `failed`, and leaves the pass-rate
  denominator. `compareRuns` counts any transition out of `passed` as a
  regression, including `passed → unscored`.
- `permission.external_directory: "deny"` ships in the child config as a
  best-effort layer. It does **not** block the read; detection is the guarantee.

### Fixed

- **`implement-from-prompt` #1 on `gpt-6-luna`: the control was 0/5, not 1/5.**
  The single control pass had read the installed `SKILL.md`; re-measured with the
  detector, the separator is 5/5 against 0/5 on both models.
- **`groom-backlog` #2 is unresolved, not a non-discriminator.** Its published
  3/3 tie had 2/3 contaminated control draws; the one clean draw failed. The
  `coverage.md` row now says so.

### Known gaps

- The control arm can still read the installed skill; only detection stands
  between that and a false pass.
- Three pre-detector run directories cannot be re-judged: they have no `leak`
  field and the checker reports `warnings` instead of a clean verdict.

## [0.1.0] — 2026-11-05

First versioned cut. This entry is retroactive: it records what landed before the
repository had a version, so later entries can be read against it.

### Added

- **13 skills** for the product-thinking pipeline: `capture-idea`,
  `process-inbox`, `groom-backlog`, `write-implementation-prompt`,
  `implement-from-prompt`, `review-code`, `audit-docs`, `audit-code-quality`,
  `bootstrap-project-harness`, `tighten-harness`, `find-blind-spots`,
  `record-decision` and `survey-inflight-work`.
- **Eval harness** (`scripts/run-evals.mjs` and `scripts/lib/evals/`) with
  fixtures, assertion kinds, a skill-provenance gate, a control arm and an
  optional judge.
- **Coverage inventory** (`docs/evals/coverage.md`): 76 cases, 26 trigger cases,
  3 manual.
- **Published matrices**: `review-code` and `implement-from-prompt`.
- **pdlc adoption** (`docs/pipeline.md`, `.opencode/agents/`, `runs/`): the
  orchestrated cycle with `lint` and `selftest` as its gates.

### Fixed

- `implement-from-prompt` read a path the prompt names as a place to write as if
  it were an existing module to extend; step 3 now separates a write target from
  a read dependency.
- `groom-backlog` case 2 asserted `nodir docs/specs`, which punished the split
  the skill's own step 6 asks for; the assertion now reads the reply.
- The `pre-commit` hook leaked `GIT_DIR` and `GIT_INDEX_FILE` into the fixture
  tests, which could switch a worktree's branch and set `core.bare` on the main
  repo.

### Changed

- `release_tier` moved from B (dry tag) to A (semver, changelog, tag) so a
  release means something.
- `implement-from-prompt` #4 is now a regression case, not a discriminator: the
  skill passes 5/5, and so does the control at 3/5.
- `groom-backlog` #2 left the matrix: 3/3 in both arms.

### Known gaps

- Four skills have no measurement yet: `capture-idea`, `process-inbox`,
  `record-decision` and `write-implementation-prompt`.
- The control arm can still read an installed skill; `TASK-29` tracks the fix.
