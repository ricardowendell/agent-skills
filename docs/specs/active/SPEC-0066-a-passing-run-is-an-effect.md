---
id: SPEC-0066
title: A passing run is an effect, not a command string
status: ready
priority: P1
task: TASK-102
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-102 - evals-ranpass-pontua-o-comando-literal-nao-o-efeito-corpus-10.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/evals/iterative-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/kinds.mjs
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/specs/active/SPEC-0066-a-passing-run-is-an-effect.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0066-a-passing-run-is-an-effect.md --base main
---

## Purpose

`ranpass` answers one question: did the verification command run and succeed? It
answers a different one: did this exact string appear in a shell call that the
harness recorded as exit 0.

The corpus published a false red because of it. In `#10 r1` the model ran
`npm test 2>&1; echo "exit: $?"`; the fixture's `package.json` maps `test` to
`node --test`; the run printed `pass 3 / fail 0` and `exit: 0`. The assertion
`ranpass node --test` scored it **red**, because `scripts/lib/evals/assertions.mjs:270`
compares the regex against `input.command`, and `npm test` is not `node --test`.
The corpus doc said the incumbent "never ran the suite" until the review caught
it.

The same lines have a second defect with the opposite sign. An appended
`; echo "exit: $?"` makes the shell's exit status the `echo`'s, so the recorded
`exit: 0` is the wrapper's, not the gate's. Across the store there are **33**
masked calls, and **5** where the recorded exit contradicts the status the
command itself printed (`0` recorded, `1`–`3` printed). A `ranpass` on one of
those can be green for a suite that failed.

Both are the same mistake: the oracle scores the token, not the effect. This spec
fixes the matcher, then replays every published cell that depends on it.

## User Outcome

- `ranpass node --test` is green when the project's `npm test` script runs
  `node --test` and exits 0 — the effect, not the spelling.
- A masked exit is read from what the command printed, and an unreadable mask is
  **not** a pass. The oracle fails closed.
- Every published verdict that the fix changes is re-derived and republished, so
  `docs/evals/` never carries a number the current code would not produce.

## Scope

### F1 — resolve the command through the fixture's scripts

Before matching, expand a package-manager invocation through `package.json`
`scripts` in the draw's scratch directory:

- `npm test`, `npm start` → the aliased script; `npm run <name>`,
  `npm run-script <name>` → `<name>`; `yarn <name>`, `pnpm <name>`,
  `bun run <name>`, `bun <name>` → `<name>`.
- Expand recursively (a script may call another script), capped at depth 3 with a
  visited set, so a cycle ends the expansion instead of the build.
- Match the assertion regex against the literal command **and** every resolved
  command. `ran` and `ranpass` share the resolver: the kinds differ on exit
  status, not on what counts as running the gate.
- An unreadable, absent or non-JSON `package.json` leaves the call literal. The
  expansion adds evidence; it never invents it.

### F2 — the exit status must be the gate's

`exit: 0` on `npm test 2>&1; echo "exit: $?"` is the `echo`'s status. The call's
effective exit is:

- the recorded `exit`, when the gate invocation is the last command in the shell
  call;
- otherwise the value the command printed — `exit: N`, `EXIT: N`, `exit code N`,
  `NAME-exit: N` in the recorded output, last match wins;
- otherwise **unknown**, and unknown is not green. `ranpass` fails with
  `exit masked, no recorded status` rather than assuming success.

The same rule covers `|| true`, `| tail`, `; echo …$?` and any other suffix that
takes over the status.

### F3 — replay the published cells and republish what moved

Re-run `node scripts/eval.mjs inspect <run-dir> --replay` for every published
cell whose case asserts `ran`/`ranpass` and whose transcript contains a masked
call (`implement-from-prompt` #7 and #10, `review-code` #1–#5 as they appear in
`docs/evals/coverage.md`). This is a replay, not a draw.

For each cell, publish the verdict before and after. A cell that flips is
republished with the new count and the assertion that moved; a cell that does not
flip is left byte-identical. `#10` in particular: `r1` must now pass `ranpass`,
and its class is re-derived from the new count, not asserted in advance.

