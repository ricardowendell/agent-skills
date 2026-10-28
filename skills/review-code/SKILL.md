---
name: review-code
description: "Review a code change (pull request, branch, or worktree diff) against its source spec and return APPROVE or REJECT with evidence. Use when the user asks for a PR review, code review, diff review, or a merge verdict. Read-only: never edits, never merges, and never approves without walking every acceptance criterion."
stack-agnostic: true
---

# Review A Code Change

## Purpose

Decide whether a change may merge. One question, one answer: does this diff
satisfy its spec without breaking what the project already guarantees?

The output is a verdict with evidence. Not a rewrite, not a list of preferences.

## Workflow

Concept names below are stable; resolve literal paths from `AGENTS.md`.

1. Read `AGENTS.md` (or the project's equivalent agent configuration file).
   Resolve: the specs directory, the prompts directory, the architecture doc, the
   pipeline or workflow doc, and the gate commands.
2. Fix the review object and record it: base ref, head sha, and range. Use the
   worktree diff, a branch range, or the pull request the user names.
3. Read the source spec named in the prompt frontmatter (`spec:`), plus the
   prompt's Safeguards. If the project records a spec hash and it no longer
   matches the spec file, the contract moved after the code was written — reject
   as a stale spec instead of reviewing code against a moving target.
4. Walk the acceptance criteria one by one. For each, record the code that
   satisfies it and the test that proves it. An AC without both is a blocking
   finding; do not replace evidence with an impression.
5. Run the gates the project documents and keep the exact command plus result. A
   gate that cannot run locally is reported as not run; it never counts as a pass.
6. Check the protections the project already has: no secrets, no new dependency
   without a stated reason, no migration or destructive change outside the spec,
   no unrelated refactor, no weakened or deleted test.
7. Check only the norms that are written down — architecture rules, size limits,
   naming, interface language. A finding must cite the rule it violates. Taste is
   not a finding.
8. Decide. APPROVE requires every AC evidenced, gates green or explicitly not
   applicable, and zero blocking findings. Everything else is REJECT.
9. Hand the verdict to whatever gate owns the transition. This skill produces
   evidence; it does not record the gate, merge, or push.

## Refusal Conditions

Stop and say why, instead of producing a verdict, when:

- The change cannot be isolated: no identifiable base ref, no PR target, or a
  worktree that mixes several unrelated changes.
- There is no spec and the user has not declared the intent to review against
  ("no spec: review for regressions and safety").
- The implementation and the review would run in the same session. Say that
  independence is compromised and suggest a fresh session. Proceed only if the
  user insists, and label the verdict as self-review.

## Review Standards

- Evidence over opinion: every finding names `file:line`, the AC or documented
  rule it violates, and one concrete action.
- Severity: `blocking` (must change before merge), `should-fix` (merge is
  defensible, but record it), `nit` (only when it violates a documented rule).
- No finding without an action. No action that requires rewriting the change —
  the fix belongs to the implementer.
- Absence of evidence is a finding, not a pass.

## Output

```text
VERDICT: APPROVE|REJECT
SPEC: <id> (spec hash: match|mismatch|n/a)
RANGE: <base>..<head> (<short head sha>)
GATES: pass|fail|partial|n/a — <exact commands and results>

FINDINGS:
- [blocking|should-fix|nit] path:line — what is wrong; which AC or rule; what to do

## Evidence
- AC-1 — path:line, test name

## Not verified

## Open questions
```

End with one sentence naming the next stage: the project's verification gate,
human merge sign-off, or back to implementation.

## Guardrails

- Read-only. Never edit, commit, merge, push, or fix the code under review.
  Confirm with `git status --porcelain` before and after; an identical result is
  the proof.
- Never approve with a failing or unrun gate.
- Do not invent acceptance criteria; do not mark a missing AC satisfied because
  the code looks reasonable.
- Do not reopen product decisions in review. If the spec is wrong, raise it as an
  open question and send it back to grooming.
- Report what you did not verify, even when the verdict is APPROVE.

## Pipeline

Previous stage: `implement-from-prompt`. Next stage: the project's verification
gate for the `verify` stage (for example `pdlc_verify`), then human merge
sign-off; `audit-docs` runs after merge.

A stale spec is a grooming problem, not a code problem — say so in the verdict.
