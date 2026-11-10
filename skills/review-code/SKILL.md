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
   as a stale spec instead of reviewing code against a moving target. Stop there:
   record `SPEC: <id> (spec hash: mismatch)` with the verdict and send it back,
   rather than walking ACs that changed under the diff.
4. Walk the acceptance criteria one by one. For each, record the code that
   satisfies it and the test that proves it. An AC without both is a blocking
   finding; do not replace evidence with an impression.
5. Choose the **risk profile** from the diff, after the AC walk: **fast** for a
   small, contained change, **deep** when the diff touches a public interface,
   auth/security, persistence, schema or migration, concurrency, or project
   policy. Deepen only the dimensions the diff actually touches; see
   [Risk profile](#risk-profile).
6. Run the gates the project documents and keep the exact command plus result. A
   gate that cannot run locally is reported as not run; it never counts as a pass.
7. Probe the deterministic slots that match the changed paths through
   `references/deterministic-checks.md`. Detect the project's own tool, run it
   locally with the exact command, and record the exit status. A tool that is
   absent, unconfigured or broken is `unverified`, never a pass.
8. Check the protections the project already has: no secrets, no new dependency
   without a stated reason, no migration or destructive change outside the spec,
   no unrelated refactor, no weakened or deleted test. Carry the interface
   question into the deep profile: an exported name, arity or return shape is a
   contract even when the suite is green.
9. Check only the norms that are written down — architecture rules, size limits,
   naming, interface language. A finding must cite the rule it violates. Taste is
   not a finding.
10. Decide. APPROVE requires every AC evidenced, gates green or explicitly not
    applicable, and zero blocking findings. Everything else is REJECT.
11. Hand the verdict to whatever gate owns the transition. This skill produces
    evidence; it does not record the gate, merge, or push.

## Risk profile

The profile scales the review; it never replaces the AC walk, the gates or the
withhold rule.

| Profile | When the diff is | What is deepened |
| --- | --- | --- |
| **fast** | small and contained: no public interface, auth/security, persistence, schema/migration, concurrency or policy change | correctness, tests, secrets, scope |
| **deep** | touches a public interface, auth/security, persistence, schema/migration, concurrency or project policy | only the dimensions the diff touches, plus the deterministic slots for the changed paths |

- **Deepen only what the diff touches.** A dimension the diff does not touch is
  not opened; record it as not applicable instead of producing a checklist.
- No dimension is mandatory. A dimension the diff touches and you could not
  verify goes under `Not verified`; it does not become a pass.
- The profile is chosen from the diff, never from the author's description of
  it.

## Refusal Conditions

Stop and say why, instead of producing a verdict, when:

- The change cannot be isolated: no identifiable base ref, no PR target, or a
  worktree that mixes several unrelated changes.
- There is no spec and the user has not declared the intent to review against
  ("no spec: review for regressions and safety"). An unanswered question is not
  a declaration: in a non-interactive or auto-approved run, stop and ask instead
  of adopting the fallback yourself.
- The implementation and the review would run in the same session. Say that
  independence is compromised and suggest a fresh session. Proceed only if the
  user insists, and label the verdict as self-review.

## Review Standards

- Evidence over opinion: every finding names `file:line`, the AC or documented
  rule it violates, and one concrete action.
- Severity: `blocking` (must change before merge), `should-fix` (merge is
  defensible, but record it), `nit` (only when it violates a documented rule).
  Taste is not a finding, and a clean diff is not a finding either.
- A `blocking` finding names the contract it breaks — the AC, the public
  interface, the documented rule — not only the symptom.
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
- **No self-serve fallback.** Without a spec, the fallback ("no spec: review for
  regressions and safety") must come from the user's own message. Never adopt it
  yourself, and never describe it as declared when it was not: an absent or
  unanswered question is not a declaration, whatever the run mode. Withholding
  covers the verdict too: `VERDICT: withheld`, then the basis you need. A REJECT
  judges the change against a contract nobody wrote; it is not the safe option.
- Do not invent acceptance criteria; do not mark a missing AC satisfied because
  the code looks reasonable.
- Do not deepen a dimension the diff does not touch; no scanner is mandatory and
  no checklist is scored.
- Never install, upgrade or configure a tool during a review, and never use
  `npx --yes`. A deterministic slot with no tool is `unverified`, not clean.
- Do not reopen product decisions in review. If the spec is wrong, raise it as an
  open question and send it back to grooming.
- Report what you did not verify, even when the verdict is APPROVE.

## Pipeline

Previous stage: `implement-from-prompt`. Next stage: the project's verification
gate for the `verify` stage (for example `pdlc_verify`), then human merge
sign-off; `audit-docs` runs after merge.

A stale spec is a grooming problem, not a code problem — say so in the verdict.