## Non-Goals

- **No change to the load gate.** A draw where the skill never loaded stays
  `failed` and `#10` stays `unresolved` while only two of five draws loaded. That
  is `TASK-101`, and the corpus names it.
- **No shell interpreter.** No command is executed and no shell is parsed. The
  expansion reads `package.json`; the mask rule reads the recorded output. Both
  are pure functions of the transcript and the fixture.
- **No new assertion kind and no new status.** The vocabulary stays
  `passed`/`failed`/`unscored`/`staged`.
- **No paid draw.** Every test seeds a transcript; every republication is a
  replay of a stored run.
- **No loosening of the other kinds.** `reply`, `filematch` and `verdict` are
  untouched.

## Flow

1. **F1 — resolver.** `resolveCommands(command, scratch)` returns the literal plus
   resolved forms. Unit tests: `npm test` → `node --test`; `npm run build` →
   `tsc`; nested script; cycle; malformed `package.json`; no `package.json`.
2. **F2 — effective exit.** `effectiveExit(call)` returns `{ code, why }`. Unit
   tests: last command; masked with printed `exit: 0`; masked printed `exit: 1`;
   masked with nothing printed; `| tail`; `|| true`.
3. **F3 — wire and replay.** Use both in `check()`; then replay the published
   cells and write the before/after table.
4. **F4 — document.** `kinds.mjs`'s `ranpass` summary states the resolution and
   the fail-closed rule; `docs/evals/` carries the replayed verdicts.

## Data

- `scripts/lib/evals/assertions.mjs` — `check()`, the `ran`/`ranpass` branch.
- `scripts/lib/evals/assertions.test.mjs` — the `transcript()` helper already
  builds the exact event shape `toolCalls` reads.
