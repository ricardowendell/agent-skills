# Evals

Representative prompts and the trajectory this skill should produce. Fixtures for
cases 1, 2, 3, 5, 7, 9, 10, 11, and 16–23 live in `references/evals/<n>/` and are
copied into the scratch repo before the prompt runs. Cases 14 and 15 also ship a
`git.json` manifest, so their trees are staged as a committed repo.

The runner copies a plain tree: no `.git`, no history. That limits what a case can
assert. Case 7's fixture is a harness from before the current templates, but with
no `.git` and no source the skill reads it as an empty repo, so the case asserts
additive completion rather than the "complete harness → stop" path. Cases 14 and
15 cover that path instead: `git.json` stages the tree as a committed repository,
so case 14 can assert that a complete harness is left untouched and case 15 that
the missing file is added while the checked files stay as they were.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

**Correction, 2026-11-08 (SPEC-0043).** The fixtures for cases 14 and 15 changed
with the Oxlint rename: `eslint.config.js` and `lint-staged.config.mjs` were
replaced by `.oxlintrc.json`, and `.nvmrc` now pins `24.15.0`. The pass counts
recorded in those two cases — **12 of 12** and **3 of 3** — were measured against
the pre-rename fixtures. They stay here as history and are **not** evidence for
the current fixtures; re-measuring them is SPEC-0045's work. The fixture must be
re-run, not re-quoted.

**Measurement, 2026-11-08 (SPEC-0045).** Cases 16–22 are the stack review:
the default bootstrap on an empty repo, preservation of Bun, pnpm, a declared
ESLint without its config, Biome, and an npm workspace, and refusal of an
ambiguous stack. Case 23 is the routing trigger for an existing Bun repository.
Cases 14 and 15 were re-run on the post-rename fixtures; their `why:` lines carry
the new run directory and count. The measurements were made on
`agentworks/deepseek-v4-1-flash` with five draws per cell; the coverage row and
`SPEC-0045` name every run directory.

1. **Set up this repo's harness.**
   - prompt: Set up this repo's harness.
   - why: fresh Node/TS project
   - expect: Detects the stack and package manager first.
   - expect: Creates the canonical `docs/` tree and writes `AGENTS.md` from the template, including the leaf READMEs that keep `experience/`, `system/`, and `decisions/` in git.
   - expect: Adds lint limits, hooks (pre-commit/pre-push), commit conventions, and CI, using the bundled templates by name.
   - expect: Does not invent product direction; asks or stubs.
   - expect: Watch for: applying the wrong toolchain or skipping detection.
   - assert: file AGENTS.md
   - assert: dir docs/product
   - assert: file docs/experience/README.md
   - assert: file docs/system/README.md
   - assert: file docs/decisions/README.md
   - assert: file .opencode/opencode.json
   - assert: file docs/WORKFLOW.md
   - assert: file docs/pipeline.md
   - assert: filematch docs/pipeline.md release_tier
   - assert: nofile .husky
   - assert: nofile docs/superpowers

2. **Bootstrap a harness for existing code, don't break anything.**
   - prompt: Bootstrap a harness for existing code, don't break anything.
   - expect: Additive only: merges into existing `package.json`/justfile/hooks, never overwrites.
   - expect: Reports what changed and how to run the checks.
   - expect: Watch for: rewriting existing tooling or changing unrelated files.
   - assert: file AGENTS.md
   - assert: filematch package.json custom-build-untouched
   - assert: unchanged .prettierrc
   - assert: nofile .husky
   - assert: nofile docs/superpowers

3. **Finish setting up the harness.**
   - prompt: Finish setting up the harness.
   - why: repo with partial tooling
   - expect: Detects and preserves what exists; adds only what is missing.
   - expect: Watch for: duplicating hooks or installing a conflicting formatter.
   - assert: nofile .husky
   - assert: nofile docs/superpowers

