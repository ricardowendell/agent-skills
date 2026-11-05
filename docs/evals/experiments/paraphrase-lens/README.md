# Experiment: paraphrase lens in `spec-reviewer`

Status: closed. The candidate did not beat the current reviewer, so
`agents/spec-reviewer.md` and `claude/agents/spec-reviewer.md` are unchanged.
This directory keeps the corpus, the runs and the reason.

## Hypothesis

A reviewer that first paraphrases what it understood — outcome, change, decided
facts, open inventions, delivery evidence — finds gaps the current reviewer
misses, without inventing findings on specs that are already complete.

## Corpus

Six small specs, three with exactly one planted gap and three clean. The answer
key is next to each case and was never staged into the reviewer's workspace.

| case | kind | planted gap |
| --- | --- | --- |
| 1 | gap | no user outcome; only a worker action and an hourly scan |
| 2 | gap | AC-1 keeps exports 30 days, AC-2 deletes them after 7 |
| 3 | gap | "relevant and fast" has no measure |
| 4 | clean | bulk archive: outcome, three testable ACs, non-goals |
| 5 | clean | rate-limit header: exact header, 429, non-goals |
| 6 | clean | cache-hit log line: one line per lookup, countable |

## Method

The reviewer is an agent, not a skill, so `run-evals.mjs` is not used. `run.sh`
builds a throwaway `HOME` containing only the arm's `spec-reviewer.md` under
`.config/opencode/agents/`, symlinks the runtime and auth entries the runner
already shares, and runs:

```sh
opencode run --format json --auto --agent spec-reviewer --standalone \
  "Review docs/specs/<spec>. Report your findings."
```

The prompt is neutral: an earlier pass asked the reviewer to "report what you
understood", which made both arms paraphrase and was discarded.

```sh
./run.sh baseline 1   # ... through case 6
./run.sh candidate 1  # ... through case 6
```

## Results, 2026-11-05

One draw per case per arm, default model.

| case | baseline | candidate |
| --- | --- | --- |
| 1 missing outcome | named | named |
| 2 contradiction | named | named |
| 3 unverifiable AC | named | named |
| 4 clean | no false paraphrase | no false paraphrase |
| 5 clean | no false paraphrase | no false paraphrase |
| 6 clean | no false paraphrase | no false paraphrase |

Both arms found all three planted gaps. The baseline's first finding on case 1
says the spec "has no verifiable definition of done" and that "nothing defines
… the observable result" — the same gap the lens is meant to surface. The
candidate's five-question structure makes the reasoning easier to audit, but it
does not change the verdict on this corpus.

Cost moved in one direction:

| measure | baseline | candidate |
| --- | --- | --- |
| reply characters, mean | 5,623 | 6,967 (+24%) |
| output tokens, mean | 1,344 | 1,655 (+23%) |

## Decision

**Not promoted.** The decision rule required the candidate to name at least one
gap the baseline missed, with no new false comprehension finding. It named zero
more. The lens may still be useful as a reading discipline, but this corpus
gives no evidence that it changes what the reviewer finds, and it costs about a
quarter more output.

The agent files are byte-identical to the versions before the pilot. Check with
`git diff --quiet agents/spec-reviewer.md claude/agents/spec-reviewer.md`.

## Limits

- One author wrote both the lens and the corpus. The gaps were planted from a
  generic checklist (missing outcome, contradiction, unverifiable criterion),
  not from the lens questions, but independence is partial.
- One draw per case. The result is a pilot, not a rate; the consistent 3/3 in
  both arms makes a hidden candidate win unlikely but does not measure one.
- The corpus has no repository around the spec, so findings about surrounding
  docs are absent from both arms. That is the same condition for both.
