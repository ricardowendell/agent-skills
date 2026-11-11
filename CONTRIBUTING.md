# Contributing

This repo ships authored agent skills and the harness that scores them. The
[README](README.md) is the manual: install, the skill loop, the eval mechanism,
and every assertion kind. This file covers only what changes when you contribute.

## Setup

- Node 24 (same as CI). No dependencies to install.
- Enable the committed hook once:

  ```sh
  git config core.hooksPath .githooks
  ```

- Behavioural evals are the only part that needs `opencode` and a provider.
  Have `opencode auth` configured (or the provider key exported): the child
  process inherits your environment minus `OPENCODE*` and `AI_AGENT`, which the
  runner strips so it attaches to the scratch dir instead of your session.

## Layout

| Path | What it is |
| --- | --- |
| `skills/<id>/SKILL.md` | the skill; `<id>` is the skill id |
| `skills/<id>/references/` | material the skill loads on demand; never the eval corpus |
| `evals/<id>/cases.md` | the cases for `<id>`, outside the skill and never staged |
| `evals/<id>/fixtures/<n>/` | the fixture trees and `git.json` manifests |
| `scripts/` | `eval.mjs` (the one eval CLI), the skill validator, the checkers and the sensor-parity check |
| `commands/`, `agents/` | OpenCode command stubs and the `spec-reviewer` subagent |
| `claude/` | Claude Code versions of the same stubs and subagent |
| `docs/` | this repo's own record; see [`docs/README.md`](docs/README.md) |
| `backlog/` | the working queue used to build this repo (`task-N`); `archive/tasks/` holds the Done ones |

## Editing the backlog

`backlog task edit --comment "…"` **silently truncates a comment at the first
line that is just `---`**, and drops everything after it, including the next
comment. The CLI is a precompiled binary (Backlog.md 1.55.3), so there is nothing
in-repo to patch. Reproduced on 2026-11-07, on a task whose comments held a
horizontal rule or a fenced block containing `---`:

```sh
# COMMENTS block had: created: … / --- / Primeiro / --- / Segundo
backlog task edit TASK-N --comment "NOVO"   # exit 0, prints "Updated task"
# result: "Segundo" is gone, "NOVO" is there
```

Rule: **do not use `--comment`.** Append with the repo's own tool, which never
parses the block:

```sh
node scripts/backlog-comment.mjs TASK-55 "the note"
node scripts/backlog-comment.mjs TASK-55 "the note" --at 2026-11-07T12:00:00Z  # reproducible stamp
```

It inserts the record before `<!-- COMMENTS:END -->` and leaves every existing
byte alone, so a body containing `---` or a fenced block survives. `--status` and
`--check-ac` do not touch the block and stay on the CLI. If you do use the CLI,
check `git diff -- backlog/tasks/` for removed lines: it reports success either
way. One caveat: `backlog task view` applies the same separator rule when it
*reads*, so a body with a `---` shows up in pieces there — the file is intact,
the display is not. TASK-55 tracks the upstream issue.

## Adding a skill

1. `mkdir skills/<id>` with a lowercase kebab-case id. The directory name *is*
   the id.
2. Add `SKILL.md` with YAML frontmatter:

   ```yaml
   ---
   name: <id>
   description: "What it does. Use when <trigger>."
   stack-agnostic: true   # only if it must not assume a stack
   ---
   ```

3. Keep `description` under 500 characters and trigger-shaped: it is the only
   text the agent sees when choosing a skill, on every step.
4. Quote any value containing `": "` — an unquoted one is an error in the repo
   gate (CI and the hook), because strict YAML loaders reject it.
5. If the skill waits for approval, say what silence means next to the gate
   ("silence is not consent"). The validator warns without it.
6. A `stack-agnostic: true` skill must not name only one stack. Mentioning both
   Node and Python is fine; naming only one is the smell the validator catches.