4. **Set up this project.**
   - prompt: Set up this project.
   - why: human present, no existing product docs
   - expect: Asks a bounded set of vision/language/principles questions — one pass, each skippable.
   - expect: Writes the answers under the canonical paths using the `product-*.md` shapes.
   - expect: Watch for: asking about the roadmap, or inventing answers.
   - assert: nofile .husky
   - assert: nofile docs/superpowers

5. **Bootstrap this repo.**
   - prompt: Bootstrap this repo.
   - why: existing `docs/` with real content
   - expect: Stops the product phase: writes no product content, records open questions in `AGENTS.md`.
   - expect: Tells the user to run `/process-inbox`; moves, renames, and deletes nothing.
   - expect: Watch for: rewriting or relocating existing docs.
   - assert: unchanged docs/product/vision.md
   - assert: unchanged docs/inbox/2026-01-01-idea.md

6. **Just scaffold it, skip the interview.**
   - prompt: Just scaffold it, skip the interview.
   - expect: Leaves stubs whose content is the open question (`<!-- Q: … -->`).
   - expect: Watch for: filling stubs with invented content.
   - assert: filematch docs/product/vision.md <!-- Q:

7. **Set up the harness here.**
   - prompt: Set up the harness here.
   - why: harness predating the current templates
   - expect: The runner copies a plain tree: no `.git`, no source. The skill therefore reads the repo as empty and runs a full bootstrap, which is the correct behaviour for that signal — see the note at the top of this file.
   - expect: Existing content survives: the spec, its prompt, the product vision, the README, and the OpenCode config are byte-identical afterwards.
   - expect: The missing canonical files are seeded, including `docs/pipeline.md`.
   - expect: Watch for: clobbering existing docs or config while filling gaps.
   - assert: unchanged docs/specs/SPEC-0001-demo.md
   - assert: unchanged docs/prompts/SPEC-0001-demo.prompt.md
   - assert: unchanged .opencode/opencode.json
   - assert: unchanged docs/product/vision.md
   - assert: file docs/pipeline.md
   - assert: file docs/architecture.md
   - assert: filematch docs/WORKFLOW.md ## The loop

8. **Any bootstrap.**
   - status: manual
   - expect: Produces no `docs/superpowers/` paths and no husky files.
   - expect: Uses Lefthook with the detected package manager; never husky.
   - expect: Watch for: superpowers paths or husky hooks.
   - assert: nofile .husky
   - assert: nofile docs/superpowers

9. **Bootstrap this Python repo.**
   - prompt: Bootstrap this Python repo.
   - why: fixture: an existing `pyproject.toml` + `.python-version`
   - expect: Detects **Python (uv)**, not TypeScript.
   - expect: Adds the Python technical set (justfile, lefthook, pyproject tool config, CI) and the docs skeleton.
   - expect: Preserves the existing project name; adds no `package.json` or ESLint config.
   - expect: Watch for: applying the Node templates to a Python repo.
   - assert: file docs/WORKFLOW.md
   - assert: file docs/pipeline.md
   - assert: file .opencode/opencode.json
   - assert: file docs_check.py
   - assert: filematch lefthook.yml uv run
   - assert: filematch pyproject.toml name = "existing-py"
   - assert: file docs/experience/README.md
   - assert: nofile package.json
   - assert: nofile .oxlintrc.json

10. **Bootstrap this Python repo.**
   - prompt: Bootstrap this Python repo.
   - why: fixture: `black` + `isort` + `pre-commit` already configured
   - expect: Detects Python, then finds a **competing toolchain** and reports the collision instead of adding ruff/mypy.
   - expect: Leaves `pyproject.toml` untouched; adds no ruff config and no competing hook manager.
   - expect: Watch for: stacking ruff on top of black.
   - assert: unchanged pyproject.toml
   - assert: nofile ruff.toml
   - assert: nofile .ruff.toml
   - assert: nofile lefthook.yml

