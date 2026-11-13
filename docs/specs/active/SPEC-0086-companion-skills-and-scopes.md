---
id: SPEC-0086
title: Companions have a scope, and the bootstrap can use it
status: ready
priority: P1
task: TASK-117
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-117 - harness-companions-com-escopo-indice-first-party-passo-no-bootstrap.md
  - docs/analysis/data-corpus/decision.md
  - docs/integrations/datacontract.md
  - docs/specs/SPEC-0085-contract-ab-measurement.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks: []
files:
  - companion-skills.json
  - skills.index.json
  - skills/bootstrap-project-harness/SKILL.md
  - skills/bootstrap-project-harness/references/companions.md
  - README.md
  - docs/integrations/datacontract.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0086-companion-skills-and-scopes.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0086-companion-skills-and-scopes.md --base main
---

# SPEC-0086: Companions have a scope, and the bootstrap can use it

## Purpose

0.9.0 measured the official `datacontract-skills` and left them as the
recommended process route. The reference now lives in
`docs/integrations/datacontract.md`, but a consumer still has to discover it by
reading a doc, and nothing distinguishes a companion that serves any host
(`find-skills`, `agent-browser`) from one that only makes sense in a repo with
the matching signals (data contract skills in a data repo; not in a React app).

This spec adds the missing pieces: a closed companion manifest with **scope and
detection signals**, a single first-party **index grouped by type/domain**, and an
**opt-in step in `bootstrap-project-harness`** that reads the signals it already
detects, suggests the intersection, and records the choice in the consumer's repo.

## User Outcome

A consumer running the bootstrap in a React app sees no data-contract suggestion;
the same bootstrap in a data repo sees `breaking-change-check`/
`create-data-contract` pinned at `dc06664`, with the 0.9.0 evidence, and can accept
or refuse. The choice is written into the consumer's `AGENTS.md`, so a teammate
who clones the repo gets the declaration and can materialize it on demand.

## Scope

- **F0 — the manifest (`companion-skills.json`, closed).** One entry per measured
  companion: `id`, `group`, `scope` (`global|project`), `source` + `sourceUrl`,
  `pin`, `path`, `license`, `signals`, `evidence`. The three 0.9.0 skills are the
  first entries (`project` scope, signals like `*.odcs.yaml`, `contracts/`,
  `datacontract` in dependencies, evidence `SPEC-0085`). A skill without evidence
  does not enter; the unmeasured upstream skills stay listed in
  `docs/integrations/datacontract.md` as available-but-unmeasured.
- **F1 — the first-party index (`skills.index.json`).** The 15 skills grouped by
  scope — `pipeline`, `verify`, `observe`, `maintain`, `record` — as data, **not**
  frontmatter: editing 15 `SKILL.md` files would change every `skillHash` and mark
  the measured cells stale for no consumer benefit (hosts route by description).
  A `data` scope stays empty until a measured data skill exists.
- **F2 — the bootstrap step.** `references/companions.md` documents the step;
  `SKILL.md` adds it after stack detection:
  - locate `companion-skills.json` relative to the skill (`../../` from the
    skill dir in the agent-skills checkout);
  - intersect its `signals` with what the bootstrap already detected (stack,
    files, dependencies);
  - **ask first**, showing id, pin, license and evidence — never auto-install;
  - on accept, install the pinned copy into the agent's skills directory (clone
    + checkout the pin + copy) and write a `## Companion skills` section into the
    consumer's `AGENTS.md` with id, pin and why;
  - if the manifest is absent or nothing matches, do nothing and say so.
- **F3 — screening and staleness.** The `SKILL.md` edit changes the bootstrap's
  `skillHash`, so its measured cells become stale. Run one representative
  case at screening level (1–3 draws, case 1 or 16) to confirm the default flow
  is not derailed, and record in `docs/evals/coverage.md` the skillHash change,
  the staleness delta and the reason (additive opt-in step; default path
  unchanged). A screening is not a separation claim.
- **F4 — publish.** The README points to the index and the manifest; the
  integration doc links the manifest as the machine-readable form; the
  `CHANGELOG.md` `[Unreleased]` entry states what changed and what did not.