7. Do not add third-party skills. See [Third-party skills](#third-party-skills).
8. Run the validator; the bar is `All clear`, not "no errors". Warnings are how
   drift, stack hardcoding and missing consent clauses surface.

## Adding a case

Every skill keeps its cases in `evals/<id>/cases.md`, beside the skill roots —
never inside the skill, so a staged copy cannot carry its own answer key. One
case is:

```md
1. **Short title.**
   - prompt: the only text sent to the agent
   - tags: trigger
   - why: the scenario for a human reader; never sent
   - expect: a line a human checks
   - assert: verdict APPROVE
   - gate: off
```

Rules:

- `prompt` is the whole input. Never put the expected answer in it.
- `why` documents the scenario and is never sent. It is where a measurement
  that supports the case belongs.
- `expect` stays human-checked. `assert` is the machine half; the kind list is
  in the [README](README.md#assertions). Do not copy it here.
- Numbers are unique per skill and never reused. `--check` rejects duplicates.
- `status: manual` keeps a case in the file as design intent without running it.
- `gate: off` is required by trigger cases, which ask whether a skill was
  chosen at all. A trigger case keeps the tool call as its signal: the `skill`
  assertion does not accept a direct read of the staged `SKILL.md`. A
  behavioural case (gate on) accepts either the `skill` tool or a direct read of
  that staged file, and `skillGate.source` records which one (`tool` or `read`).
  A read outside the scratch dir — the installed copy or a stale one — is never
  a load.
- `stage: <skill-id>` stages a second skill in the scratch when the case asserts
  on a sibling (`- assert: skill process-inbox` while reviewing `capture-idea`).
  `--check` rejects an unknown id and one that names the skill under review. The
  control arm ignores it.
- `needs: gates` marks an expensive case that `--level behavior` may skip.
  Nothing uses it today.
- Tags in use: `trigger`, `matrix`, `regression`, `harness-state`.

A case ships its fixture as `evals/<id>/fixtures/<n>/`, copied into the scratch
repo. When the case needs history, ship `evals/<id>/fixtures/<n>/git.json` instead:

```json
{ "base": "../base", "remove": ["docs/specs"], "branch": "feature",
  "message": "add the feature", "patch": "change.patch" }
```

The tree is committed as `main`, `remove` is pruned, `change.patch` is applied
on `branch`, and that branch is left checked out.

Pick the assertion that matches what the skill may do, and make sure it can
fail. A case that passes without the skill measures nothing: `review-code` #2
left the matrix for exactly that reason.

## The eval CLI

There is one entry point, `scripts/eval.mjs`, with five operations:

| Command | What it does | Model |
| --- | --- | --- |
| `list [skill]` | print cases for a skill, `--case` or `--tag` | no |
| `check [skill]` | parse, validate, resolve every fixture and dry-stage | no |
| `run <skill> [n]` | one arm, one skill (`--arm with` or `--arm without`), `--repeat` (default **1**) | yes |
| `compare <skill> <n>` | none / baseline / candidate arms; `--against <ref>` | yes |
| `inspect <run-dir>` | stored status, failing assertions, `--replay`, `--leaks`, `--judge` | no |

The defaults are the ladder. `run` starts at **one** draw; `compare` at **three**
per arm. One to three draws are **screening** — a direction, not a claim (four is
still screening). Five or more (`--repeat 5`) is **evidence** and may be published
in `docs/evals/`. The
scorecard always prints the numerator and the denominator per arm, and `--stop`
reports the draws that actually ran, never the ceiling. `--json` emits the same
run/manifest record the artefacts use; `--verbose` expands failures.

`compare` prints `reused <dir>` or `ran <dir>` per arm. An arm is reused only when
model+provider, prompt hash, fixture hash, assertion/grading hash, the arm's skill
hash and the isolation contract all match the stored run; `--refresh` forces a
rerun, and `--against <ref>` pins the baseline by commit (the skill tree is read
from that ref, never from a directory).

**Flag mapping (old → new).** Anything not in this table is gone, not accepted and
ignored:

| Old | New |
| --- | --- |
| `--list` / `--check` / `--run` | `list` / `check` / `run` |
| `--skill <id>` | positional `<skill>` |
| `--no-skill` | `--arm without` |
| `--full` | `--level full` |
| `--case <n>` | `--case <n>` or the positional `<n>` |
| `replay-evals.mjs --leaks <dir…>` | `inspect --leaks <dir…>` (or `--all`) |
| `replay-evals.mjs --leaks --all` | `inspect --leaks --all` |
| `replay-evals.mjs --run <id>` | `inspect <run-dir>` (a directory, not a prefix) |
| `replay-evals.mjs --judge <model>` | `inspect --judge <model> <run-dir…>` |
| `--baseline <file>` / `--save-baseline` | dropped: `compare` is the comparison, by arm or by run directory |
| `--quiet` (replay) | dropped: `inspect --replay` prints only moved verdicts by default; `--verbose` prints every verdict |
| `--skill <id>` (replay) | kept: `inspect --leaks --all --skill <id>`, and the same filter on `--replay`/`--judge` |
| `--shared` / `--i-know` / `--no-isolate` | dropped: a run is always standalone and isolated; the isolation contract is a reuse input |

Kept with their meanings: `--root`, `--model`, `--agent`, `--case`, `--tag`,
`--level`, `--timeout`, `--stall-seconds`, `--judge`, `--judge-threshold`,
`--json`, `--resume`, `--repeat`, `--stop`, `--min-pass`, `--concurrency`.
`--judge` takes an optional model on `run`/`compare` (bare means the model under
test, and the self-judged warning is printed), but `inspect --judge` requires one
(`--judge default` is the explicit form).

Exit codes are deliberate: **2** is a usage error, **1** is a finding (`check`),
a failed/unscored draw (`run`), a regressed or missing cell (the run-dir
`compare`), or a moved verdict (`inspect --replay --changed`). The single-case
arm `compare` exits **0**: it prints a decision, it is not a gate. The old
`run-evals.mjs` used 1 for usage and `replay-evals.mjs` used 2; one CLI has one
code per class.

## Measuring

```sh
# one draw, one answer: does the harness work on this case?
node scripts/eval.mjs run review-code 7
# a screening comparison: three draws per arm, control included
node scripts/eval.mjs compare review-code 7
# the same, with the skill at `main` as the baseline arm
node scripts/eval.mjs compare review-code 7 --against main
# the control arm on its own
node scripts/eval.mjs run review-code 7 --arm without
# opt-in judge over the expect: lines
node scripts/eval.mjs run review-code 7 --judge
# inspect what a stored run actually recorded, offline
node scripts/eval.mjs inspect ~/.local/share/opencode/evals/runs/<timestamp>--<label>
```

- One verdict from a non-deterministic agent is one draw. `compare` defaults to
  three per arm; promote to `--repeat 5` only when the result is going to be
  published.
- Artefacts land in
  `~/.local/share/opencode/evals/runs/<timestamp>--<label>/`. A new measurement
  must name the run directory it came from; a clean measurement must also pass
  the checker below. The coverage table marks older `why:` notes that predate
  that rule as `no run dir`.
- Before citing a run directory **as a clean measurement or a pass rate**, run
  the model-free checker over it:

  ```sh
  node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<timestamp>--<label>
  ```

  It reads `manifest.json` and `cases/*/result.json` and exits non-zero on a
  leaked read, a contaminated draw, a lost skill gate, missing provenance, an
  aborted draw (timeout, stall, or a provider limit), or an
  unfinished run (`manifest.status` is not `completed`, or a case directory has
  no `result.json`). A clean claim requires `findings=0 warnings=0` in the
  summary. A directory that fails may still be cited as the record of the
  failure itself, with the finding named (the contaminated control draws are
  cited that way); it cannot supply a clean pass rate.

  Unknown provenance is not clean: a repetition without `skillGate` fails as
  `provenance unknown`, and a repetition without `leak` in a run that otherwise
  records it fails as `leak field missing`. The one exception is a whole run that
  started before SPEC-0017 landed, where no draw has `leak` at all: the checker
  prints `warn leak-missing` for each draw and exits 0. Such a run is citable
  only as history, with its `warnings=N` stated; it is never a
  `findings=0 warnings=0` claim. `leak` is mandatory from SPEC-0017 onwards, so
  a run that carries it anywhere must carry it everywhere.
- A stopped run is complete evidence, not an unfinished one. `stoppedEarly:
  true` says the stop rule fired between waves, and `reps`/`passed` are the
  draws actually run. Publish those (e.g. "8/8, stopped early"), never the
  requested `--repeat`; use `--stop <n>/0` when a rate claim needs the full
  count. The default is `5/3` for `--repeat` above 5, evaluated between waves, so
  a clean `--concurrency 4` cell can stop at 8 rather than at 5.
- A run that died before its final write leaves
  `cases/<case>/draws/r<i>.json` and no `result.json`. It is incomplete evidence,
  not clean. Resume only the missing draws with `--resume <run-dir>` and the same
  `<skill>`/`--case`/`--repeat`/`--arm`. A persisted draw is skipped only when it
  is a result the harness kept: `passed` and `failed` (already scored and paid
  for), an `unscored` draw without infrastructure (an authoring defect such as
  "no assertions", which repeating does not fix), and a `contaminated` draw (it
  was paid and it produced a behaviour; re-running it is a decision for a named
  flag, not a resume default). A discarded draw is re-run: `unscored` with
  `infrastructure: true` (a stall, a timeout or a provider abort) is not evidence,
  so `--resume` repeats it and prints
  `resume: re-running N infrastructure draw(s) (#<case> r<i>, <reason>)` — a
  resumed wave is never silently a different wave. If the arm, level, repeat or
  label does not match the manifest, the resume is a usage error and nothing is
  staged.
- Draws share one lane pool; `--concurrency` (default 4) is the number of draws
  in flight, even within one case. Six and eight produced no rate limits — 6
  lanes ran 10/11, 8 lanes 11/11 — but there was no gain from 6 to 8, so the
  default stays 4; raise it for a specific run, not in the default.
- Reuse a control from an earlier wave only when `fixtureHash`, `promptHash` and
  `detectorVersion` all match the new run. Any difference — one fixture byte, a
  prompt edit, a change to the leak detector — re-runs the control. Cite the
  three fields together with the reused run directory.
- Before building a matrix, run the load canary by hand:

  ```sh
  node scripts/eval.mjs run <id> 1 --repeat 12 --stop 12/0
  ```

  It answers "does the skill load at all?" before a multi-case matrix spends
  money. It stays manual because behavioural runs call a model and the policy
  keeps them out of CI. `--stop 12/0` belongs to the rule: the default `5/3`
  stop fires at the fifth clean pass (eight draws at `--concurrency 4`), so a
  12-draw canary has to disable it. The canary is a precondition, not a rate — a
  single miss is a finding about the skill, and twelve draws are what make that
  miss visible. `check-eval-run` prints
  `warn stopped-early … reps=N of requested 12` for a case that stopped short, so
  an eight-draw canary is never read as 12/12.
- `compare` has two forms. `compare <skill> <n>` is the arm comparison: the
  `none` arm is the control, the `candidate` arm the working tree, and
  `--against <ref>` adds the skill as it was at that commit; reuse is explicit
  (`reused <dir>`), so a stale arm cannot hide inside a fresh-looking table.
  `compare <run-dir-a> <run-dir-b>` is the whole-run regression diff: it reads
  both run directories, prints every regression, fix, new and missing cell, and
  exits 1 when any cell regresses or disappears. The arm form reports a
  decision; the run-dir form is the gate.
- Publish a measured set in `docs/evals/review-code-matrix.md` (or a new doc
  beside it); publish a single case's measurement in its `why:` line. Update
  [`docs/evals/coverage.md`](docs/evals/coverage.md) either way.
- Keep a failed control as a finding. The mutation pilot in
  `docs/evals/experiments/` records two `invalid` results on purpose.
  Archived experiments under `docs/evals/experiments/` keep the commands they ran
  (`run-evals.mjs`/`replay-evals.mjs` included): they are history, not live
  instructions, and are not rewritten.

## Checking a publication

Two model-free checks catch the mechanical review findings: a spec whose
contract disagrees with its diff, and a document citing evidence that does not
say what the sentence claims. Run them before review and before a merge:

```sh
# the spec's task:, files: vs the branch diff, dependency links, body rules.
# `main` is the canonical local base; `origin/main` goes stale by policy (this
# repo does not push) and produces a flood of phantom diff entries.
node scripts/spec-check.mjs --spec docs/specs/active/<slug>.md --base main
# every run-directory citation in coverage.md and the matrix files, against the
# local store
node scripts/check-evidence.mjs
```

`spec-check` exits 1 on an error and prints one line per finding; warnings (a
declared file the diff did not touch, an asymmetric dependency) print without
failing, so an unrelated publication does not block the build. A touched file
the spec did not declare is always an error. `check-evidence` reads only
`docs/evals/coverage.md`, `docs/evals/discriminating-cases.md` and the
`docs/evals/*-matrix.md` files, and exits 1 on
a missing directory, a completed run with no cases, an unfinished run cited as
complete, or `isolated=yes` on a run whose recorded detector is not current or
whose manifest records an unenforced boundary. A citation must name the run
directory exactly; an elided name is prose, not evidence. A missing eval store
is the only warning, and `--strict` makes it fatal. The local `selftest` and the
pre-commit hook run `check-evidence`; CI cannot, because it has no eval store.

## What CI enforces

`.github/workflows/skills.yml` runs, on Node 24:

```sh
node scripts/validate-skills.mjs --root skills
node scripts/eval.mjs check --root skills
node scripts/spec-check.mjs --spec <changed spec> --base <PR base sha>   # pull requests only
node --test scripts/lib/evals/*.test.mjs
node --test skills/bootstrap-project-harness/scripts/*.test.mjs
node scripts/check-sensor-parity.mjs
```

`spec-check` runs only on a `pull_request` event: the branch point is the base
its `files:` list is written against. A push to `main` has no per-spec base (it
carries the cumulative local fan-in), so the step is skipped there and the local
pre-merge run is the gate. The same commands are in `.githooks/pre-commit`,
except `spec-check`. Behavioural runs stay local: they need a model provider and
cost money.

## Third-party skills

`agent-browser`, `impeccable`, `graphify`, `find-skills` and `orchestration` are
installed locally for use, not redistributed. They are gitignored, and CI fails
if any of them becomes a tracked file. Install them from upstream (see the
README).

## Commits

Conventional Commits: `feat|fix|chore|docs|refactor|test|perf(scope): summary`,
imperative subject ≤ 72 characters. The body explains why, not what.

Manual commits on `main` during a wave carry a trailer naming why they are not
part of the fan-in — `Pdlc-Bookkeeping: <reason>` (task close, run record, docs
fix). `pdlc collect` lists the rest as commits outside the fan-in. Since pdlc
1.4 the merge writes `status: implemented` itself, so there is no separate
status commit to make.

A spec whose declared `files:` must change before `verify` is amended on `main`
and the `main` branch is merged into the worktree first. That leaves the branch
already containing `main`, so the fan-in is a **fast-forward**: there is no
merge commit and therefore no `Pdlc-Land` trailer. `pdlc collect` then lists the
worker's own commits under "Commits na main fora do fan-in", which is a false
positive from the fast-forward, not a commit that bypassed the gate (verified on
SPEC-0045 at pdlc 1.4.0). Check ancestry before treating one of those as
bookkeeping.

## Before you open a PR

- [ ] `All clear` from the validator.
- [ ] `--list --check` is clean.
- [ ] Unit tests pass and `check-sensor-parity` is clean.
- [ ] A new case has a prompt, a unique number, and at least one assertion that
      can fail.
- [ ] No new measurement without a run directory (historical notes are marked
      `no run dir` in the coverage table).
- [ ] `node scripts/spec-check.mjs --spec <spec> --base main` is clean.
- [ ] `node scripts/check-evidence.mjs` has no errors.
- [ ] A run directory cited as a clean measurement passes
      `node scripts/check-eval-run.mjs <dir>` with `findings=0 warnings=0`.
- [ ] `docs/evals/coverage.md` is updated.
- [ ] No third-party skill is tracked.
