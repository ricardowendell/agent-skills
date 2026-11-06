---
id: SPEC-0021
title: Give the judge the tool calls it is already being asked about
status: implemented
priority: P1
task: TASK-27
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - backlog/tasks/task-27 - evals-judge-marca-unverifiable-quando-a-evidência-está-em-tool-calls.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/judge.mjs
  - scripts/lib/evals/judge.test.mjs
  - scripts/lib/evals/events.mjs
  - scripts/lib/evals/events.test.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/rejudge.mjs
  - scripts/lib/evals/rejudge.test.mjs
  - scripts/replay-evals.mjs
  - scripts/lib/evals/cli.test.mjs
  - docs/evals/implement-from-prompt-matrix.md
  - docs/specs/active/SPEC-0021-judge-tool-evidence.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0021: Give the judge the tool calls it is already being asked about

## Purpose

The judge is told to grade a run from "the reply and the command log", but the
command log is only the **first line of each shell command plus its exit code**.
Everything the agent did through `read`, `edit`, `write`, `glob` and `skill` is
invisible. Two measured cells show the cost:

- **`implement-from-prompt` #1, with skill, `2026-11-05T11-45-57`** — 5/5 on every
  deterministic assertion, but the judge passed **0/5**. Repetition 1 reports
  expectations 1, 3 and 6 as `unverifiable`. The transcript has 14 tool calls:
  `skill`, reads of the prompt/spec/`AGENTS.md`, two edits to the spec (the
  `in_progress` → `implemented` transition) and the `bun test` run. The evidence
  exists; the judge was never shown it.
- **`implement-from-prompt` #7, control, `2026-11-05T12-00-00--without-skill`** —
  four of five draws failed the judge with expectation 1 `unverifiable`. The
  judge quoted the command log line `$ node --test  [exit 1]`; `verifyEvidence`
  searches a corpus where that line has no `$ ` prefix, so a correct `met` was
  downgraded. The deterministic reading of the same cell is 5/5.

A third, smaller defect is in `verifyEvidence` itself: evidence shorter than
eight characters after normalisation (`exit 1`) produces zero searchable
segments, and a `met` with zero segments falls through to `unverifiable`.
Absence of a *quote* is not absence of *evidence*.

## User Outcome

A judge verdict matches what the run actually did. `unverifiable` means the
transcript genuinely does not show the expectation, not that the judge was
handed the wrong half of the transcript. The existing rule is unchanged: the
judge can fail a deterministic pass, never rescue a deterministic failure.

## Scope

- **One evidence corpus, built once.** Add a compact tool-call ledger derived
  from the same JSONL stream that already feeds `replyText`/`toolCalls`:
  - `skill` → loaded id and directory;
  - `read` / `glob` / `grep` → the path or pattern only, never the file body;
  - `edit` / `write` → path, and the changed lines (`oldString`/`newString` or the
    written content) truncated to a fixed budget;
  - `shell` → command, exit code, and the last lines of output, truncated;
  - anything else → tool name and its first input field.

  The ledger is a presentation of the run, not a second source of truth: it is
  built by `events.mjs` from the stream, and both the judge prompt and
  `verifyEvidence` receive **the same string**. That is what stops the two from
  drifting apart again.
- **Judge prompt.** The system prompt may cite the reply or the tool log, with
  the same verbatim-quote rule. The ledger is labelled as the run's own tool
  calls, distinct from the command log, so a judge does not read a `read` line as
  something the agent said. `## Command log` stays next to `## Tool calls`: the
  matcher accepts either source, and the command log is a subset of the ledger,
  so keeping both costs a few lines and preserves the old quotations.
- **Evidence verification.** `verifyEvidence` searches the corpus the judge was
  given, normalises a leading `$ ` and code fences, and accepts a short but
  literal quote. Empty evidence stays `unverifiable`: a `met` with nothing to
  point at is still a finding.
- **`unverifiable` keeps failing the case.** With the evidence now supplied, the
  honest rule stands: absence of evidence is a finding, not a pass. The spec
  fixes the instrument rather than lowering the bar.
- **Re-judge without new draws.** A `scripts/lib/evals/rejudge.mjs` module that
  rebuilds the judge prompt from a stored transcript, calls the judge, and returns
  per-draw verdicts plus a per-case tally; `scripts/replay-evals.mjs` exposes it
  as `--judge <model>` and `--json`. `--run <id>` narrows the scan to one stored
  run by prefix match on the directory name; it exists because `--judge` without
  it re-judges every stored run of a case, and the measurement must select two
  directories out of a growing history. The module is what the tests drive with a
  stub spawn, so the CLI stays thin. It writes nothing into the immutable run
  directory; the JSON goes to stdout so it can be saved under
  `~/.local/share/opencode/evals/rejudge/`. No agent draw is spent, and a stored
  `result.json` is never rewritten.
