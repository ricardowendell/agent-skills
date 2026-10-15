# Evals

Representative prompts and the trajectory this skill should produce. Fixtures for
cases 1, 2, 3, 5, and 7 live in `references/evals/<n>/` and are copied into the
scratch repo before the prompt runs.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case — `file`,
`nofile` (file exists/absent), `dir`/`nodir` (directory), `filematch` (file
content matches a regex), `grep`/`nogrep` (regex on the transcript),
`unchanged`/`changed` (byte-compare to the fixture copy). Prefer filesystem
assertions: `grep` sees the whole transcript, including this file, so a pattern
that appears here would false-match.

1. **"Set up this repo's harness."** (fresh Node/TS project)
   - Detects the stack and package manager first.
   - Creates the canonical `docs/` tree and writes `AGENTS.md` from the template.
   - Adds lint limits, hooks (pre-commit/pre-push), commit conventions, and CI, using the bundled templates by name.
   - Does not invent product direction; asks or stubs.
   - Watch for: applying the wrong toolchain or skipping detection.
   - [assert] file AGENTS.md
   - [assert] dir docs/product
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

7. **"Set up the harness here."** (already-bootstrapped repo)
   - Audit passes → reports the harness is complete and stops; no duplicate hooks.
   - `docs-check` runs clean against the existing spec and prompt.
   - Watch for: re-adding hooks or clobbering config.
   - [assert] unchanged docs/specs/SPEC-0001-demo.md
   - [assert] unchanged docs/prompts/implementation/SPEC-0001-demo.prompt.md

8. **Any bootstrap.**
   - Produces no `docs/superpowers/` paths and no husky files.
   - Uses lefthook + bun only.
   - Watch for: superpowers paths or husky hooks.
   - [assert] nofile .husky
   - [assert] nofile docs/superpowers
