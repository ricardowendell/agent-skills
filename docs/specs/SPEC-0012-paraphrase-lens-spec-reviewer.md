---
id: SPEC-0012
title: Paraphrase lens before findings in spec-reviewer
status: implemented
priority: P1
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-18 - spec-reviewer-lente-de-compreensão-antes-dos-findings.md
  - docs/inbox/2026-11-03-egm-para-agent-skills.md
  - agents/spec-reviewer.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - docs/evals/experiments/paraphrase-lens/README.md
---

# SPEC-0012: Paraphrase lens before findings in spec-reviewer

## Purpose

`spec-reviewer` reviews clarity, consistency and scope, and jumps to findings.
The EGM note argues that a reader who receives only the selected materials can
surface assumptions the author considers obvious — but only if the reader first
states what it understood. Today the reviewer never states its understanding, so
a wrong understanding and a missing assumption look the same: a finding.

The lens is therefore **paraphrase before judging**. The open question is
whether it finds real gaps without inventing them. That is a measurement, not an
edit: a paraphrase can be wrong, and a wrong paraphrase turned into a finding is
a false positive with extra confidence.

## User Outcome

A reader deciding whether to adopt the lens sees two numbers from the same
corpus: how many planted gaps the current reviewer misses, and how many the
candidate misses, together with the false findings each produced on clean specs.
If the candidate does not win, the reviewer is unchanged and the result is the
record.

## Scope

- Write the candidate lens as behaviour, not report format. Before any finding,
  the reviewer paraphrases:
  1. what result the user will have;
  2. what changes and what stays;
  3. which decisions are already made;
  4. what still has to be invented to implement;
  5. how delivery will be demonstrated.
  Each answer cites the passage that supports it. An incompatible paraphrase is
  **evidence of a gap to investigate**, not a defect verdict; the finding, if
  any, names the passage that is missing or contradictory.
- Build a corpus of six small specs under
  `docs/evals/experiments/paraphrase-lens/corpus/`: three with exactly one
  planted comprehension gap each (missing outcome, contradictory acceptance
  criteria, unverifiable acceptance criterion) and three clean. The answer key
  lives beside each case and is never staged into the reviewer's working tree.
- Run two arms on the same six specs: the current `agents/spec-reviewer.md` and
  a candidate copy that differs only by the lens. One draw per spec per arm
  (twelve runs); add two draws to a case only when its result is ambiguous.
- Score per case: planted gap named, false comprehension finding on a clean
  spec, and whether the existing findings section still runs after the
  paraphrase.
- Apply the decision rule; edit `agents/spec-reviewer.md` and
  `claude/agents/spec-reviewer.md` only if it passes.

**Blast radius.** One experiment directory and, only on a passing result, two
copies of one agent file. No runner change, no skill change, no new agent, no
change to `review-code` or to the pipeline stage.

## Non-Goals

- **A new reviewer agent or a new pipeline stage.** The pilot decides whether the
  existing agent gains a step.
- **Replacing findings with a paraphrase.** The paraphrase precedes the existing
  findings; the findings section stays.
- **Judging the lens by the Markdown it produces.** Conformance to a five-line
  template is not the outcome; whether a gap is found is.
- **Changing `review-code`.** The lens is about the artefacts before code.
- **Staging the answer key where the reviewer can read it.**
- **A general agent-eval runner.** The pilot is documented commands plus a small
  script in its own directory; the harness is not extended.

## Flow

1. Write the candidate lens text with the five questions and the
   evidence-not-verdict rule.
2. Author the six specs and their answer keys. Plant gaps from a checklist
   (missing outcome, contradiction, unverifiable criterion) rather than from the
   lens questions, so the corpus is not tuned to the candidate.
3. Add a pilot script in the experiment directory that, per arm and case:
   - creates a throwaway `HOME` with the runtime/auth entries the runner already
     symlinks and **no** global `agents/` directory;
   - writes the arm's agent as `$HOME/.config/opencode/agents/spec-reviewer.md`;
   - copies the case's docs into a scratch directory;
   - runs `opencode run --agent spec-reviewer --format json` there and stores
     stdout/stderr plus the agent file hash.
4. Verify provenance once per arm: `opencode agent list` inside the throwaway
   home names `spec-reviewer`, and the hash matches the arm.
5. Run baseline and candidate on the six cases.
6. Score each case against its answer key and record the table.
7. Apply the decision rule: the candidate wins only if it names at least one
   planted gap the baseline missed **and** produces no false comprehension
   finding that the baseline did not produce on the clean specs.
8. On a win, add the lens to both agent copies, above the findings instruction,
   and keep the findings text. On a loss, record it and leave both files
   untouched.
