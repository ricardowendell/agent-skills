---
spec: SPEC-0003
spec_sha: 970e625ca288765874ac238688d38a3e4f1933f7882765a7fb9e2b3b267274c5
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
  dependencies, run with `node`.
- `SKILL.md` runs it before any step, with the table as declared fallback when
  the script cannot run.
- Python template gains the `smoke` recipe the definition names.
- Two eval cases: #14 (complete → stop) and #15 (one file missing → fix only
  that, never stop).
- Unit tests, a template-parity test, both wired into CI and pre-commit.

**Acceptance criteria** (copied from the spec): AC-1 prints exactly one of
`empty`, `project-no-harness`, `partial`, `complete` with the flow's exit codes,
plus two refusals that are not states — `ambiguous` (exit 4, naming the manifests)
and an unreadable directory (exit 64, naming the path) — tested on four trees,
a failing smoke, an ambiguous tree and a missing directory; AC-2 `complete`
requires the template's files (excluding install artefacts) and a smoke that
exits 0 — `just smoke` when `just` and the recipe exist, otherwise the built-in
check — with nothing installed and a failing `just smoke` never complete; AC-3
`SKILL.md` runs the script before step 1, stops on `complete`, reports-and-stops
on any `competing:` line, asks on `ambiguous`, and names the table as fallback
when the script cannot run; AC-4 case 14 is un-manualed at ≥10/12, and below that
the script still ships with the case manual and the rate recorded, AC-4 reported
as failed; AC-5 the Python template gains a smoke recipe that runs without an
install; AC-6 `validate-skills`, `--list --check` and the suite pass, with the
new tests added to the CI step and pre-commit command; AC-7 case 15's fixture is
complete except `lefthook.yml`, the skill creates it and does not stop, asserted
by `file lefthook.yml`, and it is un-manualed only at 3/3; AC-8 a parity test
compares the script's required list with `templates/ts` and
`templates/python` and fails on any disagreement in either direction, naming the
list to update.

**Non-goals.** Do not ship the script into the target repo. Do not install the
toolchain to decide. Do not add stacks. Do not change what the harness installs.
Do not add a CI job that runs the bootstrap. Do not port the script to Python.

## Entities

| Term | Meaning |
| --- | --- |
| state | `empty`, `project-no-harness`, `partial`, `complete` |
| refusal | `ambiguous` (which stack?) or unreadable directory |
| stack | `ts` or `python`, resolved by the skill's existing rule order |
| missing | a required file the check could not find |
| competing | another tool already owns that slot (Biome, husky, poetry) |
| smoke | `just smoke` when available, otherwise the built-in check |

Exit codes: `0` complete, `1` partial, `2` empty, `3` project-no-harness, `4`
ambiguous stack, `64` unreadable directory.

## Approach

Build the script as pure functions over a directory path —
`detectStack`, `required`, `competing`, `smoke`, `stateOf` — with the CLI as a
thin wrapper that prints findings and exits. Everything resolves from
`import.meta.url` and the skill directory, never the caller's cwd; the target is
an argument, default `.`.

The required list is explicit in the script, and a parity test keeps it equal to
the templates. Do not derive the list at runtime: the template directories carry
`.template` suffixes and a `docs/` skeleton that the list has to name anyway, and
a runtime-derived list makes a wrong verdict depend on files inside the skill.

The check never runs a package manager. TypeScript: `JSON.parse` on
`package.json` and `node --check` on the docs sensor. Python: a regex for
`[project]` in `pyproject.toml` and `python3 -m py_compile docs_check.py` when
`python3` exists; if it does not, that one check is reported `skipped` and does
not block.

## Structure

- `skills/bootstrap-project-harness/scripts/harness-state.mjs` — the script.
- `skills/bootstrap-project-harness/scripts/harness-state.test.mjs` — states,
  refusals, failing smoke.
- `skills/bootstrap-project-harness/scripts/template-parity.test.mjs` — list vs
  `templates/`.
- `skills/bootstrap-project-harness/SKILL.md` — step 0, the table, fallback.
- `skills/bootstrap-project-harness/templates/python/justfile.template` — add
  `smoke`.
- `skills/bootstrap-project-harness/references/evals.md` and
  `references/evals/15/` — case 15.
- `.github/workflows/skills.yml` and `lefthook.yml` — the new test commands.

## Operations

1. **Write the script.** `harness-state.mjs` exports `detectStack(dir)`,
   `missingFor(stack, dir)`, `competingFor(stack, dir)`, `smokeOk(dir, stack)`
   and `stateOf(dir)`. When run directly it prints one line per missing item,
   one `competing: <tool>` line per competing tool, and `state: <name>` last.
   Required files, TypeScript: `AGENTS.md`, `README.md`, `justfile`,
   `lefthook.yml`, `eslint.config.js`, `.prettierrc`, `.editorconfig`, and the
   `docs/` skeleton (`specs/`, `prompts/`, `decisions/`). Python: `AGENTS.md`,
   `README.md`, `justfile`, `lefthook.yml`, `pyproject.toml`,
   `.python-version`, same skeleton. Install artefacts — `node_modules`,
   `package-lock.json`, `bun.lock`, `.venv`, `uv.lock`, installed hook binaries
   — are never required.
