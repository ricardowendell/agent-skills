---
name: bootstrapping-project-harnesses
description: Use when starting a new project, bootstrapping a harness for existing code, or setting up git hooks, CI checks, linter limits, and agent conventions. Builds the technical harness (hooks, lint limits, CI) and the product-docs skeleton, seeding docs from existing material or a short interview and delegating classification to process-inbox-notes.
---

# Bootstrapping Project Harnesses

## Overview

A harness defines the how loop: specs, quality checks, and workflow guidance that control how agents build software. Humans stay on the loop improving the harness while agents run execution. This avoids line-by-line inspection and quality drift.

This skill covers **two harnesses** that must both exist:

1. **Technical Harness** — sensors, hooks, quality gates (building it right)
2. **Product Harness** — vision, language, principles, design, voice (building the right thing)

**Scope:** TypeScript/Node projects (bun). Python and other stacks are out of scope for now — do not reach for `mypy`/`ruff` while bootstrapping.

## The Technical Pillars

| Pillar | What | Why |
|---|---|---|
| Guides | AGENTS.md, principles | Tell agents how to behave |
| Pre-commit sensors | typecheck + lint + security | Fast feedback during coding |
| Pre-push sensors | tests + build | Regression protection |
| Repeated sensors | docs-check, modularity | Catch drift over time |
| Self-correction | Custom lint messages | Agents fix before human sees |
| Commit conventions | commitlint | Reviewable history |

## The Product Pillars

| Pillar | What | Why |
|---|---|---|
| Vision | Why product exists, for whom, problem solved | Guides scope decisions |
| Language | Ubiquitous glossary: product term ↔ code entity | Prevents terminology drift |
| Principles | Product design rules (practice > theory, ritual > gamification) | Prevents feature creep |
| Design System | Colors, typography, components, icons, spacing | Visual consistency |
| Voice | Tone of voice, what to say and what to avoid | UI copy consistency |
| Roadmap | Phases, what enters now vs later | Clear scope |

## Principles

- **Additive only.** On an existing repo, never overwrite existing keys, scripts, hooks, or config files. Merge into what is there; on a collision, report it and skip. This applies to `package.json`, `justfile`, `lefthook.yml`, and `eslint.config.js`.
- **Never invent product direction.** Product content comes from the user's existing docs or their answers — never from the agent's imagination.

## Detection

Check the current directory, then pick one of four states:

| State | Signal | Action |
|---|---|---|
| Empty | no `.git`, no source | `git init`, full bootstrap |
| Project, no harness | code exists, no `AGENTS.md` | add sensors + docs skeleton |
| Partial harness | some sensors exist, audit fails | complete only the missing items |
| Complete harness | audit passes | stop |

Partial vs complete is read straight off the audit (does `lefthook.yml`, `.prettierrc`, etc. exist) — there is no stored state or version marker.

## Step by Step

**Before starting:** Create a TodoWrite with each step as a separate item. Mark `in_progress` only when actively working on that step, and `completed` only after that step's audit check passes.

### The canonical docs layout

Create this tree in Step 1, then seed it in the product steps:

```
docs/
  inbox/                       # raw captures (capture-raw-idea)
  backlog/
    now-next-later.md          # groom-backlog-to-specs
    release-plan.md
  product/
    vision.md
    scope.md
    language.md                # ubiquitous language
  principles/
    design.md
    visual-design.md
    voice.md
    product-principles.md
  experience/                  # user journeys (process-inbox-notes)
  system/                      # descriptive only; links to architecture.md
  decisions/                   # ADR-NNNN-*.md
  specs/                       # SPEC-NNNN-name.md
  prompts/
    implementation/            # SPEC-NNNN-*.prompt.md
  architecture.md              # prescriptive rules (sole normative owner)
```

`docs/architecture.md` holds the architecture **rules**; `docs/system/` holds
**descriptions** and must link to `architecture.md` rather than restate its rules.

### Technical steps

1. Create the docs tree above (`mkdir -p …`). No content files yet.
2. Write `AGENTS.md` from `templates/AGENTS.md.template` — it carries this layout and the routing rules.
3. Add `.gitignore` from `templates/.gitignore.template`.
4. Add `.editorconfig` from `templates/.editorconfig.template` (prevents whitespace wars).
5. Add `README.md` from `templates/README.template`.
6. Install lefthook + commitlint, and copy `templates/commitlint.config.cjs` and `templates/lefthook.yml`:
   `bun add -d @commitlint/cli @commitlint/config-conventional && bun x lefthook install`
