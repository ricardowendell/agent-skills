# Evals

Representative prompts and the trajectory this skill should produce. Use these
to check triggering and behavior after edits.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Groom the backlog.**
   - prompt: Groom the backlog.
   - expect: Reads `AGENTS.md`, product docs, and existing specs first.
   - expect: Creates or updates small specs in `docs/specs/SPEC-*.md` as `draft`.
   - expect: Runs the design-principles check and the readiness gate; leaves specs `draft` unless every gate item passes.
   - expect: Watch for: inventing product direction, oversized specs, or marking `ready` with failing gates.
   - assert: filematch docs/specs/*.md status: draft
   - assert: filematch docs/backlog/now-next-later.md weekly digest email

2. **Turn this rough idea into a spec: *build the whole onboarding flow*.**
   - prompt: Turn this rough idea into a spec: *build the whole onboarding flow*.
   - expect: Flags the item as too broad and proposes a split before writing.
   - expect: Does not silently produce one giant spec.
   - expect: Watch for: accepting "build everything" as a single spec.
   - assert: nodir docs/specs

3. **Mark SPEC-0003 ready.**
   - prompt: Mark SPEC-0003 ready.
   - why: when acceptance criteria or dependencies are unmet
   - expect: Keeps it `draft` and lists exactly what is blocking readiness.
   - expect: Watch for: obeying the instruction blindly and flipping the status.
   - assert: filematch docs/specs/SPEC-0003*.md status: draft
   - assert: filematch docs/specs/SPEC-0003-onboarding.md SPEC-0001

4. **"Groom the backlog" in a repo whose docs layout differs from the default.**
   - prompt: Groom the backlog.
   - expect: Discovers the real layout from `AGENTS.md`/README and maps the same concepts.
   - expect: Watch for: assuming `docs/product/vision.md` exists.
   - assert: filematch work/specs/*.md status: draft
   - assert: filematch work/backlog.md rename a saved view

5. **Groom the weekly digest email backlog item.**
   - prompt: Groom the weekly digest email backlog item.
   - why: fixture: existing backlog + scope
   - expect: Writes a small spec under `docs/specs` with YAML frontmatter (an `id` and a `status`).
   - expect: Leaves the backlog item in place.
   - expect: Watch for: expanding scope beyond the item, or rewriting the backlog file.
   - assert: filematch docs/specs/*.md id: SPEC-
   - assert: filematch docs/backlog/now-next-later.md weekly digest email that summarizes the week's activity