- **Publication.** Update the *Judge calibration* text in
  `docs/evals/implement-from-prompt-matrix.md` with the measured before/after and
  the rule that re-judging needs the same three provenance hashes.

**Blast radius.** The judge prompt, the evidence check and a replay-only CLI.
`run-evals --judge` keeps the same contract; a new run just gets better evidence.
No assertion, fixture, gate or case prompt changes.

## Non-Goals

- No change to `expect:` lines, `assert:` lines, fixtures or the skill gate.
- No relaxation of the "judge can only fail" rule.
- No new model, no change of the default judge, no judge in CI or in the hook.
- No change to stored run directories or to `result.json`'s schema. The re-judge
  output is a separate artifact.
- No attempt to make every expectation verifiable by adding the fixture to the
  prompt: the judge must not grade the code instead of the behaviour.

## Flow

1. **F0 — build the ledger.** `evidenceLedger(out)` in `events.mjs`, with a test
   that a stream containing `read`, `edit` (with `oldString`/`newString`), `write`
   and `shell` (with output) yields the expected compact lines, and that the
   ledger does not contain the body of a `read` target.
2. **F1 — feed it to the judge.** `judgePrompt(c, { reply, ledger })`; the prompt
   shows the ledger under its own heading. `verifyEvidence` receives
   `[reply, ledger].join("\n")`.
3. **F2 — fix the matcher.** Normalise `$ `, code fences and whitespace; accept a
   literal short quote; keep empty evidence unverifiable. Tests for each case,
   including the exact `$ node --test  [exit 1]` shape from #7.
4. **F3 — replay judge.** `--judge <model>` on `replay-evals.mjs`, delegating to
   `rejudge.mjs`, which reuses `judgePrompt`, `runJudge`, `judgeOutcome` and the
   case's `expect` lines. Test with a stub spawn so CI spends no model call: a
   judge reply that cites a tool line keeps `met`, one that cites nothing stays
   `unverifiable`, and a draw that failed deterministically is never turned into a
   pass.
5. **F4 — measure.** Re-judge the stored draws below at
   `opencode-go/gpt-6-luna`, threshold `0.8`, and publish the per-case tally. No
   agent draw.
6. **F5 — publish.** Add the measured rows and the re-judge instruction to the
   matrix doc; leave `coverage.md` to SPEC-0023 so the two docs-only edits do not
   collide.

## Data

- `~/.local/share/opencode/evals/runs/2026-11-05T11-45-57--implement-from-prompt/cases/implement-from-prompt--01/`
  — #1 with skill, 5 draws, judge 0/5.
- `~/.local/share/opencode/evals/runs/2026-11-05T12-00-00--implement-from-prompt--without-skill/cases/implement-from-prompt--07/`
  — #7 control, 5 draws, judge 1/5.
- `transcript.r<i>.md` — the stored JSONL stream the ledger is rebuilt from.
- `docs/evals/implement-from-prompt-matrix.md` — *Judge calibration* and Gate A.

## Acceptance Criteria

1. **The judge sees the tool calls.** `judgePrompt` includes a tool-call ledger
   built from the stream: file paths for reads, path plus changed lines for
   edits/writes, command plus exit plus output for shell, and the loaded skill.
   A unit test proves each shape and that a read's body is not included.
2. **A correct quote from either source verifies.** `verifyEvidence` accepts a
   quote from the reply or from the ledger, including `$ node --test  [exit 1]`,
   and still downgrades a quote that appears in neither. Empty evidence is
   `unverifiable`. Tests for all three.
3. **The measured cells move.** Re-judging the stored draws at
   `opencode-go/gpt-6-luna` gives **5/5** on #1 with skill and **5/5** on #7
   control, with the old readings (0/5 and 1/5) named as the before. If a cell
   does not reach 5/5, publish the observed tally, the failing expectation and the
   transcript line; do not tune the instrument to reach the number.
4. **No agent draw is spent.** The measurement uses `replay-evals --judge` over
   the two stored directories, and the stored `result.json` files are
   byte-identical afterwards (`git status` clean is not enough: compare hashes).
5. **No rescue.** A draw that failed a deterministic assertion is still failed
   after re-judging, and `run-evals --judge` still evaluates the judge only when
   the deterministic result passed. Unit test plus code path.
6. **`unverifiable` is still a failure, and the docs say why.** The matrix's
   *Judge calibration* states that the judge now sees tool calls, that
   `unverifiable` still fails, and that re-judging requires the same
   `fixtureHash` / `promptHash` / `detectorVersion`.
7. **Gates.** The five policy gates pass; no `assert:`, fixture, gate or case
   prompt is touched (`git diff -- skills/` empty).

## Results

Measured on 2026-11-06 at `0a53010`, judge `opencode-go/gpt-6-luna`, threshold
`0.8`. Ten judge calls (5 + 5), zero agent draws. Both commands were run from
this worktree:

