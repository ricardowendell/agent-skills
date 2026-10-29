---
name: bootstrap-project-harness
description: Set up a project's technical harness (git hooks, lint limits, CI) and the product-docs skeleton, for TypeScript/Node or Python (uv). Use when starting a new project, bootstrapping an existing repo, or adding hooks/CI/agent conventions. Seeds docs from existing material or a short interview; delegates classifying existing docs to process-inbox.
---

# Bootstrapping Project Harnesses

## Overview

A harness defines the how loop: specs, quality checks, and workflow guidance that control how agents build software. Humans stay on the loop improving the harness while agents run execution. This avoids line-by-line inspection and quality drift.

This skill covers **two harnesses** that must both exist:

1. **Technical Harness** — sensors, hooks, quality gates (building it right)
2. **Product Harness** — vision, language, principles, design, voice (building the right thing)

**Scope:** TypeScript/Node (bun) and Python (uv). Detect the stack first (see Detection → Stack) and take technical files from `templates/<stack>/`. Other stacks are out of scope.

## The Technical Pillars

| Pillar             | What                        | Why                          |
| ------------------ | --------------------------- | ---------------------------- |
| Guides             | AGENTS.md, principles       | Tell agents how to behave    |
| Pre-commit sensors | typecheck + lint + security | Fast feedback during coding  |
| Pre-push sensors   | tests + build               | Regression protection        |
| Repeated sensors   | docs-check, modularity      | Catch drift over time        |
| Self-correction    | Custom lint messages        | Agents fix before human sees |
| Commit conventions | commitlint                  | Reviewable history           |

## The Product Pillars

| Pillar        | What                                                            | Why                        |
| ------------- | --------------------------------------------------------------- | -------------------------- |
| Vision        | Why product exists, for whom, problem solved                    | Guides scope decisions     |
| Language      | Ubiquitous glossary: product term ↔ code entity                 | Prevents terminology drift |
| Principles    | Product design rules (practice > theory, ritual > gamification) | Prevents feature creep     |
| Design System | Colors, typography, components, icons, spacing                  | Visual consistency         |
| Voice         | Tone of voice, what to say and what to avoid                    | UI copy consistency        |
| Roadmap       | Phases, what enters now vs later                                | Clear scope                |

## Principles

- **Additive only.** On an existing repo, never overwrite existing keys, scripts, hooks, or config files. Merge into what is there; on a collision, report it and skip. This applies to `package.json`, `pyproject.toml`, `justfile`, `lefthook.yml`, `eslint.config.js`, and `.opencode/`.
- **Report competing toolchains.** If the repo already uses a different linter / type checker / test stack (Python: `black`/`flake8`/`isort`/`mypy`/`pre-commit`; TS: `husky`/`tslint`), do **not** add the harness's tools alongside it — report the collision and stop.
- **Never invent product direction.** Product content comes from the user's existing docs or their answers — never from the agent's imagination.

## Detection

### Stack

Run in order; stop at the first match:

1. `uv.lock` → **Python (uv)**.
2. `bun.lock` or `tsconfig.json` → **TS/Node**.
3. Any Python marker (`pyproject.toml`, `.python-version`, `requirements.txt`) → **Python**. If another package manager owns the repo (`poetry.lock`/`[tool.poetry]`, `pdm.lock`/`[tool.pdm]`, `Pipfile`, `requirements.in`) → **stop and report**; do not impose uv.
4. `package.json` alone → **TS/Node**.
5. Nothing → **ask**.

Record the result in `AGENTS.md` (`## Stack`). A stray `package.json` (frontend
build, JS tooling) does not make a Python repo a monorepo. If rules 1 and 2 both
fire, harness the directory whose manifest is nearest the current one; if that
is ambiguous, **ask which directory**.

### Harness state

Check the current directory, then pick one of four states:

| State               | Signal                          | Action                          |
| ------------------- | ------------------------------- | ------------------------------- |
| Empty               | no `.git`, no source            | `git init`, full bootstrap      |
| Project, no harness | code exists, no `AGENTS.md`     | add sensors + docs skeleton     |
| Partial harness     | some sensors exist, audit fails | complete only the missing items |
| Complete harness    | audit passes                    | stop                            |

Partial vs complete is read straight off the audit (does `lefthook.yml`, `.prettierrc`, etc. exist) — there is no stored state or version marker.

## Step by Step

**Before starting:** Create a TodoWrite with each step as a separate item. Mark `in_progress` only when actively working on that step, and `completed` only after that step's audit check passes.

### The canonical docs layout

Create this tree in Step 1, then seed it in the product steps:

