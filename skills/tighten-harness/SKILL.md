---
name: tighten-harness
description: Raise a project's quality bar deliberately — inspect the current harness (lint limits, type and test gates, hooks, docs checks), measure the headroom the code already has, and propose one small ratchet backed by evidence. Use after a refactor, at a milestone, or when the harness stopped catching regressions. Applies config changes only, never refactors source, and never loosens a limit to make a failing gate pass.
stack-agnostic: true
---

# Tighten The Harness

## Purpose

Make the existing harness stricter, on purpose and with evidence. The bootstrap installs the first version of the harness; this skill is the loop that keeps it honest as the code improves.

A ratchet is one small, reversible tightening of a signal that already exists. It is not a new tool, not a refactor, and not a cleanup pass.

## Workflow

1. Read `AGENTS.md` first.
2. Resolve from it where the harness lives: the task runner file, the linter config, the type checker config, the test runner config, the Git hooks, and the CI workflow.
3. **Inventory the sensors and their exact thresholds.** Record value plus file and line, for example the file-length ceiling, the function-length ceiling, the cyclomatic-complexity ceiling, the parameter ceiling, the coverage floor, and any rule sitting at `warn` that could be `error`.
4. **Measure headroom.** Run the gates as they are and collect real numbers: which files sit closest to each ceiling, how many rules currently have zero violations, what the actual coverage is. Do not estimate, and do not reuse numbers from an older session.
5. **Pick exactly one ratchet** with the best signal-to-churn ratio. State the expected churn: how many files or rules would violate the new value today. A ratchet that would break dozens of files is a project, not a ratchet.
6. **Propose before applying:** the exact diff, the measurement that justifies it, the expected churn, and how to revert. Wait for approval.
7. **Apply configuration only.** Then run every gate that can run locally. If the tighter value surfaces violations, report them as a follow-up list — do not fix source in the same pass, and do not relax the value you just set.
8. Record the new baseline in the commit message or the PR body, so the next session knows the ratchet already happened.

## What counts as a ratchet

- Lowering a file-length, function-length, complexity, or parameter ceiling.
- Raising a coverage floor to what the suite already achieves.
- Promoting an existing `warn` rule to `error`.
- Turning on a rule that currently reports zero violations.
- Adding a pre-commit step that already passes, so regressions get caught earlier.

## What is not a ratchet

- Refactoring source to fit a new limit.
- Replacing or adding a tool.
- Deleting or weakening a test.
- Loosening a limit, for any reason, in the same pass.
- Enabling a rule that fails today "so it gets fixed later" — that just makes the gate red.

## Guardrails

- **One ratchet per pass.** Two tightenings in one commit make the churn unattributable.
- **Never loosen a limit to make a failing gate pass.** If the gate fails, that is the signal working. Report the violation; loosening needs its own evidence and explicit approval, in a separate change.
- **Never edit source in this skill.** If a violation must be fixed, hand it off as a scoped task.
- **Do not touch product scope.** Thresholds are not product decisions.
- **No harness present?** Stop and point to `bootstrap-project-harness`. Do not invent a harness in this skill.
- **Report what you did not run.** A sensor you could not execute locally is a gap, not a pass.

## Output

End with:

- The sensor tightened, with the old and new value plus file and line.
- The measurement that justified it and the observed churn.
- Gates run, and gates skipped with the reason.
- Follow-up violations, or `None`.

## Pipeline

Runs outside the spec loop, after a few `implement-from-prompt` cycles or at a milestone. `bootstrap-project-harness` installs the initial thresholds; this skill is how they improve.
