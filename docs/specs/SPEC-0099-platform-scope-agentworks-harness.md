---
id: SPEC-0099
title: The first-party index names the platform scope
status: implemented
priority: high
task: TASK-123
created_at: 2026-11-19
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-123 - harness-index-agentworks-harness-in-skills.index.json.md
  - docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md
  - docs/specs/SPEC-0086-companion-skills-and-scopes.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills.index.json
  - docs/specs/active/SPEC-0099-platform-scope-agentworks-harness.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0099-platform-scope-agentworks-harness.md
  - node scripts/check-staleness.mjs
---

# SPEC-0099: The first-party index names the platform scope

## Purpose

`skills.index.json` says of itself that a skill which only makes sense in one
repo type belongs to a scope, not to a stack filter. `SPEC-0086` built the index
for the skills that existed then — five scopes plus an empty `data` — and
`agentworks-harness` arrived later (`eb6ea36`, 2026-11-16). The index was edited
afterwards (`fd848f3`, 2026-11-17) to add `python-luminary` and did not add it.
So the catalog names 16 first-party skills while the validator counts 17
(`Scanned 17 SKILL.md across 1 roots`), and no scope describes the one skill that
operates a live external platform.

The cost is not a broken check — nothing under `scripts/` reads this file. The
cost is that a reader of the index concludes the catalog has no platform
territory, and the decision of which scope owns that territory is deferred into
every future spec that touches agent platforms.

## User Outcome

Someone reading `skills.index.json` sees 17 first-party skills in scopes that
describe them, including a `platform` scope for work that operates a live
external system rather than this repo. The stated count can be checked against
the validator in one command and agrees.

## Scope

- **F0 — the scope.** Add a `platform` scope whose `about` names the territory:
  operating a live external platform the repo is wired to — catalog, flows,
  deployments, runs — and which skills serve it. `agentworks-harness` is its
  only member today, and the scope says so rather than describing an empty
  promise.
- **F1 — the count.** Update the `about` sentence at the top from 16 to 17, so
  the file's own claim matches its arrays and the validator.
- **F2 — the check.** Record in the spec results the exact commands that verify
  the invariant: the validator's count, a one-line query proving every
  first-party id appears exactly once, and the staleness report showing no new
  stale cell.

**Blast radius.** One data file. The index is catalog data with no runtime
consumer in this repo: `docs/specs/SPEC-0086` added the bootstrap step against
`companion-skills.json`, not against the index, so no bootstrap flow reads it at
run time. No `SKILL.md` is edited, so no `skillHash` moves and no measured cell
goes stale. No harness, corpus, fixture or template changes.

## Non-Goals

- **Not a regrouping.** Moving skills between the existing scopes is `TASK-131`
  and it depends on this task; ordering the catalog by question answered is not
  in this slice.
- **No second platform skill.** The scope is sized for one member and does not
  pre-commit to future ones; a new member needs its own evidence.
- **No validator for the file.** Nothing under `scripts/` gains a reader or a
  gate. The invariant is checked by the commands in F2, by a human or a reviewer.
- **No `docs/integrations/agentworks.md`.** That doc is missing and deserves an
  owner; it is named here only so the gap is not mistaken for coverage.
- **No frontmatter edits, no description rewrites, no `skillHash` churn.**

## Flow

1. Read the current index and confirm the validator count (`17`) and the index
   count (`16`), so the starting inconsistency is observed rather than assumed.
2. Add the `platform` scope with `agentworks-harness` as its single entry.
3. Update the `about` count from 16 to 17.
4. Verify: validator `All clear`, the id appears exactly once, no duplicate ids,
   and `check-staleness` reports the same cited/stale/uncited numbers as before
   the edit (`85 cited, 55 stale, 3 uncited` at grooming time).
5. Record the observed numbers in `Results`; they are observations, not claims.

## Data

`skills.index.json` keeps its shape:

```json
{
  "scopes": {
    "<scope>": { "about": "<what territory this scope names>", "skills": ["<id>"] }
  }
}
```

- An id appears in exactly one scope; `data` stays the reserved, empty scope
  `SPEC-0086` defined.
- `platform` is additive: no existing scope key, `about` line or member list
  changes except the top-level count in `about`.
- The file remains data. It is not frontmatter and no host routes by it, which is
  why editing it cannot move a `skillHash`.

## Acceptance Criteria

