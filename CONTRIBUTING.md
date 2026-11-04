# Contributing

This repo ships authored agent skills and the harness that scores them. The
[README](README.md) is the manual: install, the skill loop, the eval mechanism,
and every assertion kind. This file covers only what changes when you contribute.

## Setup

- Node 20 (same as CI). No dependencies to install.
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
  chosen at all.
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
  must name the run directory it came from; the coverage table marks older
  `why:` notes that predate that rule as `no run dir`.
- `--save-baseline` stores a run; the next full run compares against it and
  fails on a case that moved `passed` → `failed`, or disappeared.
- Publish a measured set in `docs/evals/review-code-matrix.md` (or a new doc
  beside it); publish a single case's measurement in its `why:` line. Update
  [`docs/evals/coverage.md`](docs/evals/coverage.md) either way.
- Keep a failed control as a finding. The mutation pilot in
  `docs/evals/experiments/` records two `invalid` results on purpose.

## What CI enforces

`.github/workflows/skills.yml` runs, on Node 20:

```sh
node scripts/validate-skills.mjs --root skills
node scripts/run-evals.mjs --root skills --list --check
node --test scripts/lib/evals/*.test.mjs
node --test skills/bootstrap-project-harness/scripts/*.test.mjs
node scripts/check-sensor-parity.mjs
```

The same commands are in `.githooks/pre-commit`. Behavioural runs stay local:
they need a model provider and cost money.

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
- [ ] `docs/evals/coverage.md` is updated.
- [ ] No third-party skill is tracked.