```
docs/
  inbox/                       # raw captures (capture-idea)
  backlog/
    now-next-later.md          # groom-backlog
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
  experience/                  # user journeys (shape in README.md)
  system/                      # descriptive only; links to architecture.md
  decisions/                   # ADR-NNNN-*.md (shape in README.md)
  specs/                       # SPEC-NNNN-name.md
  prompts/                   # SPEC-NNNN-*.prompt.md
  architecture.md              # prescriptive rules (sole normative owner)
  pipeline.md                  # PDLC policy: mode, gates, release tier
  WORKFLOW.md                  # one-page workflow index
```

`docs/architecture.md` holds the architecture **rules**; `docs/system/` holds
**descriptions** and must link to `architecture.md` rather than restate its rules.
`docs/WORKFLOW.md` is the developer entry point. `.opencode/opencode.json`
(repo root) loads `architecture.md` and `principles/design.md` as instructions.

### Technical steps

1. Create the docs tree above (`mkdir -p …`), then seed the three leaf READMEs
   from `templates/{experience,system,decisions}-README.md` — they define the
   shape of what belongs in each, and they keep those directories in git (empty
   directories are not tracked). No other content files yet. **Additive only:**
   skip any README that already exists.
2. Write `AGENTS.md` from `templates/AGENTS.md.template` — it carries this layout and the routing rules.
3. Add `.gitignore` from `templates/.gitignore.template`.
4. Add `.editorconfig` from `templates/.editorconfig.template` (prevents whitespace wars).
5. Add `README.md` from `templates/README.template`.
6. **Hooks.** Install lefthook and the stack's commit-message linter, then copy `templates/<stack>/lefthook.yml`:
   - TS: `bun add -d @commitlint/cli @commitlint/config-conventional && bun x lefthook install`, plus `templates/ts/commitlint.config.cjs`.
   - Python: `uv add --dev commitizen` (config lives in `pyproject.toml`), then install lefthook per its docs.
