---
name: bootstrap-project-harness
description: Set up a project's technical harness (git hooks, lint limits, CI) and the product-docs skeleton, for TypeScript/Node or Python (uv). Detects and preserves an existing Node/Bun stack; the defaults apply only to an empty repo. Use when starting a new project, bootstrapping an existing repo, or adding hooks/CI/agent conventions. Seeds docs from existing material or a short interview; delegates classifying existing docs to process-inbox.
---

# Bootstrapping Project Harnesses

## Overview

A harness defines the how loop: specs, quality checks, and workflow guidance that control how agents build software. Humans stay on the loop improving the harness while agents run execution. This avoids line-by-line inspection and quality drift.

This skill covers **two harnesses** that must both exist:

1. **Technical Harness** — sensors, hooks, quality gates (building it right)
2. **Product Harness** — vision, language, principles, design, voice (building the right thing)

**Scope:** TypeScript/Node and Python (uv). Detect the stack first (see Detection → Stack) and take technical files from `templates/<stack>/`. Other stacks are out of scope.

On TypeScript/Node, **detection is the first decision**: read the runtime, package manager, lockfile, linter, formatter, test runner, hook manager and scripts the repo already has, then preserve them. The default stack in `references/typescript.md` applies only when the repo has no TypeScript/Node stack yet. `templates/ts/` is the default's shape, not a command set to paste into every repo.

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

- **Additive only.** On an existing repo, never overwrite existing keys, scripts, hooks, config files, or the toolchain itself. Merge into what is there; on a collision, report it and skip. This applies to `package.json`, `pyproject.toml`, `justfile`, `lefthook.yml`, `eslint.config.js`, `biome.json`, `.oxlintrc.json`, `.prettierrc`, `tsconfig.json`, and `.opencode/`.
- **TypeScript/Node: preserve the choice.** A detected linter, formatter, test runner, runtime or package manager is the project's decision. Never install a second one, never replace ESLint with Biome (or the reverse), never switch `node:test` to Vitest, never add a `package-lock.json` to a pnpm repo. Fill only the slots that are empty, and say in the report that a fill is not a replacement.
- **Python: report competing toolchains.** If the repo already uses a different package manager or lint stack (`black`/`flake8`/`isort`/`mypy`/`pre-commit`, `poetry`/`pdm`/`Pipfile`), do **not** add the harness's tools alongside it — report the collision and stop. Python detection and refusal are unchanged.
- **Never invent product direction.** Product content comes from the user's existing docs or their answers — never from the agent's imagination.

## Detection

### Stack

Run in order; stop at the first match:

1. `uv.lock` → **Python (uv)**.
2. A TypeScript/Node marker (`bun.lock`, `bun.lockb`, `tsconfig.json`) → **TS/Node**. This decides the stack only: `tsconfig.json` proves TypeScript, never Bun. The runtime and tools come from the profile below.
3. Any Python marker (`pyproject.toml`, `.python-version`, `requirements.txt`) → **Python**. If another package manager owns the repo (`poetry.lock`/`[tool.poetry]`, `pdm.lock`/`[tool.pdm]`, `Pipfile`, `requirements.in`) → **stop and report**; do not impose uv.
4. `package.json` alone → **TS/Node**.
5. Nothing → **ask**.

Record the result in `AGENTS.md` (`## Stack`). A stray `package.json` (frontend
build, JS tooling) does not make a Python repo a monorepo. If rules 1 and 2 both
fire, harness the directory whose manifest is nearest the current one; if that
is ambiguous, **ask which directory**.

### TypeScript/Node profile

Once the stack is TypeScript/Node, detect every slot **before writing or
installing anything**. The first signal that matches owns the slot; record each
answer in `AGENTS.md` (`## Stack`) and in the final report.