9. Write the README: hypothesis, corpus, answer keys, commands, hashes, model,
   per-case table, cost and decision.

## Data

The experiment directory holds the corpus, the answer keys, the pilot script and
the run outputs. Specs are fixture data, not product specs; they are not under
`docs/specs/`. Nothing in the corpus is staged into the reviewer's working tree;
the scratch directory contains only the spec under review.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The lens is written as behaviour: five paraphrase questions, a
  citation per answer, and the rule that an incompatible paraphrase is evidence
  to investigate, not a verdict. Verified by reading the candidate text.
- AC-2 — The corpus has six specs: three with exactly one planted gap each and
  three clean, with an answer key naming the gap or stating cleanliness.
  Verified by reading the corpus and keys.
- AC-3 — Both arms run on the same six specs, each run records the agent file
  hash and the throwaway-home provenance, and the baseline file is byte-identical
  to `agents/spec-reviewer.md`. Verified by the result manifest.
- AC-4 — The per-case table reports, for both arms, gap named (yes/no) and false
  comprehension finding on clean specs (yes/no). Verified by reading the table.
- AC-5 — The decision rule is applied and its outcome recorded. If it fails,
  `git diff --quiet agents/spec-reviewer.md claude/agents/spec-reviewer.md`
  succeeds after the pilot. Verified by the diff and the README.
- AC-6 — On a passing result, both agent copies carry the lens **before** the
  existing findings instruction, and the findings section is still present.
  Verified by reading both files.
- AC-7 — The README records repo sha, model, both arm hashes, exact commands,
  the per-case table, the decision and the cost in runs and tokens. Verified by
  reading it.

## Result (2026-11-05)

Six-case corpus, two arms, one draw per case, default model. The first pass used
a prompt that asked the reviewer to "report what you understood" and was
discarded: it made both arms paraphrase, so the lens was not the variable. The
reported runs use `Review docs/specs/<spec>. Report your findings.`

| case | baseline | candidate |
| --- | --- | --- |
| 1 missing outcome | named | named |
| 2 contradiction | named | named |
| 3 unverifiable AC | named | named |
| 4–6 clean | no false paraphrase | no false paraphrase |

Both arms found all three planted gaps; the baseline's case-1 finding already
says the spec "has no verifiable definition of done" and that "nothing defines
… the observable result". The candidate's structured paraphrase is easier to
audit, but it changed no verdict on this corpus and cost about 24% more output
(5,623 → 6,967 reply characters; 1,344 → 1,655 output tokens, means).

The decision rule was not met, so the lens was **not promoted**.
`agents/spec-reviewer.md` and `claude/agents/spec-reviewer.md` are unchanged
(`git diff --quiet` succeeds). The corpus, runs and result live in
`docs/evals/experiments/paraphrase-lens/`.

AC-1–AC-4 and AC-7 are met. AC-5 is met: the rule failed and no agent was
edited. AC-6 was not triggered.

## Open Questions

- The same person writes the corpus and the lens. The spec mitigates that by
  planting gaps from a generic checklist, but a truly independent answer key
  would need a second author. If the result is borderline, the honest action is
  to record the dependency rather than promote.
- One draw per case is a pilot, not a rate. If a clean spec gets a false finding
  in either arm, two more draws on that case decide whether the finding is
  stable; the README must say which cells were repeated.
- The lens may be useful in `review-code` before reading the diff as well. That
  is not this spec; it would need its own corpus because the artefact under
  review is different.

## Prompt Notes

- Requirements: candidate lens text, six-case corpus with keys, two arms, twelve
  runs, a decision rule, conditional edit of two agent copies.
- Entities: `agents/spec-reviewer.md`, `claude/agents/spec-reviewer.md`, corpus
  cases, answer keys, throwaway `HOME`, `opencode run --agent`.
- Approach: measure first; the lens text is an input to the pilot, not a change
  to the shipped agent.
- Structure: `docs/evals/experiments/paraphrase-lens/{README.md,corpus/,script}`;
  agent edits only on a win.
- Operations: write lens, author corpus, build the runner shim, run both arms,
  score, decide, edit or record, write README.
- Norms: agent frontmatter uses `description` and `mode: subagent`; the reviewer
  stays read-only (no edit, shell or subagent tools).
- Safeguards: never stage answer keys; never count a paraphrase itself as a
  finding; never promote on a single ambiguous draw; never change permissions.
- Tests: an interaction-level check (a planted gap is named), a state-level
  check (agent files unchanged on a loss; both copies updated on a win), and a
  provenance check (hash and `agent list`).