7. Add `lint-staged.config.mjs` from `templates/lint-staged.config.mjs`.
8. Add `justfile` from `templates/justfile.template`.
9. Ensure `package.json` has the scripts the hooks and justfile call: `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `docs:check`. **Merge — never overwrite an existing script.**
10. Add `.prettierrc` from `templates/.prettierrc.template`.
11. Add `eslint.config.js` from `templates/eslint.config.js.template` (flat config, AI limits).
12. Add `docs-check.mjs` from `templates/docs-check.mjs` and wire the `docs:check` script.
13. (Optional) Add dependency-cruiser from `templates/dependency-cruiser-rules.md`.
14. (Optional) Add CI from `templates/.github/workflows/ci.yml.template`.

> Optional sidecar: create `.nvmrc` (or `.node-version`) for runtime version pinning.

### Product steps (15–18)

Run these **after** the technical harness, and only with a human present.

15. **Detect existing docs.** If `docs/` already holds any non-empty `.md` (outside the skeleton just created), or the README has a product/about section: stop the product phase. Write no product content — do not add, move, rename, or delete any existing file. Record what you found as open questions in `AGENTS.md`, then stop with: *"Existing docs found — run `/process-inbox` to classify."*
16. **Interview for gaps.** Bounded — one pass, ≤7 questions, each skippable. Ask only what is knowable now:
    - `product/vision.md` — problem, audience, solution
    - `product/language.md` — a few core domain terms
    - `principles/product-principles.md` — short, decision-driving rules
    - design system / voice — only if the project has UI
    Do **not** ask about the roadmap — that belongs to `groom-backlog-to-specs`.
17. **Write answers into the template shapes.** Use `templates/product-*.md` as the structure. Transcribe the user's words; do not invent.
18. **Degrade to stubs.** For every skipped or unanswered question, leave the heading plus `<!-- Q: … -->` so `process-inbox-notes` can resolve it later.

### Product Checklist

Before marking product steps done, verify:

- [ ] Vision answers: why, for whom, what problem
- [ ] Language maps product terms to code entities
- [ ] Principles are actionable (guide decisions, not just inspirational)
- [ ] Design System has colors, fonts, component patterns (if UI)
- [ ] Voice has both "do" and "avoid" examples (if UI)
- [ ] Unanswered questions are stubs carrying their question, not invented content

### Templates

`templates/` provides the technical files referenced above, plus the
`product-*.md` structures used in Step 17. The product templates are the **shape**
for either real content (from the interview) or a stub (heading + `<!-- Q: … -->`).

| Template | Destination |
|---|---|
| `product-vision.md` | `docs/product/vision.md` |
| `product-language.md` | `docs/product/language.md` |
| `product-principles.md` | `docs/principles/product-principles.md` |
| `product-design-system.md` | `docs/principles/visual-design.md` |
| `product-voice.md` | `docs/principles/voice.md` |
| `product-roadmap.md` | `docs/backlog/release-plan.md` |

`docs-check.mjs` hardcodes the canonical spec paths — change its constants only if
the repo deviates from the layout above.

## Linter Limits (TS/Node)

| Metric | Limit |
|---|---|
| Cyclomatic complexity | error 10 |
| Max params per function | error 4 |
| Max lines per function | warn 60 |
| Max lines per file | warn 200 |
| Min test coverage | optional |

## Security Checks

Block `.env`, `.db`, and data files at commit. Run `bun audit --audit-level=high`.
Audit dependencies.

## Language Quick Reference (TS/Node)

| Component | Tool |
|---|---|
| Type check | `tsc --noEmit` |
| Linter | ESLint |
| Formatter | Prettier |
| Tests | Vitest or Jest |
| Hook manager | Lefthook |

## Common Mistakes

| Mistake | Reality |
|---|---|
| Defaults are fine | ESLint defaults miss AI failure modes |
| I will add tests later | Pre-push without tests = broken code |
| Just a small project | Small projects grow. Start with structure. |
| Hooks are optional | Without hooks, agents skip checks under pressure |
| Security checks are overkill | Leaked credentials are irreversible |
| Overwriting existing config | Additive only — merge, or report a collision and skip |

## Verification Gate

**IMPORTANT:** Failure to complete all steps results in an incomplete harness. Agents tend to stop early — this section prevents that.

### At start

Create a TodoWrite with one item per step BEFORE touching code:

```
- [ ] Step 1: docs tree
- [ ] Step 2: AGENTS.md
- [ ] Step 3: .gitignore
- [ ] Step 4: .editorconfig
- [ ] Step 5: README.md
- [ ] Step 6: lefthook + commitlint (installed AND configured)
- [ ] Step 7: lint-staged config
- [ ] Step 8: justfile
- [ ] Step 9: package.json scripts (merged)
- [ ] Step 10: .prettierrc
- [ ] Step 11: eslint.config.js (flat config)
- [ ] Step 12: docs-check script
- [ ] Step 13: dependency-cruiser (optional)
- [ ] Step 14: CI (optional)
- [ ] Step 15: detect existing docs
- [ ] Step 16: product interview
- [ ] Step 17: product docs written
- [ ] Step 18: stubs for anything skipped
```

### At end — audit checklist

Run ALL of these commands and verify the expected output:

```bash
# 1. Git exists
git status

# 2. AGENTS.md exists
ls AGENTS.md

# 3. README.md exists
ls README.md

# 4. .editorconfig exists
ls .editorconfig

# 5. Lefthook configured
ls lefthook.yml

# 6. Lefthook hooks installed
ls -d .git/hooks/pre-commit .git/hooks/pre-push .git/hooks/commit-msg

# 7. lint-staged configured
ls lint-staged.config.mjs

# 8. ESLint configured with flat config
ls eslint.config.js

# 9. Prettier configured
ls .prettierrc

# 10. justfile has quality targets (check/typecheck/lint)
grep -q "check:" justfile && echo "OK" || echo "MISSING"

# 11. package.json has the required scripts
grep -q '"typecheck"' package.json && grep -q '"lint"' package.json && echo "OK" || echo "MISSING"

# 12. TypeScript compiles clean
bun x tsc --noEmit 2>&1

# 13. ESLint runs clean (0 errors, warnings allowed)
bun run lint 2>&1 | grep "0 errors" || echo "HAS ERRORS"

# 14. Build succeeds
bun run build
```

### For product docs (steps 15–18), also verify:

```bash
ls docs/product/ docs/principles/ docs/specs/ docs/prompts/implementation/
```

**Do NOT mark any step as completed until its audit command passes.**

### Final gate

Only after EVERY audit command passes, state the result explicitly: list which
commands ran, their output, and anything that failed or was skipped. Do not claim
"done" on a partial pass — report the gap instead.

## Later Sensors

Mutation testing catches assertion gaps in AI tests. Periodic modularity review catches design drift. Agents review results and recommend harness improvements.
