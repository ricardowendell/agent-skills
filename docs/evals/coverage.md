# Eval coverage

Inventory of the cases in `skills/*/references/evals.md`: what exists, how it is
staged, and what has actually been measured. Counts come from
`node scripts/run-evals.mjs --root skills --list` and from the fixture
directories; they are not estimates.

| Skill | Cases | Trigger | Manual | Fixture | Evidence recorded |
| --- | --- | --- | --- | --- | --- |
| `audit-docs` | 3 | 2 | 0 | tree 1; tree 3 staged via `git.json` | case 3: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `bootstrap-project-harness` | 15 | 2 | 1 | trees 1, 2, 3, 5, 7, 9, 10, 11, 14, 15; 14 and 15 via `git.json` | case 14: 12/12 re-judged (first pass 9/12 on a reply regex); case 15: 3/3 (`why:`, no run dir) |
| `capture-idea` | 3 | 2 | 0 | trees 1–3 | none |
| `find-blind-spots` | 4 | 2 | 0 | tree 4 | case 4: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `groom-backlog` | 7 | 2 | 0 | trees 1, 3, 4, 5 | none |
| `implement-from-prompt` | 8 | 2 | 3 | trees 1, 3, 4, 7, 8 | none |
| `process-inbox` | 3 | 2 | 0 | tree 1 | none |
| `record-decision` | 5 | 2 | 0 | trees 1–5 | none |
| `review-code` | 6 | 2 | 0 | trees 1–6 plus `base/`; 1–4 via `git.json` | published matrix (`review-code-matrix.md`) |
| `survey-inflight-work` | 4 | 2 | 0 | tree 1 via `git.json` with a local bare `origin`; tree 2 without a remote | iteration 1, 1 draw/case: with-skill 4/4 (`2026-11-04T21-49-16`); control case 1 0/1, only the `unknown` PR state separated (`…21-45-26`); control case 2 0/1, only the no-remote line separated (`…21-57-53`) |
| `audit-code-quality` | 4 | 2 | 0 | trees 1 and 4 via `git.json` | iteration 1: with-skill 4/4 (`2026-11-04T21-55-53`); control case 1 0/1, only coverage `unknown` separated (`…21-47-51`); control case 4 passed once (`…21-57-53`) and failed once (`…21-59-17`, `SCOPE:`/`rule`/`CAPTURE OPTIONS`), so it does not separate reliably |
| `tighten-harness` | 6 | 2 | 0 | trees 1, 2, 3, 5, 6 | case 5: 3/3 passed, skill loaded 0/3 (`why:`, no run dir) |
| `write-implementation-prompt` | 6 | 2 | 1 | trees 1–4 | none |
| **total** | **74** | **26** | **5** | | |

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

- **Six skills have no recorded measurement of their cases**: `capture-idea`,
  `groom-backlog`, `implement-from-prompt`, `process-inbox`, `record-decision`
  and `write-implementation-prompt`. Their cases parse and gate the shape of the
  output; nobody has published whether they separate from a run without the
  skill. The `wip-operations-contract` experiment did measure
  `write-implementation-prompt` and `implement-from-prompt` with frozen copies,
  but it scores no case in this inventory.
- **The mutation pilot is inconclusive by design**: both controls in
  `experiments/mutation/review-code/` came back `invalid` (SPEC-0006). The
  durable artefact is the rule-coverage map, not a pass rate.
- **`review-code` #2 left the matrix**: it measured 5/5 in both arms, so it is
  kept as a regression case rather than a discriminator.
- **`audit-code-quality` #4 does not separate reliably**: its control arm passed
  on the first draw (`2026-11-04T21-57-53`) and failed on the second
  (`…21-59-17`) on the contract assertions (`SCOPE:`, `rule`/`judgement`,
  `CAPTURE OPTIONS`). Keep it as a regression case, not a discriminator; it
  separates only when the control drops the output contract.
- **Five cases are `manual`**: `bootstrap-project-harness` #8 and three in
  `implement-from-prompt`, plus one in `write-implementation-prompt`. They run
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
