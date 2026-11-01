# Evals

Representative prompts and the trajectory this skill should produce. Fixtures for
cases 1, 2, 3, 5, 7, 9, 10, and 11 live in `references/evals/<n>/` and are copied
into the scratch repo before the prompt runs.

The runner copies a plain tree: no `.git`, no history. That limits what a case can
assert. Case 7's fixture is a harness from before the current templates, but with
no `.git` and no source the skill reads it as an empty repo, so the case asserts
additive completion rather than the "complete harness → stop" path. That stop
path stays manual until the runner can stage a committed repository.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

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
   - expect: Uses lefthook + bun only.
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
   - assert: nofile eslint.config.js

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