**Blast radius.** Two new data files, one skill's body (an additive opt-in step),
the README, the integration doc, the coverage note and the release entry. No
harness, detector, corpus, fixture or other skill changes.

## Non-Goals

- **Not a selection registry.** This is internal organization of the catalog this
  repo owns, not the open template/stack catalogue (and taxonomy) that `#9`
  excludes. No `app-blueprint-selection` and no registry of arbitrary skills.
- No frontmatter edits on the 15 skills; no `skillHash` churn beyond the
  bootstrap's body.
- No installer script and no vendoring: the install is pin + copy from upstream;
  nothing from a third-party repo is committed.
- No auto-install: the bootstrap asks and refuses when the manifest is missing.
- No new manifest entry without a spec that measured it.
- No new assertion kind, runner flag or detector change.

## Flow

1. **F0 — manifest.** Write `companion-skills.json` with the three measured
   entries and the schema above; validate it parses.
2. **F1 — index.** Write `skills.index.json` covering all 15 first-party ids; a
   unit check (or a reviewer grep) confirms every `skills/*/` id appears once.
3. **F2 — bootstrap.** Add `references/companions.md` and the `SKILL.md` step;
   the detail lives in the reference, the step stays short.
4. **F3 — screen.** `node scripts/eval.mjs run bootstrap-project-harness 1
   --repeat 1 --root skills` (screening); record the result and the
   `check-staleness` delta.
5. **F4 — publish.** README, integration doc, coverage, CHANGELOG.

## Data

- `companion-skills.json` — the closed manifest.
- `skills.index.json` — the first-party scopes.
- `skills/bootstrap-project-harness/references/companions.md` — the step's detail.
- `docs/evals/coverage.md` — the staleness note.

## Acceptance Criteria

1. **The manifest is closed and evidenced**: every entry has
   `id/group/scope/source/sourceUrl/pin/path/license/signals/evidence`; only
   measured skills are present; the unmeasured upstream ones are documented as
   such in the integration doc.
2. **The index covers the catalog**: all 15 first-party ids appear exactly once,
   grouped into the five scopes, and no `SKILL.md` frontmatter changed (only the
   bootstrap's body).
3. **The bootstrap step is opt-in and signal-driven**: it locates the manifest
   relative to the skill, intersects signals, asks before installing, installs the
   pinned copy, and records the declaration in the consumer's `AGENTS.md`;
   a missing manifest or a React-style repo yields no data-contract suggestion.
4. **The default flow is not derailed**: a screening draw of a representative
   case passes, and the coverage note records the skillHash change, the staleness
   delta and the reason.
5. **The boundary is written**: the spec, the manifest header or the reference
   says this is internal organization, not the `#9` selection registry.
6. **Nothing third-party is committed**: the pin lives in the manifest and the
   doc; no upstream file enters the repo.
7. **Every `tests:` command passes**, and `files:` is complete.

## Open Questions

- **Which case to screen?** Case 1 ("Set up the harness here") walks the default
  path; case 16 exercises the stack cases. One draw of case 1 is the cheapest
  proof that the additive step does not interrupt the flow.
- **Where does the consumer declaration live?** `AGENTS.md` is the routing
  contract, so a `## Companion skills` section there is the natural place; the
  bootstrap already owns that file's sections.
- **Should the bootstrap read `skills.index.json`?** Not for installation; the
  index is for documentation and tooling. The step reads only the companion
  manifest.

## Prompt Notes

- **Requirements**: a closed manifest with scope and signals, a first-party
  index, an opt-in bootstrap step, a screening and an honest staleness record.
- **Entities**: companion, scope (`global|project`), signal, pin, index, scope
  group, consumer declaration, screening.
- **Approach**: data files first, then the skill body; keep the step short and
  the detail in `references/companions.md`; the manifest is the only list.
- **Structure**: the manifest and the index at the repo root; the bootstrap
  detail in its `references/`.
- **Operations**: validate the JSON; screen case 1; `check-staleness` for the
  delta; the standard gates.
- **Norms**: ask first; no evidence, no entry; the index is data, not
  frontmatter; a screening is not a separation.
- **Safeguards**: no auto-install, no vendoring, no write to a consumer repo
  without consent.
- **Tests**: the gates above; the manifest parses; the index covers the 15 ids.
