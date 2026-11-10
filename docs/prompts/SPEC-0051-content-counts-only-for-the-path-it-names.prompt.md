---
spec: SPEC-0051
spec_sha: 206c2ec2f41412dd5ca86f0d9eedd6f8b86adc5b24ff90fe9f2e5a97420a4c31
---

# Implementation Prompt: SPEC-0051 Content counts only for the path it names

## Source Spec

- `docs/specs/SPEC-0051-content-counts-only-for-the-path-it-names.md` (pin `206c2ec2…`)
- Prerequisite: SPEC-0049 (implemented)
- Blocks: SPEC-0050 (its branch is alive; it publishes the two verdicts)

## Requirements

**User outcome.** A corpus hit is a leak only when the call actually produced
**that path's** content. Content from a sibling command, an error message, or a
symlink listing does not count.

**The two measured false positives** (SPEC-0050 control runs):

1. `capture-idea` #1 `r1`: the call is
   `ls "$HOME/.config/opencode/skills" 2>/dev/null; … ; cat "$HOME/.config/opencode/SKILL-SOURCES.md" | head -40`.
   The skills listing returned nothing; the content came from another file and a
   symlink line. Published as `leak`.
2. `groom-backlog` #2 `r2`: `cat /Users/wendell/.agents/skills/groom/SKILL.md 2>&1`
   returned `No such file or directory` — the path does not exist. Published as
   `leak` because the error line names the path.

Both draws recorded assertions and passed them (4/4 and 1/1). Reclassified as
clean: `capture-idea` #1 is a separator (5/5 vs 2/5) and `groom-backlog` #2 a
non-discriminator (5/5 vs 5/5).

**Scope (from the spec):**

- Per-path content evidence: a line naming the path (or a child) in a non-error
  context, or a non-shell result carrying content for that path.
- Error and symlink lines never count: `No such file or directory`,
  `EPERM`/`permission denied`, `Is a directory`, `Not a directory`, and an `ls`
  symlink listing (`… -> …`).
- Without enforcement, the v2 rule is unchanged.
- Replay proof on the two SPEC-0050 controls; **no cell verdict here**.
- Coverage rule sentence and `CHANGELOG` entry.

**Acceptance criteria** (copied from the spec):

- AC-1 — a call naming corpus path A and returning content only from other paths
  yields `denied` for A under enforcement, `leak` without.
- AC-2 — a line naming the path with an error marker or a symlink listing yields
  `denied` under enforcement.
- AC-3 — a line naming the path in a non-error context, or a non-shell result
  with content, still yields `leak` under enforcement.
- AC-4 — the same calls with `enforced: false` keep the v2 result.
- AC-5 — both SPEC-0050 control runs go from contaminated to five clean draws
  with `isolated=yes`; `capture-idea` reads 2/5 passed and `groom-backlog` 5/5.
  Recorded in `## Results`, no verdict published here.
- AC-6 — the detector version moved if the classification changed;
  `check-evidence` exits 0 without rewriting a citation.
- AC-7 — no boundary, case, fixture, skill text, template or Python change; every
  `tests:` command passes.

**Non-goals.** No boundary change, no paid draw, no re-run, no coverage verdict
for the four cells, no five-draw change, no fixture edit.

## Entities

| Term | Meaning |
| --- | --- |
| **content evidence** | a line naming the path in a non-error, non-symlink context, or a non-shell result with content for that path |
| **error marker** | `No such file or directory`, `permission denied`, `Operation not permitted`, `EPERM`, `EACCES`, `Is a directory`, `Not a directory` |
| **symlink listing** | a line containing ` -> ` |
| **corpus hit** | `{ tool, path, kind }`, `kind` ∈ `leak`/`host`/`denied` |

## Approach

Extract a pure `contentFor(call, path)` and use it where the classifier currently
tests "something came back". Keep the existing denial rules ahead of it (exact
denial, directory denial, suppressed probe, cross-call fallback). Under
enforcement the residual is `denied`; without it, `leak`/`host` as before.

A hit is content-covered only when:
- the tool is non-shell and its result carries content (a `read` body, a
  `glob`/`grep` list), **or**
- the call's output has a line that names the path (or a child) and contains no
  error marker and no ` -> `.

Everything else is not content for that path.

Bump `DETECTOR_VERSION`; update the golden digest consciously.

## Structure

- `scripts/lib/evals/leak.mjs` — `contentFor`, `findLeaks`, `DETECTOR_RULES`,
  `DETECTOR_VERSION`.
- `docs/evals/coverage.md` (the rule sentence), `CHANGELOG.md`.
- Do not touch `events.mjs`, the boundary, any case or fixture.

## Operations

1. **The helper.** Add `contentFor(call, path)` as described. Unit tests for the
   two measured shapes plus the red case:
   - sibling content: a call naming `/skills` whose output is another file's
     body and a `… -> …` line → **not content**;
   - ENOENT: `cat: /skills/groom/SKILL.md: No such file or directory` → **not
     content**;
   - real content: an output line naming the path without an error marker →
     **content**;
   - non-shell `read` with a body → **content**.
2. **Wire it in.** Replace the call-level test; keep the denial rules ahead.
   Under enforcement the residual is `denied`.
3. **Parity.** The same calls with `enforced: false` keep `leak`/`host`.
4. **Version.** Bump `DETECTOR_VERSION`; update the golden digest.
5. **Replay proof (AC-5).** Re-judge, read-only:
   - `~/.local/share/opencode/evals/runs/2026-11-09T12-41-57--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`
     → from `findings=1 skillLeaks=1 isolated=no` to five clean draws,
     `isolated=yes`, and the case reading 2/5 passed;
   - `~/.local/share/opencode/evals/runs/2026-11-09T12-55-35--groom-backlog--agentworks-deepseek-v4-1-flash--without-skill`
     → from `findings=2 skillLeaks=1 hostReads=1 isolated=no` to five clean
     draws, `isolated=yes`, and the case reading 5/5 passed.
   Record before/after. Do not publish a cell verdict.
6. **Publication.** Coverage rule sentence and `CHANGELOG` entry.
7. **Gates.** The eight `tests:` commands with `node`.

## Norms

- `node`, not bun. Tests next to the module.
- A rule change bumps `DETECTOR_VERSION`; never edit the golden without changing
  the rule that produced it.
- Comments explain *why*, citing the two SPEC-0050 draws.
- Commit: `feat(SPEC-0051-content-counts-only-for-the-path-it-names): <summary>`.

## Safeguards

- Never mark real content `denied`. A successful `cat`/`read` must stay a leak.
- Do not infer content from the path alone.
- Do not touch the boundary, the corpus roots, any case, fixture, skill text,
  template or Python.
- Do not run a paid draw. The replay reads stored transcripts only.
- Do not publish a verdict for any cell and do not change the five-draw rule.
- Do not touch issue #12 or TASK-70.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Unit: sibling content → not content for `/skills` |
| AC-2 | Unit: ENOENT and ` -> ` lines → not content |
| AC-3 | Unit: a non-error line naming the path, and a `read` body → content |
| AC-4 | Unit: the same calls with `enforced: false` → leak/host |
| AC-5 | The replay lines recorded in the spec match the two before/after values |
| AC-6 | `DETECTOR_VERSION` differs; `check-evidence` exits 0 |
| AC-7 | The eight gates exit 0; `git diff --name-only` ⊆ `files:` |

Done when the two replays show five clean draws and the eight gates are green.