1. `agentworks-harness` appears exactly once in `skills.index.json`, inside a
   scope whose `about` names live-platform work (catalog, flows, deployments or
   runs), and that scope contains no other member.
2. The count stated in the top-level `about` equals the number of ids across all
   scopes (17) and equals the count the validator reports:
   `node scripts/validate-skills.mjs --root skills` prints
   `Scanned 17 SKILL.md across 1 roots`.
3. Every first-party skill id appears exactly once: the validator's set minus the
   installed/upstream skills has no id missing from the index and no id repeated.
4. `node scripts/validate-skills.mjs --root skills` prints `All clear` and
   `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0099-platform-scope-agentworks-harness.md`
   reports no errors.
5. No `SKILL.md` file is modified: the spec's diff touches `skills.index.json`
   and this spec only, and `node scripts/check-staleness.mjs` reports no increase
   over the baseline of 55 stale cited cells.
6. The other scopes keep their members: `pipeline` still holds 7, `verify` 3,
   `observe` 2, `maintain` 3, `record` 1 and `data` 0, with `platform` new at 1.

## Results

Implemented 2026-11-19 in **direct** mode (`docs/pipeline.md:30`: one task, no
dependencies, no reviewer gate). The edit sits in the working tree; nothing is
committed, so the status stays `in_progress` rather than `implemented`.

Observed after the edit, not quoted from the plan:

- `node scripts/validate-skills.mjs --root skills` → `Scanned 17 SKILL.md across
  1 roots.` and `All clear.`
- index query → `scopes: pipeline:7 verify:3 observe:2 maintain:3 platform:1
  record:1 data:0`, `total ids: 17 unique: 17`, `about count: 17`,
  `first-party dirs: 17 missing from index: none indexed without dir: none`,
  `platform: ["agentworks-harness"]`.
- `node scripts/check-staleness.mjs` → `85 cited cell(s), 55 stale, 3 uncited
  citation(s)`, identical to the grooming baseline. No measured cell moved,
  which is the point of the file being data rather than frontmatter.

Acceptance criteria 1–6 hold against those outputs. AC 5's "no `SKILL.md` is
modified" holds because the only files touched are `skills.index.json` and this
spec.

Landed in `37f913a`. The status flip to `implemented` and the close of TASK-123
are the bookkeeping commit that follows it, per `Pdlc-Bookkeeping`.

## Open Questions

- **Does one member justify a scope?** The recorded decision on `TASK-123` chose
  a scope over folding `agentworks-harness` into `maintain`, because `maintain`
  is local work ("bootstrap, tighten one gate, catch a branch up with its base")
  and this skill operates a remote system. The alternative is not reopened here;
  if `TASK-131` decides the six-group model, `platform` folds into "observe" or
  "establish the environment" then, with that decision's evidence.
- **`SPEC-0098` is draft and also lists `skills.index.json`** in its `files:`.
  If it reopens while this spec is in flight, both touch one file. No resolution
  is needed today: `SPEC-0098` has already landed its index entry, and this spec
  is a no-conflict addition as long as neither rewrites the other's scope.
- **Who owns `docs/integrations/agentworks.md`?** Not answered here. The new
  scope makes the absence visible; it does not schedule the doc.

## Prompt Notes

- Requirements: add one scope key with an accurate `about`; correct the stated
  count; change nothing else. The file must stay valid JSON with stable key order
  (existing scopes in their current order, `platform` where it reads naturally,
  `data` still last if that is where it sits today).
- Entities: scope (a named territory with an `about` line and a member list),
  member (a first-party skill id), count (the number in `about`).
- Approach: edit in place, then verify by command, not by reading. The
  inconsistency is arithmetic: 16 vs 17.
- Structure: one file, one addition, one number. If the edit grows a helper
  script, the scope has been exceeded.
- Operations: read the index; add the scope; update the count; run the validator
  and the staleness report; paste the observed lines into `Results`.
- Norms: data not frontmatter, per `SPEC-0086`; no id appears twice; a scope with
  no measured member stays empty rather than aspirational.
- Safeguards: no regrouping, no second member, no new gate, no `SKILL.md` edit,
  no claim that a measured cell was refreshed.
- Tests: (1) read the file and assert the id appears once inside `platform`;
  (2) assert the stated count equals the actual id count; (3) assert the
  validator count and result are unchanged apart from the index's own consistency;
  (4) assert the staleness report does not grow. All four are shell queries, none
  needs a model or a paid draw.