| Slot | Signal | Action |
| --- | --- | --- |
| Runtime | `bunfig.toml`, `packageManager` naming Bun, or a `bun`-run script | **Bun** — keep it |
| Runtime | `.nvmrc`, `.node-version`, `engines.node`, `volta` | **Node** — keep the pin |
| Runtime | no runtime signal at all (no Bun marker, no Node pin) | **empty slot** — fill with the default (Node 24) and say it is a fill, per the rules below |
| Package manager | `bun.lock`/`bun.lockb` → Bun; `pnpm-lock.yaml` → pnpm; `package-lock.json`/`npm-shrinkwrap.json` → npm; `yarn.lock` → Yarn | Keep the one with a lockfile; `packageManager` confirms |
| Linter | `.oxlintrc.json` or an `oxlint` dependency → Oxlint; `eslint.config.*`/`.eslintrc*` → ESLint; `biome.json`/a `@biomejs/biome` dependency → Biome; `tslint.json` → TSLint | Keep it; add none |
| Formatter | `.prettierrc*`/`prettier` dependency → Prettier; `biome.json` → Biome; `.oxfmtrc.json`/`oxfmt` dependency → Oxfmt | Keep it; add none |
| Test runner | `vitest.config.*`/a `vitest` dependency → Vitest; `jest.config.*`/a `jest` dependency → Jest; `node:test` imports in the tests → `node:test`; a `bun test` script → `bun test` | Keep it; add none |
| Type checker | `tsconfig.json`, `tsc` in `devDependencies`, or a `typecheck` script | Keep `tsc --noEmit` as the gate; it runs under Node and Bun alike |
| Hook manager | `lefthook.yml` → Lefthook; `.husky/` or a `husky` dependency → Husky; `.pre-commit-config.yaml` → pre-commit | Keep it; merge the commands into it |
| Commit messages | `commitlint.config.*`, `.commitlintrc*`, a `commitlint` dependency | Keep it; do not add a second commit linter |
| Scripts | `package.json.scripts` and any `justfile` recipes | Merge by key; never replace an existing command |
| Profile | `workspaces` or `pnpm-workspace.yaml` → monorepo; `bin`/`exports` → library or CLI; neither → API/backend | Decide whether `build` is needed |

A single signal does not prove the whole stack. `tsconfig.json` alone says
TypeScript and nothing about Bun; a `package.json` without a lockfile says the
manager is not yet visible. When a slot has no signal, it is **empty**, not
defaulted until the rules below say so.

#### Preserve, fill, skip

1. **Existing choice → preserve.** Copy the project's own command into the
   report and use it. No second tool, no replacement, no version "upgrade", no
   config rewrite.
2. **Empty slot on an existing stack → fill** from the default in
   `references/typescript.md`, and say it is a fill. Filling a missing formatter
   does not license replacing an existing linter.
3. **No TypeScript/Node stack at all (empty repo) → the default**, as decided in
   `references/typescript.md`: Node 24 + npm, TypeScript 7, Oxlint, Prettier,
   `node:test`, Lefthook + commitlint. State that this is the fallback for an
   empty repo, not a claim about an existing one.
4. **Collision → diagnostic and skip.** Name the case, write nothing for that
   slot, and continue with the rest:
   - **Two lockfiles** (`package-lock.json` and `pnpm-lock.yaml`) — ask which
     manager owns the repo; do not delete either and do not run an install.
   - **Two owners of one slot** (Oxlint and Biome both configured, Prettier and
     `biome format` both in scripts, Vitest and `node:test` both present, two
     commit linters) — ask which is authoritative; do not merge them.
   - **A package manager the templates do not cover** (`yarn.lock`) — keep it and
     use its equivalents (`yarn install --frozen-lockfile`, `yarn run <script>`);
     skip the install command that would create a second lockfile.
   - **A hook manager other than Lefthook** (Husky, pre-commit) — keep it and skip
     the Lefthook install. It fills the `hooks` slot (`hooks=husky`), so
     `lefthook.yml` is not a gap; the script reports `competing: husky` and the
     state stays `partial`. Preserve the manager and name the diagnostic rather
     than install a second hook manager.
   - **A detected stack that cannot express a limit** (for example Biome's
     cognitive complexity) — record the replacement rule in the project's own
     config and in the report; never drop a limit silently.
5. **Never rewrite a config file.** If the file exists, adding a rule is a
   reviewable merge into it, or a diagnostic that skips the step — never a fresh
   copy over the top.

### Harness state

The state is the script's answer, not a judgement:

```sh
node scripts/harness-state.mjs .     # scripts/ sits next to this file
```

It prints `state:` last, one `missing:` line per absent requirement, one
`competing:` line per tool that already owns a slot and one `conflict:` line per
conflicting choice, and exits `0` complete, `1` partial, `2` empty, `3` project
without harness, `4` ambiguous stack, `5` conflict, `64` unreadable directory. It
only reads: it never writes, installs or fixes.

| State | Signal | Action |
| --- | --- | --- |
| Empty | `state: empty` | `git init`, full bootstrap |
| Project, no harness | `state: project-no-harness` | add sensors + docs skeleton |
| Partial harness | `state: partial` | fix only the `missing:` lines, then re-run — except a slot the repo already owns under another tool: that is a diagnostic, not a fix (see the profile) |
| Conflicting harness | `state: conflict` | ask which choice is authoritative — two owners of one slot or two package managers; keep both files untouched |
| Complete harness | `state: complete` | stop |

- **`complete`** — report what the script found and stop. No interview, no
  writes, no pass over the steps below to "verify" it.
