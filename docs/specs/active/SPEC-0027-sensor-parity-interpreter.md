---
id: SPEC-0027
title: Name the interpreter the parity check cannot find
status: ready
priority: P2
task: TASK-42
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - CONTRIBUTING.md
  - docs/pipeline.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/interpreter.mjs
  - scripts/lib/evals/interpreter.test.mjs
  - scripts/check-sensor-parity.mjs
  - docs/specs/active/SPEC-0027-sensor-parity-interpreter.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0027: Name the interpreter the parity check cannot find

## Purpose

`check-sensor-parity.mjs` runs the JS and the Python docs-check sensors over the
same fixtures and compares exit code, stdout and stderr. When no `python3` is on
`PATH`, it does not say so. It prints:

```
FAIL clean
  js  exit=0
docs-check passed.

  py  exit=null
undefinedundefined
```

Exit 1, two fixtures "failing", and the actual cause — a missing interpreter —
appears nowhere. That output is indistinguishable from a real divergence between
the two sensor implementations. It cost two commits during the 0.4.0 wave: the
hook looked like it had caught a regression, and the fix was to prepend
`PATH=/opt/homebrew/bin` to a commit command.

The check is the only place in the harness that shells out to another language,
so it is the only place where "the tool is missing" and "the outputs disagree"
collapse into one exit code. This spec separates them.

## User Outcome

A missing interpreter produces one line naming what is missing and what to set,
instead of a false parity failure. With an interpreter present, the check says
which one it used, and the verdict is exactly what it was before.

## Scope

- **A resolver, `scripts/lib/evals/interpreter.mjs`.**
  - `defaultCandidates(env)` — ordered, deduplicated: `env.PDLC_PYTHON` when set,
    then `python3`, `python`, `/opt/homebrew/bin/python3`, `/usr/bin/python3`.
  - `probePython(command)` — runs
    `-c "import sys; print('%d.%d' % sys.version_info[:2])"` with a 5 s timeout
    and returns `{ ok, version }` or `{ ok: false, reason }` where `reason` is
    `missing` (spawn `ENOENT`) or `broken` (non-zero exit, with the first stderr
    line).
  - `findPython({ env, candidates, probe } = {})` — the first candidate whose
    probe succeeds and whose version is at least 3.8. Returns
    `{ command, version }` or `{ command: null, tried: [{ command, reason }] }`.
    `probe` is injectable so the tests never depend on the host's interpreters.
- **`scripts/check-sensor-parity.mjs` uses it.**
  - Interpreter found: print `python <version> (<command>)` once, before the
    fixtures, and compare as today. The comparison stays byte-exact on exit
    code, stdout and stderr.
  - No interpreter found, default: exit 1 with one line on stderr —
    `cannot check sensor parity: no Python 3 interpreter found (tried: …); set PDLC_PYTHON=/path/to/python3`
    — and no fixture is reported as `FAIL`. A candidate that exists but fails to
    run is named with its first stderr line; a candidate that does not exist is
    not spammed.
  - `PDLC_ALLOW_MISSING_PYTHON=1`: print
    `skip python: no interpreter found (tried: …); parity not checked` and exit
    0. The skip is explicit, never silent, and the default stays closed.
  - `run()` stops losing `r.error`: a spawn failure prints the error message.
    The `undefinedundefined` in the current output comes from formatting a
    non-string `stderr` after `spawnSync` failed.
- **A test, `scripts/lib/evals/interpreter.test.mjs`**, inside the existing
  `scripts/lib/evals/*.test.mjs` glob so the selftest and the hook pick it up
  without a policy change.

**Blast radius.** One new pure module and its test, one CLI. The verdict for any
machine with `python3` is unchanged, and no fixture or sensor changes.

**Budget.** Zero draws. The whole spec is model-free.

## Non-Goals

- No change to `docs_check.py` or `docs-check.mjs`; the two implementations stay
  as they are.
- No change to `.githooks/pre-commit` or the `selftest` command in
  `docs/pipeline.md`. The hook already calls the script; only the script's
  message changes.
- No Python 2 support, no interpreter installation, no dependency manager.
- No new gate and no new required tool. The check does not start invoking
  another language anywhere else.

## Flow

1. **F0 — repro** with a stripped `PATH`:
   `env -i PATH="$(dirname "$(which node)")" node scripts/check-sensor-parity.mjs`
   → exit 1, `py exit=null`, `undefinedundefined`.
2. **F1 — resolver** with the injectable probe and the candidate order.
3. **F2 — CLI**: named interpreter on success, one-line diagnosis on absence,
   explicit skip on `PDLC_ALLOW_MISSING_PYTHON=1`, and no `undefined` anywhere.
4. **F3 — tests** for the four paths, run through the existing glob.
5. **F4 — gates**: the five policy commands, including the real parity check
   (2/2 with the host interpreter).

## Data

