---
spec: SPEC-0003
spec_sha: 04639c29e933ad9897309b28112e529c983478cb89c1feb10ac7cd1e6b69ce33
---

# Implementation Prompt: SPEC-0003 Deterministic harness state

## Source Spec

- docs/specs/SPEC-0003-deterministic-harness-state.md

## Requirements

**User outcome.** An agent asked to bootstrap a repo that already has a complete
harness says so and stops, and the reason it stopped is a command's output rather
than a judgement about whether trimmed files count as present.

**Scope.**

- New `skills/bootstrap-project-harness/scripts/harness-state.mjs`, zero
  dependencies, run with the repo's own `node`.
- `SKILL.md` runs it before any step and takes its answer as the state.
- Python template gains the `smoke` recipe the definition already names.
- Case 14 leaves `status: manual` at ≥10/12 stops; below that it keeps `manual`
  with the rate recorded.
- Unit tests for the script, included in the command CI already runs.

**Acceptance criteria** (copied from the spec): AC-1 prints exactly one of
`empty`, `project-no-harness`, `partial`, `complete` with the flow's exit-code
mapping, tested on four synthetic trees plus a failing-smoke tree, and exits
non-zero naming the failing file when the directory is unreadable; AC-2 `complete`
requires the files its stack template installs (excluding install artefacts) and
a built-in check that parses manifests and the docs sensor without installing
anything — no `just`, `npm` or `uv` needed; AC-3 `SKILL.md` runs the script
before step 1, stops on `complete`, and the state table no longer describes the
state as read by inspection; AC-4 case 14 is un-manualed at ≥10/12 or keeps
`manual` with the measured rate; AC-5 the Python template gains a `smoke` recipe
that runs without an install; AC-6 `validate-skills`, `run-evals --list --check`
and the test suite pass, with the new script's tests added to the CI step and to
the pre-commit command.

**Non-goals.** Do not ship the script into the target repo. Do not install the
toolchain to decide. Do not add stacks. Do not change what the harness installs.
Do not add a CI job that runs the bootstrap.

## Entities

| Term | Meaning |
| --- | --- |
| state | `empty`, `project-no-harness`, `partial`, `complete` |
| stack | `ts` or `python`, resolved by the skill's existing rule order |
| missing | a required file the state check could not find |
| smoke | the dependency-free check the script performs itself |

Exit codes: `0` complete, `1` partial, `2` empty, `3` project-no-harness, `64`
unreadable directory.

## Approach

The script is the single source of truth for "what a complete harness contains",
and it must be readable as the same four states the table shows. Build it as pure
functions over a directory path: `detectStack`, `required`, `smoke`, `state`.
The CLI is a thin wrapper that prints findings and exits.

Resolve everything from `import.meta.url` and the skill directory, never from the
caller's cwd, so the agent needs no path arithmetic. The target repo is an
argument, default `.`.

The check must not run a package manager. For TypeScript, `node --check` on the
docs sensor and `JSON.parse` on `package.json` are enough. For Python, a regex for
`[project]` in `pyproject.toml` and `python3 -m py_compile docs_check.py` when
`python3` exists; if it does not, that single check is reported `skipped` and does
not block, because the verdict must not depend on a toolchain being installed.

## Structure

- `skills/bootstrap-project-harness/scripts/harness-state.mjs` — the script.
- `skills/bootstrap-project-harness/scripts/harness-state.test.mjs` — tests,
  `node:test`, no dependencies.
- `skills/bootstrap-project-harness/SKILL.md` — step 0 and the state table.
- `skills/bootstrap-project-harness/templates/python/justfile.template` — add
  `smoke`.
- `skills/bootstrap-project-harness/references/evals.md` — case 14.
- `.github/workflows/skills.yml` and `lefthook.yml` — add the new test file to the
  command they already run.

## Operations