11. **Set up the harness here.**
   - prompt: Set up the harness here.
   - why: fixture: a Poetry project
   - expect: Detects Python, but a **competing package manager** (`poetry.lock` / `[tool.poetry]`) means it stops and reports instead of imposing uv.
   - expect: Adds no uv artifacts.
   - expect: Watch for: running `uv sync` or writing a uv lock.
   - assert: unchanged pyproject.toml
   - assert: nofile uv.lock

12. **Trigger: an empty repo is handed over.**
   - prompt: I just cloned this repo and there is nothing here — set up lint, hooks and CI in one go.
   - tags: trigger
   - why: the skill is never named; "set up lint, hooks and CI" is the bootstrap the description promises
   - gate: off
   - expect: Loads `bootstrap-project-harness` rather than installing tools one by one from the request.
   - assert: skill bootstrap-project-harness

13. **Near-miss: an existing harness that stopped biting.**
   - prompt: Our CI is green but nothing is actually enforced — the lint limit is 400 and tests are not blocking. Make one of those stricter.
   - tags: trigger
   - why: same vocabulary (lint, CI, hooks); the ask is a deliberate ratchet on a harness that already exists
   - gate: off
   - expect: Does not re-bootstrap a harness that is already in place.
   - assert: notskill bootstrap-project-harness

14. **Complete harness: stop instead of rebuilding it.**
   - prompt: Set up the harness here.
   - tags: harness-state
   - why: a git repo whose files are all present and whose smoke gate exits 0 without an install, with source and tests. The state script says `complete`, and the state table says a complete harness gets a stop. Measured 12 of 12 runs after the script landed: every run ran it first, stopped, and changed no file. Before the script, the same fixture stopped in 5 of 12. The first scoring pass after the change read 9/12 because this case's reply regex did not accept `state: complete` — the script's own line — so three correct stops were counted as failures; re-judged, all twelve pass. Re-measured after the Oxlint rename by SPEC-0045: 5/5 in `2026-11-08T23-32-34--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the 12/12 above is pre-rename history.
   - expect: Decides completeness from the files plus `just smoke`, not from a missing toolchain.
   - expect: Changes nothing: no new config, no duplicated hooks, no rewritten `AGENTS.md`.
   - expect: Points at `tighten-harness` if the user wants to raise the bar.
   - expect: Watch for: installing the toolchain to decide, or re-writing files that already pass the smoke.
   - assert: unchanged lefthook.yml
   - assert: unchanged justfile
   - assert: unchanged .oxlintrc.json
   - assert: unchanged .github/workflows/ci.yml
   - assert: unchanged AGENTS.md
   - assert: unchanged docs/pipeline.md
   - assert: nofile .husky
   - assert: reply state\b[^.\n]{0,40}\bcomplete\b|already (?:in place|complete|set up|has|is)|nothing to (?:add|change|do)|no changes|isn't needed
   - assert: noreply \bnot\b[^.\n]{0,20}\bcomplete\b

15. **Nearly complete: one file missing.**
   - prompt: Set up the harness here.
   - tags: harness-state
   - why: the repo from case 14 with `lefthook.yml` removed — the state script says `partial` and names exactly that file while the smoke gate still passes. It exists because case 14 only measures the stop path: a checker that always answered `complete` would pass 12 of 12, and this is the other side of that measurement. Measured 3 of 3: names `lefthook.yml`, creates it, leaves the rest untouched. Re-measured after the Oxlint rename by SPEC-0045: 1/5 in `2026-11-08T23-32-34--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the four red draws fail `unchanged justfile` because the skill adds the missing `coverage`, `audit`, `build` and `install` recipes, so the 3/3 is pre-rename history and the current case needs a corrected assertion.
   - expect: Reports the harness as almost complete and names the missing piece.
   - expect: Adds that file and re-runs the state check, instead of rebuilding what already passes.
   - expect: Watch for: declaring the repo complete, or rewriting files that were already correct.
   - assert: file lefthook.yml
   - assert: unchanged .oxlintrc.json
   - assert: unchanged justfile
   - assert: unchanged docs-check.mjs
   - assert: reply lefthook