7. **Lint/format config.** TS: add `lint-staged.config.mjs` from `templates/ts/`. Python: nothing here — `ruff` config lives in `pyproject.toml` (step 9).
8. Add `justfile` from `templates/<stack>/justfile.template`.
9. **Deps and scripts** (**merge — never overwrite**). TS: ensure `package.json` has `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `docs:check`. Python: merge `pyproject.toml` from `templates/python/`, add tool deps with `uv add --dev`, then `uv sync` so `uv.lock` exists and is committed (CI runs `uv sync --locked`).
10. **Formatter.** TS: add `.prettierrc` from `templates/ts/`. Python: `ruff format` (already configured in step 9). OpenCode's built-in formatter (global `formatter: true`) formats both after edits.
11. **Linter.** TS: add `eslint.config.js` from `templates/ts/` (flat config, AI limits). Python: `ruff check` (already configured in step 9).
12. Add `docs-check` and `spec-sha`/`spec_sha` from `templates/<stack>/`.
13. Write `docs/WORKFLOW.md` from `templates/WORKFLOW.md`, write `docs/pipeline.md` from `templates/pipeline.md.template`, and add `.opencode/opencode.json` from `templates/.opencode/opencode.json` at the repo root (**merge — never overwrite**).
14. (Optional) TS only: add dependency-cruiser from `templates/ts/dependency-cruiser-rules.md`.
15. (Optional) Add CI from `templates/<stack>/.github/workflows/ci.yml.template`.

> Optional sidecar: `templates/ts/.nvmrc.template` (TS) or `templates/python/.python-version.template` (Python) for runtime version pinning.

### Product steps (16–19)

Run these **after** the technical harness, and only with a human present.

16. **Detect existing docs.** If `docs/` already holds any non-empty `.md` (outside the skeleton just created), or the README has a product/about section: stop the product phase. Write no product content — do not add, move, rename, or delete any existing file. Record what you found as open questions in `AGENTS.md`, then stop with: _"Existing docs found — run `/process-inbox` to classify."_
17. **Interview for gaps.** Bounded — one pass, ≤7 questions, each skippable. Ask only what is knowable now:
    - `product/vision.md` — problem, audience, solution
    - `product/language.md` — a few core domain terms
    - `principles/product-principles.md` — short, decision-driving rules
    - design system / voice — only if the project has UI
      Do **not** ask about the roadmap — that belongs to `groom-backlog`.
18. **Write answers into the template shapes.** Use `templates/product-*.md` as the structure. Transcribe the user's words; do not invent.
19. **Degrade to stubs.** For every skipped or unanswered question, leave the heading plus `<!-- Q: … -->` so `process-inbox` can resolve it later.

### Product Checklist

Before marking product steps done, verify:

- [ ] Vision answers: why, for whom, what problem
- [ ] Language maps product terms to code entities
- [ ] Principles are actionable (guide decisions, not just inspirational)
- [ ] Design System has colors, fonts, component patterns (if UI)
- [ ] Voice has both "do" and "avoid" examples (if UI)
- [ ] Unanswered questions are stubs carrying their question, not invented content

### Templates

`templates/` holds the **stack-neutral** product and docs files. The technical
files live under `templates/<stack>/` — currently `templates/ts/` (TypeScript/
Node), with `templates/python/` the Python set. The product templates are the
**shape** for either real content (from the interview) or a stub (heading +
`<!-- Q: … -->`).

| Template                       | Destination                             |
| ------------------------------ | --------------------------------------- |
| `product-vision.md`            | `docs/product/vision.md`                |
| `product-language.md`          | `docs/product/language.md`              |
| `product-principles.md`        | `docs/principles/product-principles.md` |
| `product-design-system.md`     | `docs/principles/visual-design.md`      |
| `product-voice.md`             | `docs/principles/voice.md`              |
| `product-roadmap.md`           | `docs/backlog/release-plan.md`          |
| `product-scope.md`             | `docs/product/scope.md`                 |
| `architecture.md.template`     | `docs/architecture.md`                  |
| `pipeline.md.template`         | `docs/pipeline.md`                      |
| `product-design-principles.md` | `docs/principles/design.md`             |
| `WORKFLOW.md`                  | `docs/WORKFLOW.md`                      |
| `.opencode/opencode.json`      | `.opencode/opencode.json`               |
| `experience-README.md`         | `docs/experience/README.md`             |
| `system-README.md`             | `docs/system/README.md`                 |
| `decisions-README.md`          | `docs/decisions/README.md`              |
| `ts/spec-sha.mjs`              | `spec-sha.mjs` (repo root)              |
| `python/docs_check.py`, `python/spec_sha.py` | same paths (repo root)   |
| `ts/*`                         | TS/Node technical set (steps 6–15)      |
| `python/*`                     | Python technical set (steps 6–15)       |

`docs-check.mjs` and `spec-sha.mjs` (under `templates/<stack>/`) hardcode the
canonical spec paths — change their constants only if the repo deviates from the
layout above.

## Stack specifics

Per-stack linter limits, security commands, and language quick reference:

- **TypeScript/Node** → `references/typescript.md`
- **Python (uv)** → `references/python.md`

## Common Mistakes

| Mistake                      | Reality                                               |
| ---------------------------- | ----------------------------------------------------- |
| Defaults are fine            | ESLint defaults miss AI failure modes                 |
| I will add tests later       | Pre-push without tests = broken code                  |
| Just a small project         | Small projects grow. Start with structure.            |
| Hooks are optional           | Without hooks, agents skip checks under pressure      |
| Security checks are overkill | Leaked credentials are irreversible                   |
| Overwriting existing config  | Additive only — merge, or report a collision and skip |
| Treating Python like Node    | Different stack: uv/ruff/mypy/pytest, not bun/eslint  |
| Adding ruff beside black     | Competing toolchains — report and stop, don't stack   |
| Imposing uv on a poetry repo | Detect the manager; report and stop if it isn't uv    |

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
- [ ] Step 6: hooks + commit linter (installed AND configured)
- [ ] Step 7: lint/format config
- [ ] Step 8: justfile
- [ ] Step 9: deps + scripts (merged) / uv.lock
- [ ] Step 10: formatter
- [ ] Step 11: linter
- [ ] Step 12: docs-check + spec-hash scripts
- [ ] Step 13: WORKFLOW.md + .opencode config
- [ ] Step 14: dependency-cruiser (optional)
- [ ] Step 15: CI (optional)
- [ ] Step 16: detect existing docs
- [ ] Step 17: product interview
- [ ] Step 18: product docs written
- [ ] Step 19: stubs for anything skipped
```

### At end — audit checklist

Run ALL of these and verify the expected output.

**Shared:**

```bash
git status
ls AGENTS.md README.md .editorconfig lefthook.yml
ls -d .git/hooks/pre-commit .git/hooks/pre-push .git/hooks/commit-msg
grep -q "check:" justfile && echo "OK" || echo "MISSING"
ls docs/WORKFLOW.md .opencode/opencode.json docs/pipeline.md
```

**TypeScript/Node:**

```bash
ls lint-staged.config.mjs eslint.config.js .prettierrc
bun x tsc --noEmit 2>&1
bun run lint 2>&1 | grep "0 errors" || echo "HAS ERRORS"
bun run build
```

**Python (uv):**

```bash
ls .python-version pyproject.toml uv.lock
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run python docs_check.py
uv run pytest
```

### For product docs (steps 16–19), also verify:

```bash
ls docs/product/ docs/principles/ docs/specs/ docs/prompts/
ls docs/experience/ docs/system/ docs/decisions/
```

**Do NOT mark any step as completed until its audit command passes.**

### Final gate

Only after EVERY audit command passes, state the result explicitly: list which
commands ran, their output, and anything that failed or was skipped. Do not claim
"done" on a partial pass — report the gap instead.

## Later Sensors

Mutation testing catches assertion gaps in AI tests. Periodic modularity review catches design drift. Agents review results and recommend harness improvements.
