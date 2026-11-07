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
| `skills/<id>/references/` | material the skill loads on demand, including `evals.md` |
| `scripts/` | validator, eval runner, replay, matrix exporter, sensor-parity check, Promptfoo provider |
| `commands/`, `agents/` | OpenCode command stubs and the `spec-reviewer` subagent |
| `claude/` | Claude Code versions of the same stubs and subagent |
| `docs/` | this repo's own record; see [`docs/README.md`](docs/README.md) |
| `backlog/` | the working queue used to build this repo (`task-N`) |

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

Every skill keeps its cases in `skills/<id>/references/evals.md`. One case is:

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

A case ships its fixture as `references/evals/<n>/`, copied into the scratch
repo. When the case needs history, ship `references/evals/<n>/git.json` instead:

```json
{ "base": "../base", "remove": ["docs/specs"], "branch": "feature",
  "message": "add the feature", "patch": "change.patch" }
```

The tree is committed as `main`, `remove` is pruned, `change.patch` is applied
on `branch`, and that branch is left checked out.

Pick the assertion that matches what the skill may do, and make sure it can
fail. A case that passes without the skill measures nothing: `review-code` #2
left the matrix for exactly that reason.

## Measuring

```sh
# one case, three draws, with the skill pinned in the scratch dir
node scripts/run-evals.mjs --skill review-code --case 3 --repeat 3 --run
# the control arm: nothing staged, the skill tool denied
node scripts/run-evals.mjs --skill review-code --case 3 --repeat 3 --run --no-skill
# opt-in judge over the expect: lines
node scripts/run-evals.mjs --skill review-code --case 3 --repeat 3 --run --judge
```

- One verdict from a non-deterministic agent is one draw. Use `--repeat 3` (or
  more) before claiming a rate.
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
  `--skill`/`--case`/`--repeat`/`--no-skill`; the persisted draws are skipped.
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
  node scripts/run-evals.mjs --skill <id> --case 1 --repeat 12 --stop 12/0 --run
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
- `--save-baseline` stores a run; the next full run compares against it and
  fails on a case that moved `passed` → `failed`, or disappeared.
- Publish a measured set in `docs/evals/review-code-matrix.md` (or a new doc
  beside it); publish a single case's measurement in its `why:` line. Update
  [`docs/evals/coverage.md`](docs/evals/coverage.md) either way.
- Keep a failed control as a finding. The mutation pilot in
  `docs/evals/experiments/` records two `invalid` results on purpose.

### Per-release health pass

Before writing the CHANGELOG entry for a release, run the health report from the
main checkout and read the delta against the previous release in
[`docs/evals/harness-health.md`](docs/evals/harness-health.md):

```sh
node scripts/harness-health.mjs --until <release-cut-ISO-timestamp>
```

Bind the snapshot to the cut time with `--until`: the store only grows, so the
bound is what makes the release reproducible. It reads the eval store and
`.pdlc/runs.json`, spends no model and writes nothing. A dispatched worktree
does not carry `.pdlc/`; there, pass `--pdlc /path/to/.pdlc/runs.json`. Compare
like with like: a number moves the trend only when the artefacts are comparable
(same fixture/prompt/detector hashes, same case shape); a different mix of runs
is variance. The strict rate is per draw; `coverage.md`'s rule is per run
directory, so use strict as the closest comparable trend and the eligible rate
for the broad trend. Paste the new table into the baseline doc, then open at most
three findings and at most one spec. The report is evidence, not a CI gate: a
red number does not fail a build.

## Checking a publication

Two model-free checks catch the mechanical review findings: a spec whose
contract disagrees with its diff, and a document citing evidence that does not
say what the sentence claims. Run them before review and before a merge:

```sh
# the spec's task:, files: vs the branch diff, dependency links, body rules.
# `main` is the canonical local base; `origin/main` goes stale by policy (this
# repo does not push) and produces a flood of phantom diff entries.
node scripts/spec-check.mjs --spec docs/specs/active/<slug>.md --base main
# every run-directory citation in docs/evals/*.md against the local store
node scripts/check-evidence.mjs
```

`spec-check` exits 1 on an error and prints one line per finding; warnings (a
declared file the diff did not touch, an asymmetric dependency) print without
failing, so an unrelated publication does not block the build. A touched file
the spec did not declare is always an error. `check-evidence` exits 1 on a
missing directory, a completed run with no cases, an unfinished run cited as
complete, or `isolated=yes` on a run whose recorded detector is not current. It
warns when a run with findings is cited without a
`dirty|leak|host|stall|contaminated|discard|history|failure` marker; `--strict`
makes those warnings fatal. The local `selftest` and the pre-commit hook run
`check-evidence`; CI cannot, because it has no eval store.

## What CI enforces

`.github/workflows/skills.yml` runs, on Node 24:

```sh
node scripts/validate-skills.mjs --root skills
node scripts/run-evals.mjs --root skills --list --check
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