16. **Empty repo: the default stack.**
    - prompt: Set up this repo's harness.
    - tags: stack, behaviour
    - why: an empty tree (only `.gitkeep`) with no TypeScript/Node or Python marker; the default from `references/typescript.md` is the only correct answer. Measured 4/4 clean (1 stalled) in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved.
    - expect: Detects an empty repo, then applies the default: Node 24 + npm, TypeScript 7, Oxlint, Prettier, `node:test`, Lefthook + commitlint.
    - expect: States that this is the empty-repo fallback, not a migration of an existing stack.
    - expect: Does not add ESLint, husky or a second package manager.
    - expect: Watch for: a different default toolchain, or a stack interview for an empty tree.
    - assert: file AGENTS.md
    - assert: file docs/pipeline.md
    - assert: file docs/experience/README.md
    - assert: file justfile
    - assert: file .oxlintrc.json
    - assert: file .prettierrc
    - assert: file lefthook.yml
    - assert: filematch package.json npm@11\.12\.1
    - assert: filematch package.json oxlint.*1\.92\.0
    - assert: filematch package.json format:check
    - assert: filematch .oxlintrc.json max-lines
    - assert: nofile eslint.config.js
    - assert: nofile .husky

17. **Existing Bun: keep the runtime and package manager.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: `bun.lock`, `bunfig.toml`, `packageManager: bun@1.3.14` and a `bun test` script. Bun is the project's choice; only the empty linter/formatter/hooks slots may be filled. Measured 4/4 clean (1 stalled) in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved.
    - expect: Names Bun as the runtime and package manager and keeps the existing commands.
    - expect: Fills the empty linter and formatter slots without switching the runtime; the justfile uses `bun run`.
    - expect: Adds no `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`.
    - expect: Watch for: pasting the npm default or adding a Node pin to a Bun repo.
    - assert: file AGENTS.md
    - assert: file justfile
    - assert: file lefthook.yml
    - assert: file .oxlintrc.json
    - assert: file .prettierrc
    - assert: filematch justfile bun run
    - assert: filematch package.json bun@1\.3\.14
    - assert: filematch package.json bun test
    - assert: file bun.lock
    - assert: file bunfig.toml
    - assert: nofile package-lock.json
    - assert: nofile pnpm-lock.yaml
    - assert: nofile yarn.lock
    - assert: nofile eslint.config.js

18. **Node + pnpm: keep the lockfile.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: `.nvmrc` 24.15.0, `pnpm-lock.yaml` and `packageManager: pnpm@11.1.2`. Node is preserved and pnpm owns the dependency tree; the harness must not add npm's lockfile. Measured 5/5 in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved.
    - expect: Detects Node and pnpm, keeps the existing lockfile and pin.
    - expect: Makes the justfile call `pnpm run` and fills only the empty slots.
    - expect: Adds no `package-lock.json`, `yarn.lock` or `bun.lock`.
    - expect: Watch for: running `npm install` or pasting the npm template.
    - assert: file AGENTS.md
    - assert: file justfile
    - assert: file lefthook.yml
    - assert: file .oxlintrc.json
    - assert: file .prettierrc
    - assert: filematch justfile pnpm run
    - assert: filematch package.json pnpm@11\.1\.2
    - assert: file pnpm-lock.yaml
    - assert: nofile package-lock.json
    - assert: nofile yarn.lock
    - assert: nofile bun.lock
    - assert: nofile eslint.config.js

