# Changelog

All notable changes to the skills and to the eval harness are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project uses [Semantic Versioning](https://semver.org/). The artifact is the set
of skills plus the evidence that backs them, so a version is a claim: which
skills, which cases, and which published measurements.

## [Unreleased]

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
  holds; `bootstrap-project-harness` #19's control is 4/5 clean with 1/5 passed
  (separator unchanged). The store-wide re-judge moved six draws, every one a
  store read; nothing else became dirty. Source:
  `docs/specs/active/SPEC-0052-the-eval-store-is-an-answer-key.md`.
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
  `docs/specs/active/SPEC-0051-content-counts-only-for-the-path-it-names.md`.
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
  `docs/specs/active/SPEC-0050-measure-the-four-remaining-cells.md`.
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
  `docs/specs/active/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md`.
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
  `docs/specs/active/SPEC-0048-a-denied-read-is-not-a-leak.md`.
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
  `docs/specs/active/SPEC-0046-deny-control-arm-corpus.md`.
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
  not a new measurement.

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
