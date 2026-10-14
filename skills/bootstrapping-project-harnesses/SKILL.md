---
name: bootstrapping-project-harnesses
description: Use when starting a new project, bootstrapping a harness for existing code, or setting up git hooks, CI checks, linter limits, and agent conventions
---

# Bootstrapping Project Harnesses

## Overview

A harness defines the how loop: specs, quality checks, and workflow guidance that control how agents build software. Humans stay on the loop improving the harness while agents run execution. This avoids line-by-line inspection and quality drift.

This skill covers **two harnesses** that must both exist:

1. **Technical Harness** — sensors, hooks, quality gates (building it right)
2. **Product Harness** — vision, language, principles, design, voice (building the right thing)

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
| Roadmap | Phases, what enters now vs later | Clear scope

## Detection

Check current directory:
1. .git folder? (repo or empty)
2. README.md? (has docs)
3. package.json, pyproject.toml, or Cargo.toml? (language detected)
4. AGENTS.md or CLAUDE.md? (harness exists)

Three paths:

| State | Action |
|---|---|
| Empty | Initialize git, create structure, bootstrap |
| Existing project, no harness | Add sensors |
| Harness exists | Warn and stop |

## Step by Step

**Before starting:** Create a TodoWrite with each step as a separate todo item. Mark `in_progress` only when actively working on that step. Mark `completed` only after the audit check for that step passes.

1. Create docs tree (`mkdir -p docs/superpowers/specs docs/superpowers/plans`)
2. Write AGENTS.md
3. Add .gitignore
4. Add `.editorconfig` (prevents whitespace wars)
5. Install lefthook and commitlint (`bun add -d @commitlint/cli @commitlint/config-conventional && bun x lefthook install`)
6. Configure lint-staged (TS/Node) — create `lint-staged.config.mjs`
7. Create justfile (with at minimum: dev, build, typecheck, lint, format, check targets)
8. Wire pre-commit: typecheck, lint, security (via lefthook in `lefthook.yml`)
9. Wire pre-push: tests, build (via lefthook in `lefthook.yml`)
10. Add docs-check script
11. Configure ESLint with AI rules — create `eslint.config.js` (flat config) with complexity 10, max-params 4, max-lines-per-function 60, max-lines 200
12. Add dependency-cruiser (layered, optional)
13. Add CI (optional — `.github/workflows/ci.yml`)

> Optional sidecar: create `.nvmrc` (or `.node-version`) for runtime version pinning.
>
> Para projetos maiores, considere **DOX** — uma hierarquia de `AGENTS.md` por subdiretório que força o agente a ler o contexto local antes de editar. Veja [agent0ai/dox](https://github.com/agent0ai/dox).

### Product Steps (14–19)

Create these AFTER the technical harness. Each is a Markdown file in `docs/product/`.

14. **Write product vision** — `docs/product/vision.md`. One paragraph each for: problem, audience, solution, guiding phrase.
15. **Write ubiquitous language** — `docs/product/language.md`. Table mapping product terms → code entities → definitions.
16. **Write product principles** — `docs/product/principles.md`. 4-6 principles with "why" and "what we avoid."
17. **Write design system** — `docs/product/design-system.md`. Colors, typography, spacing, components, icons, visual guidelines.
18. **Write tone of voice** — `docs/product/voice.md`. Voice characteristics, good examples, bad examples.
19. **Write phase roadmap** — `docs/product/roadmap.md`. Phase table: phase, features, delivery, dependencies.

### Product Checklist

Before marking product steps done, verify:

- [ ] Vision answers: why, for whom, what problem
- [ ] Language maps all product terms to code entities
- [ ] Principles are actionable (guide decisions, not just inspirational)
- [ ] Design System has hex colors, font names, component patterns
- [ ] Voice has both "do" and "avoid" examples
- [ ] Roadmap clearly marks what is MVP vs later

### Templates

The `templates/` directory includes templates for each product doc.

## Linter Limits

| Metric | TS/Node | Python |
|---|---|---|
| Cyclomatic complexity | error 10 | error 10 |
| Max params per function | error 4 | error 5 |
| Max lines per function | warn 60 | -- |
| Max lines per file | warn 200 | warn 400 |
| Min test coverage | optional | 80% |

## Security Checks

Block .env, .db, and data files at commit. Run GitLeaks. Audit dependencies.

## Language Quick Reference

| Component | TS/Node | Python |
|---|---|---|
| Type check | tsc --noEmit | mypy |
| Linter | ESLint | Ruff |
| Formatter | Prettier | Ruff format |
| Tests | Vitest or Jest | pytest |
| Hook manager | Lefthook | Lefthook |

## Common Mistakes

| Mistake | Reality |
|---|---|
| Defaults are fine | ESLint defaults miss AI failure modes |
| I will add tests later | Pre-push without tests = broken code |
| Just a small project | Small projects grow. Start with structure. |
| Hooks are optional | Without hooks, agents skip checks under pressure |
| Security checks are overkill | Leaked credentials are irreversible |

## Verification Gate

**IMPORTANT:** Failure to complete all steps results in an incomplete harness. Agents tend to stop early — this section prevents that.

### At start

Create a TodoWrite with one item per step BEFORE touching code:

```
- [ ] Step 1: git init
- [ ] Step 2: AGENTS.md
- [ ] Step 3: .gitignore
- [ ] Step 4: .editorconfig
- [ ] Step 5: lefthook + commitlint (installed AND configured)
- [ ] Step 6: lint-staged config
- [ ] Step 7: justfile
- [ ] Step 8: pre-commit hooks (wired AND working)
- [ ] Step 9: pre-push hooks (wired AND working)
- [ ] Step 10: docs-check script
- [ ] Step 11: ESLint config with AI rules (flat config)
- [ ] Step 12: dependency-cruiser (optional)
- [ ] Step 13: CI (optional)
- [ ] Step 14: product vision
- [ ] Step 15: ubiquitous language
- [ ] Step 16: product principles
- [ ] Step 17: design system
- [ ] Step 18: tone of voice
- [ ] Step 19: phase roadmap
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

# 11. TypeScript compiles clean
bun x tsc --noEmit 2>&1

# 12. ESLint runs clean (0 errors, warnings allowed)
bun x eslint packages/ 2>&1 | grep "0 errors" || echo "HAS ERRORS"

# 13. Build succeeds
bun run build
```

### For product harness (steps 14-19), also verify:

```bash
# 14. Product docs directory exists
ls docs/product/

# 15. Vision doc exists
ls docs/product/vision.md

# 16. Language doc exists
ls docs/product/language.md

# 17. Principles doc exists
ls docs/product/principles.md

# 18. Design system doc exists
ls docs/product/design-system.md

# 19. Voice doc exists
ls docs/product/voice.md

# 20. Roadmap doc exists
ls docs/product/roadmap.md
```

**Do NOT mark any step as completed until its audit command passes.**

### Sub-skill gate

Load **verification-before-completion** as a sub-skill. Use it to gate the final "all done" claim:

```
Do: skill "verification-before-completion"
Goal: confirm all 19 harness steps produce correct output
Gate: only after ALL audit commands pass
```

## Later Sensors

Mutation testing catches assertion gaps in AI tests. Periodic modularity review catches design drift. Agents review results and recommend harness improvements.