19. **Declared ESLint without its config: fill, do not replace.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: `eslint` in `devDependencies` and a `lint: eslint .` script, but no `eslint.config.js`. The slot is owned by ESLint and only its config is missing; adding Oxlint would be a second linter. Measured 5/5 in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/2 clean (both failed, 3 contaminated) in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`, so the cell is unresolved.
    - expect: Finds the declared ESLint and writes the missing flat config, translating the four limits.
    - expect: Keeps the dependency and the `lint` command; adds no Oxlint or Biome.
    - expect: Watch for: treating the missing config as an empty slot and installing the default linter.
    - assert: file AGENTS.md
    - assert: file justfile
    - assert: file eslint.config.js
    - assert: filematch package.json eslint
    - assert: filematch eslint.config.js complexity|max-params|max-lines
    - assert: filematch justfile eslint
    - assert: nofile .oxlintrc.json
    - assert: nofile biome.json

20. **Existing Biome: one linter, one formatter.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: `biome.json` and Biome scripts own both the lint and format slots. The bootstrap must keep them and add neither Oxlint nor Prettier. Measured 0/5 in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`, failing `unchanged biome.json` because the skill merges the four Biome limits (the instructed step-11 behavior); the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved and the assertion needs a follow-up correction.
    - expect: Detects Biome as the linter and formatter and leaves `biome.json` untouched.
    - expect: Uses the project's Biome commands in the justfile and reports the existing choice.
    - expect: Watch for: adding Prettier or Oxlint beside Biome, or rewriting the config.
    - assert: file AGENTS.md
    - assert: file justfile
    - assert: unchanged biome.json
    - assert: filematch package.json biome
    - assert: filematch justfile biome
    - assert: nofile .oxlintrc.json
    - assert: nofile .prettierrc
    - assert: nofile eslint.config.js

21. **Monorepo: npm workspaces, no Turbo by default.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: a root `package.json` with `workspaces: ["packages/*"]` and two packages. The profile is a monorepo, and the default keeps npm workspaces instead of adding a task runner. Measured 5/5 in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved.
    - expect: Detects the workspace profile and records it in `AGENTS.md`.
    - expect: Keeps the workspace manifest and adds no Turbo or Nx configuration.
    - expect: Fills the empty linter and formatter slots with the default tools.
    - expect: Watch for: flattening the workspace or adding a second package manager.
    - assert: file AGENTS.md
    - assert: file justfile
    - assert: file .oxlintrc.json
    - assert: file .prettierrc
    - assert: filematch package.json workspaces
    - assert: filematch AGENTS.md monorepo|workspaces
    - assert: nofile turbo.json
    - assert: nofile nx.json

22. **Ambiguous stack: refuse with a diagnostic.**
    - prompt: Set up the harness here.
    - tags: stack, behaviour
    - why: fixture: both a TypeScript/Node manifest and a Python manifest. The harvester must ask which stack (or which directory) to harness instead of picking one and writing a harness. Measured 5/5 in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; the control is 0/0 clean in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (5 contaminated), so the cell is unresolved.
    - expect: Names the ambiguity and asks which directory or stack to use.
    - expect: Writes no harness, no docs skeleton and no technical config.
    - expect: Watch for: choosing TypeScript or Python silently.
    - assert: nofile AGENTS.md
    - assert: nofile justfile
    - assert: nofile .oxlintrc.json
    - assert: nofile docs/pipeline.md
    - assert: unchanged package.json
    - assert: unchanged pyproject.toml
    - assert: unchanged tsconfig.json
    - assert: reply which (directory|stack)|two stacks|ambiguous|both|conflict

23. **Trigger: an existing Bun repo asks for the missing hooks.**
    - prompt: Our repo already uses Bun and has a working test command — add the hooks and CI we are missing without switching the toolchain.
    - tags: stack, trigger
    - gate: off
    - why: the skill is never named; preserving Bun while adding hooks/CI is the bootstrap the description promises, not a tool-by-tool install. Measured 4/4 clean (1 contaminated, a host read) in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`; routing is 4/4 clean loads, not a five-clean cell.
    - expect: Loads `bootstrap-project-harness` and keeps Bun.
    - expect: Does not install husky or a second package manager.
    - assert: skill bootstrap-project-harness