- **`competing: <tool>`** — report it and do not install the harness's tool
  beside one that already owns that slot. Python (`black`, `flake8`, `isort`,
  `mypy`, `pre-commit`, another manager): stop, as before. TypeScript/Node
  (`husky`, `tslint`): keep the tool, skip that slot and name the diagnostic,
  then continue with the other steps — preserving is the outcome, not a full
  stop.
- **`ambiguous`** — ask which directory to harness, as the stack rules say. The
  script refuses instead of guessing.
- **`conflict`** — two owners of one slot or two package managers. Ask which is
  authoritative, keep both files untouched and run no install; nothing is written
  for that slot.
- **The script cannot run** (no `node`, no permission) — say so, then read the
  state from the table by hand.

"Complete" is two halves, neither of which needs an install: the files the
stack's template installs, and a smoke that exits 0 — `just smoke` when the repo
has the recipe, otherwise the script's built-in check, which parses the manifests
and syntax-checks the docs sensor. Install output (`node_modules`, lockfiles,
installed hook binaries) is never part of the test: a fresh clone has none, and
completeness must be decidable before it exists.

## Step by Step

**Step 0 is the state script.** Run it before anything else and obey it. Do not
run the steps below to verify what it already told you, and do not count installed
hooks, `node_modules` or a lockfile as a gap: they are install output, and the
script is written to run without them.

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
6. **Hooks.** Install the stack's commit-message linter and use the **detected**
   hook manager; copy `templates/<stack>/lefthook.yml` only when Lefthook is (or
   will be) the manager.
   - TS: install with the detected package manager — `npm install -D @commitlint/cli @commitlint/config-conventional && npx lefthook install`, `pnpm add -D … && pnpm exec lefthook install`, or `bun add -d … && bun x lefthook install` — plus `templates/ts/commitlint.config.cjs` when no commitlint config exists. Husky or pre-commit present → merge the pre-commit/pre-push commands into its config and skip the Lefthook install (diagnostic).
   - Python: `uv add --dev commitizen` (config lives in `pyproject.toml`), then install lefthook per its docs.
7. **Staged-file config.** Nothing to add on the default path: `lefthook.yml`
   runs the formatter and linter on `{staged_files}` with `stage_fixed`, so a
   separate `lint-staged.config.mjs` would be a second tool for the same job.
   When the project already uses lint-staged (it ships the config or the
   dependency), leave it in place and do not also add the Lefthook staging
   commands. Python: nothing here — `ruff` config lives in `pyproject.toml`
   (step 9).
8. Add `justfile` from `templates/<stack>/justfile.template`. The template is the default's shape: on an existing stack, keep the project's `justfile`, add only the missing recipes, and make each recipe call the detected package manager and runner (`npm run …`, `pnpm run …`, `bun run …`) instead of the template's `bun`.
9. **Deps and scripts** (**merge — never overwrite**). TS: when the repo has no
   `package.json`, add it from `templates/ts/package.json.template`; otherwise
   merge the script **keys** that template carries — `test`, `test:watch`,
   `coverage`, `typecheck`, `lint`, `format`, `format:check`, `check`,
   `docs:check`, and `build` for a library/CLI profile — adding only the missing
   ones. There is no `dev` key: a start/dev command belongs to the project, not
   to the harness. A key that already exists keeps its command; when that
   command differs from the default, report the difference instead of
   overwriting it. Add `tsconfig.json` from `templates/ts/tsconfig.json.template`
   when the repo has none (without it `tsc --noEmit` typechecks nothing), and
   `tsconfig.build.json` from `templates/ts/tsconfig.build.json.template` only
   for a library/CLI. Install with the detected
   manager (`npm install -D`, `pnpm add -D`, `bun add -d`) and keep the existing
   lockfile. Python: merge `pyproject.toml` from `templates/python/`, add tool
   deps with `uv add --dev`, then `uv sync` so `uv.lock` exists and is committed
   (CI runs `uv sync --locked`).
10. **Formatter.** TS: add `.prettierrc` from `templates/ts/` **only when no formatter is detected**. A Biome or Oxfmt project keeps its own formatter and its `format`/`format:check` scripts; do not add Prettier. If OpenCode's built-in formatter would disagree with the project's, point it at the project's tool (or disable it) rather than let two formatters rewrite the same file. Python: `ruff format` (already configured in step 9).
11. **Linter and ignore lists.** TS: add `.oxlintrc.json` from
    `templates/ts/.oxlintrc.json.template` (Oxlint, the four AI limits)
    **only when no linter is detected**; when Prettier was added in step 10, add
    `.prettierignore` from `templates/ts/.prettierignore.template` too (it keeps
    the vendored `docs-check.mjs`/`spec-sha.mjs` and generated output out of the
    formatter). An existing Oxlint, Biome, ESLint or TSLint setup is kept and the
    four limits are translated into its config (Oxlint and Biome shapes are in
    `references/typescript.md`); a limit the tool cannot express is recorded, not
    dropped. Never add a second linter. Python: `ruff check` (already configured
    in step 9).