```sh
node scripts/replay-evals.mjs --dir "$HOME/.local/share/opencode/evals" --skill implement-from-prompt --case 1 --run 2026-11-05T11-45-57 --judge opencode-go/gpt-6-luna --json
node scripts/replay-evals.mjs --dir "$HOME/.local/share/opencode/evals" --skill implement-from-prompt --case 7 --run 2026-11-05T12-00-00 --judge opencode-go/gpt-6-luna --json
```

`--run` selects exactly the two stored directories; without it `--judge` would
re-judge every stored run of the case, and the measurement would grow with the
history instead of naming its two cells.

The raw `--json` output is kept beside the other local evidence, not in the repo:
`~/.local/share/opencode/evals/rejudge/spec-0021-case-01-r01.json` (sha256
`aa3255ac…8facc9`) and `…/spec-0021-case-07-r01.json` (sha256 `6eb0bc8d…99fef5`).

### AC-3 — the measured cells

| cell | run directory | before | after | tally |
| --- | --- | --- | --- | --- |
| #7 control | `2026-11-05T12-00-00--implement-from-prompt--without-skill`, `implement-from-prompt--07` | 1/5 | **5/5** | `total=5 judged=5 passed=5 failed=0 skipped=0` |
| #1 with skill | `2026-11-05T11-45-57--implement-from-prompt`, `implement-from-prompt--01` | 0/5 | 0/5 | `total=5 judged=5 passed=0 failed=5 skipped=0` |

**#7 — the clean gain.** The four old failures were `met` downgraded by
`verifyEvidence`: the judge quoted `$ node --test  [exit 1]` and the corpus had
the same line without the `$ `. Normalising the leading prompt and searching the
ledger verifies all five. Nothing else about the draw changed.

**#1 — still 0/5, for a new reason.** Per expectation, after the re-judge:

| exp | after | reading |
| --- | --- | --- |
| 1 | `not-met` 5/5 | r1–r4 never read `AGENTS.md`; r5 read it but after the prompt, spec and index. Real behaviour, not missing evidence. |
| 2 | `unverifiable` 5/5 | "applies Norms"; the judge does not see the skill text, by design. |
| 3 | `met` 5/5 | the two spec edits (`ready → in_progress → implemented`, `tests:`) are in the ledger. Was `unverifiable`. |
| 4 | `met` r2; `unverifiable` r1, r3, r4, r5 | composite "creates a test **and** runs verification" against the one-contiguous-passage rule; the ledger has `write: tests/demo.test.ts` and `$ bun test  [exit 0]`, but the judge returns one quote. |
| 5 | `met` 5/5 | unchanged. |
| 6 | `met` r2/r3/r5; `unverifiable` r4; `not-met` r1 | the remaining spread is the run, not the evidence path. |

The instrument worked: tool-call evidence enters the corpus, the `$ ` quote
matches, and the spec edit is visible. #7 is the clean gain; #1 is an honest
failure.

**AC-3 is partially met.** The criterion asked for 5/5 on both cells; #7 reaches
it, #1 does not. Per the criterion's fallback, the observed tally, the failing
expectation and the transcript evidence are published above. **No tuning was
done**: no `expect:`, `assert:`, fixture or case prompt changed (`git diff --
skills/` empty); the residual is TASK-40 (expectation 1's ambiguous "first" and
the skill's reading order), opened at close, not here.

### AC-4 — no draw spent, no stored file written

`sha256` of each `result.json`, measured before the first judge call and after
the last; the values now on disk are the same ones:

```text
9c6f43f9d6a7767406e0b77344e4a92522b461877851d7b8bbbbcf7cb405e30a  .../implement-from-prompt--01/result.json
8ae34b5a0471da4171a0f888f9e45b60efb39f1d8178c58838bbd52445f48bbd  .../implement-from-prompt--07/result.json
```

Both are byte-identical across the measurement. The stored `status` still reads
`failed` in all five #1 draws and one `passed` + four `failed` in #7 — the old
judge verdict, untouched: the re-judge printed to stdout and wrote nothing.

## Stop Conditions

- If the ledger cannot be rebuilt from a stored transcript (a missing field, a
  truncated stream), stop and report which draw; do not re-run the agent to fill
  the gap.
- If #1 or #7 still has a `not-met`, that is a real finding about the run and is
  published, not fixed by widening what counts as evidence.
- If the judge's own reply cannot be parsed for a draw, report the raw reply.

## Budget

Ten judge calls (5 + 5), zero agent draws. A re-judge call is one model turn over
a bounded prompt; if the ledger pushes the prompt past the model's context, trim
the shell output first, not the edits.

## Open Questions

- Should the ledger include the *content* of a written test file? Yes for `write`
  (the assertion is often about what the test asserts) and no for `read` (the
  expectation is that the file was read, not what it says). If that proves too
  generous, the fallback is path + first line, recorded as a follow-up.