- `process.env.PDLC_PYTHON` — optional explicit interpreter path.
- `process.env.PDLC_ALLOW_MISSING_PYTHON` — `1` downgrades the failure to a named
  skip.
- `skills/bootstrap-project-harness/references/sensor-parity/` — the fixtures,
  unchanged.

## Acceptance Criteria

1. **A missing interpreter is named.** With no `python3`/`python` on `PATH` and no
   `PDLC_PYTHON`, the script exits 1, prints one line naming the candidates tried
   and the variable to set, and reports no fixture as `FAIL`. Its output contains
   no `undefined`.
2. **A present interpreter is named and unchanged.** The check prints the
   command and version it used and still reports `2/2 fixtures in parity`, exit
   0, with the same byte-exact comparison as today.
3. **A broken candidate does not read as a parity failure.** A candidate that
   exists but cannot run is skipped with its first stderr line, and the next
   candidate is tried; if none works, it is criterion 1, not a sensor
   divergence.
4. **The skip is explicit.** `PDLC_ALLOW_MISSING_PYTHON=1` exits 0 and prints
   `skip python … parity not checked`; unset, the default is closed.
5. **Tests cover the paths.** `interpreter.test.mjs` covers: no candidate,
   first candidate works, a broken shim skipped and a later candidate used, the
   CLI's one-line diagnosis under a stripped `PATH`, and the explicit skip. They
   run under `node --test scripts/lib/evals/*.test.mjs`.
6. **No drift.** The five policy gates pass, `git diff main...HEAD -- skills/`
   is empty, and the spec spends no model draw.

## Results

- **F0 — repro.** Before the change, with `PATH` stripped:
  `FAIL clean`, `py exit=null`, `undefinedundefined`, exit 1. Reproduced.
- **F1 — resolver.** `scripts/lib/evals/interpreter.mjs` exports
  `defaultCandidates`, `probePython` (5 s timeout, injectable `spawn`) and
  `findPython` (injectable `probe`). Each attempt is `missing`, `broken` (with
  the first stderr line) or `old` (version below 3.8).
- **F2 — CLI.** `check-sensor-parity.mjs` resolves once before the fixture loop
  and prints `python 3.15 (python3)`. The comparison is unchanged (exit, stdout,
  stderr byte-exact). `run()` treats `r.error` as a result and keeps
  stdout/stderr as strings.
- **Observed on this host.** A stripped `PATH` still resolves
  `/opt/homebrew/bin/python3` (then `/usr/bin/python3`) from the spec's absolute
  candidates, so the check exits 0 and names the interpreter instead of producing
  the old false failure: `2/2 fixtures in parity`. The closed path is observed
  with no *usable* interpreter (`PYTHONHOME=/nonexistent`, the same control the
  test uses): exit 1, one stderr line, no `FAIL`, no `undefined`. With
  `PDLC_ALLOW_MISSING_PYTHON=1`: `skip python: … parity not checked`, exit 0.
- **F3 — tests.** `interpreter.test.mjs` covers no candidate, first works, a
  broken shim skipped and the next used, an old candidate skipped, the CLI's
  one-line diagnosis, the explicit skip, and the host's interpreter naming
  itself. The host-dependent "works" tests skip when the host has no Python.
  `node --test scripts/lib/evals/*.test.mjs`: 263 pass, 0 fail.
- **F4 — gates.** All five policy commands green; `lint` all clear,
  `selftest` exit 0, parity `2/2`. Zero model draws.

## Open Questions

- **Fail closed or skip by default?** Closed. The check exists because two
  implementations can drift silently; a default skip is exactly that silence.
  The explicit variable keeps a stripped sandbox workable without pretending the
  parity was verified.
- **Is 3.8 the right floor?** The shipped `docs_check.py` runs on the host's
  3.9.6 and on CI's 3.x. If a future template needs a newer floor, the constant
  moves with it; it is not a compatibility promise.

## Prompt Notes

- **Requirements**: distinguish "no interpreter" from "sensors disagree", name
  the interpreter used, keep the verdict identical.
- **Entities**: candidate (command + reason), version tuple, fixture, verdict.
- **Approach**: resolve once at startup, before the fixture loop, so the failure
  happens once and not per fixture.
- **Structure**: pure resolver under `scripts/lib/evals/` with an injectable
  probe; the CLI keeps its current shape and output prefix (`ok`/`FAIL`/summary).
- **Operations**: `spawnSync` with `timeout` and `encoding: "utf8"`; treat
  `r.error` as a first-class result, never as a formatted string.
- **Norms**: one line per event, stderr for the failure, stdout for the verdict,
  no stack trace for an expected absence.
- **Safeguards**: do not weaken the byte-exact comparison; do not add a fixture
  skip; do not print a Python traceback for a missing binary.
- **Tests**: pure resolver tests plus one CLI test with a controlled `env`;
  skip the "works" CLI assertion when the host genuinely has no Python, and say
  so in the test name.
