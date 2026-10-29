# Evals

Representative prompts and the trajectory this skill should produce. Fixtures for
cases 1, 2, 3, 5, 7, 9, 10, and 11 live in `references/evals/<n>/` and are copied
into the scratch repo before the prompt runs.

The runner copies a plain tree: no `.git`, no history. That limits what a case can
assert. Case 7's fixture is a harness from before the current templates, but with
no `.git` and no source the skill reads it as an empty repo, so the case asserts
additive completion rather than the "complete harness → stop" path. That stop
path stays manual until the runner can stage a committed repository.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case — `file`,
`nofile` (file exists/absent), `dir`/`nodir` (directory), `filematch` (file
content matches a regex), `grep`/`nogrep` (regex on the transcript),
`unchanged`/`changed` (byte-compare to the fixture copy). Prefer filesystem
assertions: `grep` sees the whole transcript, including this file, so a pattern
that appears here would false-match.

1. **"Set up this repo's harness."** (fresh Node/TS project)
   - Detects the stack and package manager first.
   - Creates the canonical `docs/` tree and writes `AGENTS.md` from the template,
     including the leaf READMEs that keep `experience/`, `system/`, and
     `decisions/` in git.
   - Adds lint limits, hooks (pre-commit/pre-push), commit conventions, and CI, using the bundled templates by name.
   - Does not invent product direction; asks or stubs.
   - Watch for: applying the wrong toolchain or skipping detection.
   - [assert] file AGENTS.md
   - [assert] dir docs/product
   - [assert] file docs/experience/README.md
   - [assert] file docs/system/README.md
   - [assert] file docs/decisions/README.md
   - [assert] file .opencode/opencode.json
   - [assert] file docs/WORKFLOW.md
   - [assert] file docs/pipeline.md
   - [assert] filematch docs/pipeline.md release_tier
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers

2. **"Bootstrap a harness for existing code, don't break anything."**
   - Additive only: merges into existing `package.json`/justfile/hooks, never overwrites.
   - Reports what changed and how to run the checks.
   - Watch for: rewriting existing tooling or changing unrelated files.
   - [assert] file AGENTS.md
   - [assert] filematch package.json custom-build-untouched
   - [assert] unchanged .prettierrc
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers

3. **"Finish setting up the harness."** (repo with partial tooling)
   - Detects and preserves what exists; adds only what is missing.
   - Watch for: duplicating hooks or installing a conflicting formatter.
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers

4. **"Set up this project."** (human present, no existing product docs)
   - Asks a bounded set of vision/language/principles questions — one pass, each skippable.
   - Writes the answers under the canonical paths using the `product-*.md` shapes.
   - Watch for: asking about the roadmap, or inventing answers.
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers

5. **"Bootstrap this repo."** (existing `docs/` with real content)
   - Stops the product phase: writes no product content, records open questions in `AGENTS.md`.
   - Tells the user to run `/process-inbox`; moves, renames, and deletes nothing.
   - Watch for: rewriting or relocating existing docs.
   - [assert] unchanged docs/product/vision.md
   - [assert] unchanged docs/inbox/2026-01-01-idea.md

6. **"Just scaffold it, skip the interview."**
   - Leaves stubs whose content is the open question (`<!-- Q: … -->`).
   - Watch for: filling stubs with invented content.
   - [assert] filematch docs/product/vision.md <!-- Q:

7. **"Set up the harness here."** (harness predating the current templates)
   - The runner copies a plain tree: no `.git`, no source. The skill therefore
     reads the repo as empty and runs a full bootstrap, which is the correct
     behaviour for that signal — see the note at the top of this file.
   - Existing content survives: the spec, its prompt, the product vision, the
     README, and the OpenCode config are byte-identical afterwards.
   - The missing canonical files are seeded, including `docs/pipeline.md`.
   - Watch for: clobbering existing docs or config while filling gaps.
   - [assert] unchanged docs/specs/SPEC-0001-demo.md
   - [assert] unchanged docs/prompts/SPEC-0001-demo.prompt.md
   - [assert] unchanged .opencode/opencode.json
   - [assert] unchanged docs/product/vision.md
   - [assert] file docs/pipeline.md
   - [assert] file docs/architecture.md
   - [assert] filematch docs/WORKFLOW.md ## The loop

8. **Any bootstrap.**
   - Produces no `docs/superpowers/` paths and no husky files.
   - Uses lefthook + bun only.
   - Watch for: superpowers paths or husky hooks.
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers

9. **"Bootstrap this Python repo."** (fixture: an existing `pyproject.toml` + `.python-version`)
   - Detects **Python (uv)**, not TypeScript.
   - Adds the Python technical set (justfile, lefthook, pyproject tool config, CI) and the docs skeleton.
   - Preserves the existing project name; adds no `package.json` or ESLint config.
   - Watch for: applying the Node templates to a Python repo.
   - [assert] file docs/WORKFLOW.md
   - [assert] file docs/pipeline.md
   - [assert] file .opencode/opencode.json
   - [assert] file docs_check.py
   - [assert] filematch lefthook.yml uv run
   - [assert] filematch pyproject.toml name = "existing-py"
   - [assert] file docs/experience/README.md
   - [assert] nofile package.json
   - [assert] nofile eslint.config.js

10. **"Bootstrap this Python repo."** (fixture: `black` + `isort` + `pre-commit` already configured)
   - Detects Python, then finds a **competing toolchain** and reports the collision instead of adding ruff/mypy.
   - Leaves `pyproject.toml` untouched; adds no ruff config and no competing hook manager.
   - Watch for: stacking ruff on top of black.
   - [assert] unchanged pyproject.toml
   - [assert] nofile ruff.toml
   - [assert] nofile .ruff.toml
   - [assert] nofile lefthook.yml

11. **"Set up the harness here."** (fixture: a Poetry project)
   - Detects Python, but a **competing package manager** (`poetry.lock` / `[tool.poetry]`) means it stops and reports instead of imposing uv.
   - Adds no uv artifacts.
   - Watch for: running `uv sync` or writing a uv lock.
   - [assert] unchanged pyproject.toml
   - [assert] nofile uv.lock