2. **Competing tools.** Treat as competing, and stop: `husky`, `tslint` for TS;
   `poetry.lock`/`[tool.poetry]`, `pdm.lock`, `Pipfile`, `requirements.in`,
   `black`/`flake8`/`isort`/`mypy`/`pre-commit` for Python. `competing:` lines
   never change the state to `complete` on their own; they suppress the fix.
3. **Ambiguity.** If the stack rules cannot decide (nothing matches) print
   `state: ambiguous` and exit 4. If two stacks match by the same rule number,
   the same. The script does not guess.
4. **Smoke.** If `just` is on PATH and the justfile has a `smoke` recipe, run
   `just smoke` with a short timeout and use its exit code. Otherwise run the
   built-in check: parse the manifest, `node --check docs-check.mjs` (TS) or
   `python3 -m py_compile docs_check.py` (Python), and verify the docs skeleton
   parses as directories. Report which smoke ran.
5. **Tests.** Beside the script: a synthetic tree per state, one with a failing
   `just smoke` (a `justfile` whose recipe exits 1), one ambiguous, one missing
   directory. Assert printed state and exit code. Use `mkdtempSync` under
   `os.tmpdir()`. Then the parity test: read the script's exported list, read
   both template dirs, map `x.template` → `x`, and assert set equality; the
   failure message must say which list to update.
6. **Wire the skill.** Add step 0 above the numbered workflow: run the script,
   obey it; on `complete` report and stop; on `competing:` report and stop; on
   `ambiguous` ask which directory; if the script cannot run, use the table.
   Replace the "read straight off the audit" paragraph so table and script name
   the same four states.
7. **Python smoke.** Add to `templates/python/justfile.template`:
   ```just
   smoke:
       python3 -m py_compile docs_check.py
       python3 docs_check.py
   ```
8. **CI and hooks.** Add
   `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` to the test
   step in `.github/workflows/skills.yml` and to the equivalent command in
   `lefthook.yml`.
9. **Case 14 measurement.** Run
   `node scripts/run-evals.mjs --root skills --skill bootstrap-project-harness --case 14 --repeat 3 --run`.
   If all three stop, run `--repeat 12` into a fresh run and use the combined
   rate. At ≥10/12 remove `status: manual`; otherwise keep it and put the rate
   and the failing behaviour in `why:`.
10. **Case 15.** Build `references/evals/15/` as a copy of case 14's fixture with
    `lefthook.yml` removed, plus its `git.json`. Case block: prompt "Set up the
    harness here.", `tags: harness-state`, expectations that it names the missing
    piece and fixes only it, asserts `file lefthook.yml` and `unchanged
    eslint.config.js`. Run `--repeat 3`; un-manual at 3/3.
11. **Update the spec** to `implemented` with the measured rates, and regenerate
    this prompt's `spec_sha`.

## Norms

- Zero new dependencies; Node 20; no CLI framework.
- Comments explain a check's reason, not what the line does.
- Stack specifics live in the required-file lists and templates; prose stays
  stack-agnostic.
- Conventional commits, imperative subject ≤72 chars, body explains why.
- The existing "additive only" and "report competing toolchains" rules are
  preserved, now with a machine-readable `competing:` line.

## Safeguards

- Do not write to the target repo — the script reads only.
- Do not treat a missing install artefact as a gap.
- Do not run `npm`, `uv` or any installer; `just smoke` is the only external
  command, and only when it exists.
- Do not let a `competing:` repo become `complete`; report and stop.
- Fail toward `partial`: a required file that cannot be read is missing, not
  present. A wrong `complete` is worse than a wrong `partial`.
- Do not change the templates' installed content beyond the Python `smoke`
  recipe.
- Do not edit the eval runner or the matrix.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | `node --test skills/bootstrap-project-harness/scripts/harness-state.test.mjs` — four states, failing smoke, ambiguous, missing directory |
| AC-2 | Script on `references/evals/14` with `node_modules` absent prints `complete`, exit 0; on a copy with a broken `smoke` recipe prints `partial` |
| AC-3 | Read `SKILL.md`: step 0, `competing:` handling, `ambiguous` handling, fallback line |
| AC-4 | Case 14 at 12 runs; rate in `why:` decides `status:`; AC-4 recorded as passed or failed |
| AC-5 | `just smoke` in a Python fixture exits 0 without `uv sync` |
| AC-6 | `validate-skills`, `--list --check`, and both new test files pass |
| AC-7 | Case 15 at 3 runs: `file lefthook.yml` passes, no first-pass "complete" |
| AC-8 | `node --test skills/bootstrap-project-harness/scripts/template-parity.test.mjs` fails when a template file is added without the list |

Done when every AC passes and the spec status is updated.
