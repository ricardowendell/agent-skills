# Eval coverage

Inventory of the cases in `skills/*/references/evals.md`: what exists, how it is
staged, and what has actually been measured. Counts come from
`node scripts/run-evals.mjs --root skills --list` and from the fixture
directories; they are not estimates.

| Skill | Cases | Trigger | Manual | Fixture | Evidence recorded |
| --- | --- | --- | --- | --- | --- |
| `audit-docs` | 4 | 2 | 0 | tree 1; tree 3 staged via `git.json`; tree 4 drift fixture | case 3: 3/3, skill loaded 3/3 (`why:`, no run dir); case 4: 3/3, defect + intentional evolution + future filtered, no writes (`2026-11-05T08-46-00--audit-docs`) |
| `bootstrap-project-harness` | 15 | 2 | 1 | trees 1, 2, 3, 5, 7, 9, 10, 11, 14, 15; 14 and 15 via `git.json` | case 14: 12/12 re-judged (first pass 9/12 on a reply regex); case 15: 3/3 (`why:`, no run dir) |
| `capture-idea` | 3 | 2 | 0 | trees 1–3 | none |
| `find-blind-spots` | 4 | 2 | 0 | tree 4 | case 4: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `groom-backlog` | 7 | 2 | 0 | trees 1, 3, 4, 5 | ablation on 4 fixture cases, 2026-11-05: both arms 4/4; index-first not promoted (tokens +65% on the adversarial case) (`09-32-51`, `09-34-43`, `09-39-15`, `09-43-45`) |
| `implement-from-prompt` | 8 | 2 | 1 | trees 1, 2, 3, 4, 7, 8 | published matrix: #1 and #8 separate 12/12 vs 0/12 on the default (`2026-11-05T12-35-30--implement-from-prompt`, `2026-11-05T12-42-05--implement-from-prompt--without-skill`, `2026-11-05T12-48-46--implement-from-prompt`, `2026-11-05T12-56-03--implement-from-prompt--without-skill`); on `gpt-6-luna` both are 5/5 vs 1/5 (`2026-11-05T13-18-27--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`, `2026-11-05T13-25-10--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-28-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`; the one #1 control pass read the real `SKILL.md`); #7 non-discriminator 5/5 both arms; #2 broken-with-skill (skill-load; gate 2/5); #4 re-measured after SPEC-0016 (write target vs read dependency + fixture `package.json`): 5/5 with vs 3/5 without at `6dd38aa` (`2026-11-05T15-00-48--implement-from-prompt`, `2026-11-05T15-06-58--implement-from-prompt--without-skill`; two control reds are 600 s provider timeouts), so #4 is a non-discriminator and stays as a regression case; #1/#7/#8 kept 5/5 with skill (`2026-11-05T15-30-10--implement-from-prompt`, `2026-11-05T15-36-40--implement-from-prompt`, `2026-11-05T15-44-35--implement-from-prompt`); #3 manual; trigger #5 4/5, #6 5/5 (`2026-11-05T11-52-43--implement-from-prompt`) |
| `process-inbox` | 3 | 2 | 0 | tree 1 | none |
| `record-decision` | 5 | 2 | 0 | trees 1–5 | none |
| `review-code` | 7 | 2 | 0 | trees 1–7 plus `base/` and `base-red/`; 1–4 and 7 via `git.json` | published matrix; #4 fixture revised 2026-11-05: 5/5 with, 3/5 without (`2026-11-05T07-34-32--review-code`, `…07-47-21--review-code--without-skill`); #7 red gate: 3/3 with, 0/3 without (`…09-05-36`, `…09-32-10--without-skill`) |
| `survey-inflight-work` | 4 | 2 | 0 | tree 1 via `git.json` with a local bare `origin`; tree 2 without a remote | iteration 1, 1 draw/case: with-skill 4/4 (`2026-11-04T21-49-16`); control case 1 0/1, only the `unknown` PR state separated (`…21-45-26`); control case 2 0/1, only the no-remote line separated (`…21-57-53`) |
| `audit-code-quality` | 4 | 2 | 0 | trees 1 and 4 via `git.json` | iteration 1: with-skill 4/4 (`2026-11-04T21-55-53`); control case 1 0/1, only coverage `unknown` separated (`…21-47-51`); control case 4 passed once (`…21-57-53`) and failed once (`…21-59-17`, `SCOPE:`/`rule`/`CAPTURE OPTIONS`), so it does not separate reliably |
| `tighten-harness` | 6 | 2 | 0 | trees 1, 2, 3, 5, 6 | case 5: 3/3 passed, skill loaded 0/3 (`why:`, no run dir) |
| `write-implementation-prompt` | 6 | 2 | 1 | trees 1–4 | none |
| **total** | **76** | **26** | **3** | | |