- `evals/implement-from-prompt/fixtures/10/package.json` — `test: node --test`.
- `~/.local/share/opencode/evals/runs/2026-11-08T06-35-22--implement-from-prompt--agentworks-deepseek-v4-1-flash`
  (#10 r1, the false red) and the twelve transcripts carrying a masked call.
- `docs/evals/iterative-corpus.md:51-59`, `:165-179` and
  `docs/specs/SPEC-0034-iterative-corpus.md` — the published `#10` paragraph
  this spec corrects a second time.

## Acceptance Criteria

1. `ranpass node --test` is green for a recorded `npm test` whose fixture maps
   `test` to `node --test` and whose printed status is 0.
2. The resolver handles the four package managers, nested scripts, a cycle and a
   malformed `package.json` without throwing; a missing `package.json` keeps the
   literal match.
3. A masked exit whose printed status is non-zero is **not** green, even though
   the recorded exit is 0.
4. A masked exit with no printed status fails closed with
   `exit masked, no recorded status`.
5. An unmasked call behaves exactly as before — the existing `ran`/`ranpass`
   tests pass unchanged.
6. Every published cell that flips is republished with its before/after verdict;
   every cell that does not flip is byte-identical.
7. `#10`'s class is re-derived from the post-replay count and the routing finding
   is still named. A `ranpass` pass does not promote `#10` to a separator.
8. `kinds.mjs` states the resolution and the fail-closed rule for `ranpass`.
9. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Resolve, do not match harder.** Widening the regex to `npm test|node --test`
  would encode one fixture's script name in the corpus. The script chain is data
  in the fixture; the oracle should read it.
- **Fail closed on a masked exit.** The alternative — trust the recorded status —
  is what produces a false green today. A missing status is a gap in the
  evidence, and the honest verdict for a gap is not "passed".
- **`ran` shares the resolver.** `ran` asks whether the command ran; a script
  invocation is the command. Keeping the literal rule for `ran` and the resolved
  rule for `ranpass` would make the two kinds disagree about what happened.
- **Republish, do not re-measure.** A replay is the same transcript judged by the
  current code. Spending a draw to rediscover a stored one buys nothing.

## Open Questions

None.

## Prompt Notes

- Put the resolver beside `safeRegex`/`toolCalls` usage in `assertions.mjs`; do
  not reach into `execute.mjs`. The function takes the scratch path and the
  command string.
- `toolCalls(out)` already exposes `output` (`scripts/lib/evals/events.mjs:60`);
  the printed-status rule reads it, not the reply text.
- The `; echo …$?` suffix is the common case but not the only one; treat "the
  gate invocation is not the last command" as the rule, not the pattern.
- Replay with `node scripts/eval.mjs inspect <run-dir> --replay`; never resume or
  re-run a cell. If a replay is unreadable, report the cell as not verified
  rather than guessing.

## Results

### What changed

- **F1 — `resolveCommands(command, scratch)`** (`scripts/lib/evals/assertions.mjs`).
  Splits a shell call quote-aware into commands (keeping `2>&1`/`&>file`
  redirections whole), maps `npm test`/`npm start` to `scripts.test`/`scripts.start`,
  `npm run[ -script] X` / `yarn X` / `pnpm X` / `bun run X` / `bun X` to
  `scripts.X`, and recurses through the script body at depth ≤ 3 with a
  per-chain visited set. The literal command is always returned first. A missing,
  unreadable or non-JSON `package.json` returns the literal alone; nothing throws.
  `ran` and `ranpass` both match the literal **and** every resolved form.
- **F2 — `effectiveExit(call, { gateLast })`**, in this order:
  1. the recorded `exit` when the gate invocation is the last command of the
     shell call;
  2. an explicit status the command printed — `exit: N`, `EXIT: N`,
     `exit code N`, `NAME-exit: N`, `GATE_EXIT=0` / `$?` / `${pipestatus[…]}` —
     last match wins;
  3. the test runner's own counters from the last verdict block in that call's
     output: red on `ℹ fail [1-9]`, `# fail [1-9]`, `npm ERR!`, or
     `Tests: … [1-9]… failed`; green on `ℹ pass [1-9]`, `# pass [1-9]`, or
     `Tests: … passed` with no failed count. `✖` alone is **not** a failure
     marker: node prints it for skipped and todo tests too;
  4. otherwise **unknown**, and unknown is not green —
     `exit masked, no recorded status`.
  A non-zero recorded exit on a masked call is kept as the conservative reading
  (this preserves the existing `events.test.mjs` stream at `exit 1`); only a
  zero recorded exit can manufacture a green.
- **F4 —** `kinds.mjs`'s `ranpass` summary states both the resolution and the
  fail-closed rule.

**Review correction.** The first F2 draft read only an explicit printed status.
A `| tail` pipeline that printed no `exit: N` therefore became unknown, and the
replay turned green suites red in `review-code` #1, #8, #9, #10 and
`implement-from-prompt` #10's control. That was the original defect inverted.
The rule above reads the runner's counters when the wrapper hides the exit, and
the audit was re-run from scratch. Every one of those cells returns to its
published count.

### F3 — replay (no draw, no resume)

`node scripts/eval.mjs inspect <run-dir> --replay` over every published cell whose
case asserts `ran`/`ranpass`. "Published" is the count in `docs/evals/` on `main`
(the SPEC-0056 table carries a measured and a SPEC-0062 replayed column; the
table shows both where they differ). "Replay" is the current code on the same
transcript. Zero paid draws.

| cell | arm | run dir | published | replay | moved |
| --- | --- | --- | --- | --- | --- |
| `implement-from-prompt` #10 | with-skill | `2026-11-08T06-35-22--implement-from-prompt--agentworks-deepseek-v4-1-flash` | 1/5 | **2/5** | **yes — `ranpass node --test`: r1 `failed`→`passed` because F1 resolves `npm test` → `node --test`; r4 was already green** |
| `implement-from-prompt` #10 | control | `2026-11-08T06-37-25--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 5/5 | no |
| `implement-from-prompt` #7 | with-skill | `2026-11-05T15-36-40--implement-from-prompt` | 5/5 | 5/5 | no (`ran` only; the literal already matched) |
| `implement-from-prompt` #7 | control | `2026-11-05T12-00-00--implement-from-prompt--without-skill` | 5/5 judged | 5/5 deterministic | no; the stored 1/5 is the judge, which `--replay` does not re-run, and r2–r5 are the SPEC-0062 stance re-read |
| `review-code` #1 | with-skill | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | no |
| `review-code` #1 | control | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 0/5 | no |
| `review-code` #2 | with-skill | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | 4/5 | 4/5 | no |
| `review-code` #2 | control | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 4/5 measured, 5/5 replayed | 5/5 | no new move (SPEC-0062 stance re-read) |
| `review-code` #7 | with-skill | `2026-11-10T15-31-48--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | no (`ran` only) |
| `review-code` #7 | control | `2026-11-10T15-35-51--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 0/5 | no (`verdict REJECT`) |
| `review-code` #8 | with-skill | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | no |
| `review-code` #8 | control | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 measured, 5/5 replayed | 5/5 | no new move (SPEC-0062 stance re-read) |
| `review-code` #9 | with-skill | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | no |
| `review-code` #9 | control | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 3/5 measured, 4/5 replayed | 4/5 | no new move (SPEC-0062 stance re-read) |
| `review-code` #10 | with-skill | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | no |
| `review-code` #10 | control | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 0/5 | no |
| `audit-code-quality` #8 | with-skill | `2026-11-10T13-45-48--audit-code-quality--agentworks-deepseek-v4-1-flash` | 3/5 | 3/5 | no (`ran` passed before and after) |
| `audit-code-quality` #8 | control | `2026-11-10T13-49-08--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 0/5 | no |
| `audit-code-quality` #9 | with-skill | `2026-11-10T13-59-02--audit-code-quality--agentworks-deepseek-v4-1-flash` | 4/5 | 4/5 | no |
| `audit-code-quality` #9 | control | `2026-11-10T14-02-40--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 0/5 | no |

Masked calls also appear in `bootstrap-project-harness` #16/#17/#19 and
`tighten-harness` #5 transcripts, but those cases assert no `ran`/`ranpass`
(read from `evals/*/cases.md`), so no published verdict depends on the fix and
none is republished.

**No published count moves except `#10`'s with-skill cell.** That move is F1's
stated effect — `npm test` now resolves to `node --test`, so r1 passes — not a
masked-exit red. Every review-code cell, the `#10` control and both
audit-code-quality cells replay to exactly the count already in `main`; the
stored artefacts are unchanged. The review-code `ranpass` calls that pipe through
`tail` print `ℹ pass N` / `ℹ fail 0` in the same output, so the corrected rule
reads them green.

### `#10`

`#10 r1` now **passes** `ranpass node --test` (verified:
`... transcript.r1.md  passed  failed -> passed`; detail `exit 1, exit 0` — the
first call is red on the unfixed code, the second prints `exit: 0`). `r4` was
already green and stays green (its `| tail` output prints `ℹ pass 3` / `ℹ fail
0`, which the corrected rule reads). With-skill is **2/5** (r1 and r4 pass;
r2/r3/r5 are routing gate-misses) and the control is **5/5**. The class is
**`unresolved`** on the routing failure — only 2 of 5 draws loaded the skill —
and a `ranpass` pass does not make `#10` a separator. The routing finding
(TASK-101) is still named and untouched.

### Gates

All commands from `tests:` exit 0: `validate-skills`, `eval.mjs check`,
`--test scripts/lib/evals/*.test.mjs` (540 pass), `--test
scripts/lib/*.test.mjs` (13), `--test
skills/bootstrap-project-harness/scripts/*.test.mjs` (42),
`check-sensor-parity`, `check-evidence`, `check-staleness`, and `spec-check`
(`contract holds`). Draws spent: **0**. No resume, no `run`.

### Out of scope

- `docs/evals/review-code-matrix.md` is a reading aid over the SPEC-0056 table;
  it is not in this spec's `files:` allow-list and needed no change, because the
  SPEC-0056 cells replay to their published counts.
- `TASK-101` (the routing failure) is not fixed here.
