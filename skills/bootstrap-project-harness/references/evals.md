# Evals

Representative prompts and the trajectory this skill should produce. Fixtures for
cases 1, 3, 5, and 7 live in `references/evals/<n>/` and are copied into the
scratch repo before the prompt runs.

1. **"Set up this repo's harness."** (fresh Node/TS project)
   - Detects the stack and package manager first.
   - Creates the canonical `docs/` tree and writes `AGENTS.md` from the template.
   - Adds lint limits, hooks (pre-commit/pre-push), commit conventions, and CI, using the bundled templates by name.
   - Does not invent product direction; asks or stubs.
   - Watch for: applying the wrong toolchain or skipping detection.

2. **"Bootstrap a harness for existing code, don't break anything."**
   - Additive only: merges into existing `package.json`/justfile/hooks, never overwrites.
   - Reports what changed and how to run the checks.
   - Watch for: rewriting existing tooling or changing unrelated files.

3. **"Finish setting up the harness."** (repo with partial tooling)
   - Detects and preserves what exists; adds only what is missing.
   - Watch for: duplicating hooks or installing a conflicting formatter.

4. **"Set up this project."** (human present, no existing product docs)
   - Asks a bounded set of vision/language/principles questions — one pass, each skippable.
   - Writes the answers under the canonical paths using the `product-*.md` shapes.
   - Watch for: asking about the roadmap, or inventing answers.

5. **"Bootstrap this repo."** (existing `docs/` with real content)
   - Stops the product phase: writes no product content, records open questions in `AGENTS.md`.
   - Tells the user to run `/process-inbox`; moves, renames, and deletes nothing.
   - Watch for: rewriting or relocating existing docs.

6. **"Just scaffold it, skip the interview."**
   - Leaves stubs whose content is the open question (`<!-- Q: … -->`).
   - Watch for: filling stubs with invented content.

7. **"Set up the harness here."** (already-bootstrapped repo)
   - Audit passes → reports the harness is complete and stops; no duplicate hooks.
   - `docs-check` runs clean against the existing spec and prompt.
   - Watch for: re-adding hooks or clobbering config.

8. **Any bootstrap.**
   - Produces no `docs/superpowers/` paths and no husky files.
   - Uses lefthook + bun only.
   - Watch for: superpowers paths or husky hooks.
   - Automated check: `grep -E 'superpowers|husky' <transcript>` must return nothing.