## Evidence rules

- A cell names a measurement only when it names the run directory or cites a
  `why:` note that records the number. A note without a run directory is marked
  `no run dir`: the count is honest, the provenance is not. Anything else reads
  `none`.
- `status: manual` cases are counted in `Cases` and excluded from a run; they are
  design intent, not evidence.
- A per-case number belongs in its `why:` line. A measured set belongs in a doc
  beside `review-code-matrix.md`.
- Never round a repetition into a rate: `--repeat 3` gives three draws, and the
  matrix says five is enough to see a direction, not to publish a per-case rate.

## Known holes

- **Five skills have no recorded measurement of their cases**: `capture-idea`,
  `groom-backlog`, `process-inbox`, `record-decision` and
  `write-implementation-prompt`. Their cases parse and gate the shape of the
  output; nobody has published whether they separate from a run without the
  skill. `groom-backlog` now has a four-case ablation (SPEC-0013), but that
  measured a candidate skill text, not the seven cases in this inventory. The `wip-operations-contract` experiment did measure
  `write-implementation-prompt` and `implement-from-prompt` with frozen copies,
  but it scores no case in this inventory.
- **The mutation pilot is inconclusive by design**: both controls in
  `experiments/mutation/review-code/` came back `invalid` (SPEC-0006). The
  durable artefact is the rule-coverage map, not a pass rate. Re-run against the
  revised #4 fixture (SPEC-0009), `ignore-spec-sha` is a **survivor**: the rule
  is redundant there because the prompt's `spec_sha` supplies the cue.
- **`implement-from-prompt` is measured but two cases remain defective**: #1
  and #8 separate (12/12 vs 0/12 on the default model); #7 is a
  non-discriminator (5/5 both arms); #2 is contaminated by a skill-load defect
  (gate 2/5 with the skill); #4 was fixed by SPEC-0016, which taught the skill to
  tell a write target from a read dependency, and re-measured at 5/5 with the
  skill against 3/5 without it — the fixture's new `package.json` lowered the
  control's bar as well, so #4 is now a regression case instead of broken; #3
  stays `manual`. The judge also marks expectations `unverifiable` when the
  evidence is in a tool call. See `implement-from-prompt-matrix.md`.
- **`review-code` #2 left the matrix**: it measured 5/5 in both arms, so it is
  kept as a regression case rather than a discriminator.
- **`audit-code-quality` #4 does not separate reliably**: its control arm passed
  on the first draw (`2026-11-04T21-57-53`) and failed on the second
  (`…21-59-17`) on the contract assertions (`SCOPE:`, `rule`/`judgement`,
  `CAPTURE OPTIONS`). Keep it as a regression case, not a discriminator; it
  separates only when the control drops the output contract.
- **Three cases are `manual`**: `bootstrap-project-harness` #8,
  `implement-from-prompt` #3, and `write-implementation-prompt` #3. They run
  nowhere today.

## How to update

```sh
# the inventory
node scripts/run-evals.mjs --root skills --list

# which cases stage a committed repo
find skills -name git.json

# which cases are manual (format lines also contain the string)
grep -rn '^[[:space:]]*- status: manual' skills/*/references/evals.md
```

Recount the totals, update the row you changed, and leave `none` alone unless a
run directory or a `why:` note backs the claim.