12. Add `docs-check`, `spec-sha`/`spec_sha` and (TS) `audit-gate.mjs` from `templates/<stack>/` (`templates/ts/audit-gate.mjs`) — the audit gate is what the hooks and CI call, so it must land with them.
13. Write `docs/WORKFLOW.md` from `templates/WORKFLOW.md`, write `docs/pipeline.md` from `templates/pipeline.md.template`, and add `.opencode/opencode.json` from `templates/.opencode/opencode.json` at the repo root (**merge — never overwrite**).
14. (Optional) TS only: add dependency-cruiser from `templates/ts/dependency-cruiser-rules.md`.
15. (Optional) Add CI from `templates/<stack>/.github/workflows/ci.yml.template`. The template is a **shape**, not a command set: replace its setup/install/run lines with the detected runtime, package manager and runner (`actions/setup-node` + `npm ci`, `pnpm/action-setup`, or `oven-sh/setup-bun`), drop `build` for an API/backend, and if the repo already has a workflow, merge the jobs into it instead of adding a second CI file.

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

- **TypeScript/Node** → `references/typescript.md` — the default for an empty
  repo (Node 24 + npm, TypeScript 7, Oxlint, Prettier, `node:test`) and the
  supported alternatives with their conditions (pnpm, Bun, Biome,
  ESLint + typescript-eslint, Vitest, Oxfmt, tsdown). Detection decides which
  one applies; the reference records why.
- **Python (uv)** → `references/python.md`

## Common Mistakes

| Mistake                      | Reality                                               |
| ---------------------------- | ----------------------------------------------------- |
| Linter defaults are fine     | Bundled Oxlint config carries the four AI limits      |
| I will add tests later       | Pre-push without tests = broken code                  |
| Just a small project         | Small projects grow. Start with structure.            |
| Hooks are optional           | Without hooks, agents skip checks under pressure      |
| Security checks are overkill | Leaked credentials are irreversible                   |
| Overwriting existing config  | Additive only — merge, or report a collision and skip |
| `tsconfig.json` means Bun   | It proves TypeScript; only `bun.lock`/`bunfig.toml` names the runtime |
| Adding Oxlint next to Biome | A second linter is a replacement in disguise — preserve, or ask |
| `node:test` → Vitest "upgrade" | The runner is the project's choice; do not migrate its tests |
| Filling a slot = replacing   | A missing formatter is filled; an existing one is kept |
| Pasting the default commands | `bun` in an npm repo is a second toolchain — use the detected manager |
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
- [ ] Step 7: staged-file config (Lefthook owns it; no lint-staged)
- [ ] Step 8: justfile
- [ ] Step 9: deps + scripts + tsconfig (merged) / uv.lock
- [ ] Step 10: formatter
- [ ] Step 11: linter + ignore lists
- [ ] Step 12: docs-check + spec-hash + audit gate
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
ls AGENTS.md README.md .editorconfig
# replace the list with detection's one answer: lefthook.yml | .husky | .pre-commit-config.yaml
for f in lefthook.yml; do ls -d "$f" 2>/dev/null || echo "MISSING $f"; done
ls -d .git/hooks/pre-commit .git/hooks/pre-push .git/hooks/commit-msg
grep -q "check:" justfile && echo "OK" || echo "MISSING"
ls docs/WORKFLOW.md .opencode/opencode.json docs/pipeline.md
```

**TypeScript/Node:**

Run the project's own scripts with the detected package manager; the default
commands below are the fallback for an empty repo. Against an existing stack,
use its linter, formatter and runner — do not run Oxlint/Prettier/`node:test`
against a Biome or Vitest repo.

```bash
# replace the list with detection's answer: package.json, tsconfig.json, plus
# exactly one lockfile and the formatter/linter config files it named
for f in package.json tsconfig.json .prettierrc .oxlintrc.json; do ls "$f" 2>/dev/null || echo "MISSING $f"; done
npm run typecheck        # or pnpm run / bun run
npm run lint             # the detected linter's script; check its own success line
npm test                 # the detected runner's script
npm run build            # library/CLI profile only; skipped and named for an API/backend
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
"done" on a partial pass — report the gap instead. The result names each detected
slot (runtime, package manager, linter, formatter, test runner, hook manager) as
**preserved** or **filled**, and every skipped step carries its diagnostic.

## Later Sensors

Mutation testing catches assertion gaps in AI tests. Periodic modularity review catches design drift. Agents review results and recommend harness improvements.