1. **Write the script.** `harness-state.mjs` exports `detectStack(dir)`,
   `missingFor(stack, dir)`, `smokeOk(stack, dir)` and `stateOf(dir)`, and when
   run directly prints one line per missing item plus `state: <name>` last.
   Required files, TypeScript: `AGENTS.md`, `README.md`, `justfile`,
   `lefthook.yml`, `eslint.config.js`, `.prettierrc`, `.editorconfig`, and the
   `docs/` skeleton (`specs/`, `prompts/`, `decisions/`). Python: `AGENTS.md`,
   `README.md`, `justfile`, `lefthook.yml`, `pyproject.toml`,
   `.python-version`, and the same `docs/` skeleton. Install artefacts —
   `node_modules`, `package-lock.json`, `bun.lock`, `.venv`, `uv.lock`, installed
   hook binaries — are never required.
2. **Write the tests** beside it: a synthetic tree per state, one where the docs
   sensor fails its syntax check, and one where the directory does not exist.
   Each asserts the printed state and the exit code. Use `mkdtempSync` under
   `os.tmpdir()`.
3. **Wire the skill.** In `SKILL.md`, add step 0 above the numbered workflow:
   run the script, obey it, and on `complete` report what it found and stop — no
   interview, no writes, no pass over the steps. Replace the state table's
   "read straight off the audit" paragraph so the table and the script's output
   name the same four states.
4. **Python smoke.** Add to `templates/python/justfile.template`:
   ```just
   smoke:
       python3 -m py_compile docs_check.py
       python3 docs_check.py
   ```
   Keep the TypeScript recipe as it is.
5. **CI and hooks.** Add
   `node --test skills/bootstrap-project-harness/scripts/harness-state.test.mjs`
   to the test step in `.github/workflows/skills.yml` and to the equivalent
   command in `lefthook.yml`.
6. **Measure case 14.** Run
   `node scripts/run-evals.mjs --root skills --skill bootstrap-project-harness --case 14 --repeat 3 --run`.
   If all three stop, run nine more (`--repeat 12` into a fresh run) and use the
   combined rate. Update `references/evals.md`: at ≥10/12 remove `status: manual`
   and put the rate in `why:`; otherwise keep `manual`, record the rate and the
   failing behaviour there.
7. **Update the spec** to `implemented` with the measured rate in AC-4, and
   regenerate this prompt's `spec_sha`.

## Norms

- Zero new dependencies; Node 20; no CLI framework.
- Comments explain a check's reason, not what the line does.
- The skill stays stack-agnostic in prose; stack specifics live in the required-
  file lists and templates.
- Conventional commits, imperative subject ≤72 chars, body explains why.
- The existing "additive only" and "report competing toolchains" rules are not
  touched.

## Safeguards

- Do not write to the target repo — the script reads only.
- Do not treat a missing install artefact as a gap.
- Do not let the script run `npm`, `just` or `uv`; those are what the check must
  survive without.
- Fail toward `partial`: a required file that cannot be read is missing, not
  present. A wrong `complete` is worse than a wrong `partial`.
- Do not change the templates' installed content beyond the Python `smoke`
  recipe.
- Do not edit the eval runner or the matrix.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | `node --test skills/bootstrap-project-harness/scripts/harness-state.test.mjs` — four states, failing smoke, missing directory |
| AC-2 | Run the script on `skills/bootstrap-project-harness/references/evals/14` with `node_modules` absent; it prints `complete`, exit 0 |
| AC-3 | Read `SKILL.md`: step 0 exists and the table names the same states as the script |
| AC-4 | Case 14 runs 12 times; the observed stop rate is in `why:` and decides `status:` |
| AC-5 | `just smoke` in a fixture copied from the Python template exits 0 without `uv sync` |
| AC-6 | `node scripts/validate-skills.mjs --root skills`, `node scripts/run-evals.mjs --root skills --list --check`, `node --test skills/bootstrap-project-harness/scripts/harness-state.test.mjs` all pass |

Done when every AC passes and the spec status is updated.
