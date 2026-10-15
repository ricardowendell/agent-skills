# Evals

Representative prompts and the trajectory this skill should produce. Use these
to check triggering and behavior after edits.

1. **"Groom the backlog."**
   - Reads `AGENTS.md`, product docs, and existing specs first.
   - Creates or updates small specs in `docs/specs/SPEC-*.md` as `draft`.
   - Runs the design-principles check and the readiness gate; leaves specs `draft` unless every gate item passes.
   - Watch for: inventing product direction, oversized specs, or marking `ready` with failing gates.

2. **"Turn this rough idea into a spec: *build the whole onboarding flow*."**
   - Flags the item as too broad and proposes a split before writing.
   - Does not silently produce one giant spec.
   - Watch for: accepting "build everything" as a single spec.

3. **"Mark SPEC-0003 ready."** (when acceptance criteria or dependencies are unmet)
   - Keeps it `draft` and lists exactly what is blocking readiness.
   - Watch for: obeying the instruction blindly and flipping the status.

4. **"Groom the backlog" in a repo whose docs layout differs from the default.**
   - Discovers the real layout from `AGENTS.md`/README and maps the same concepts.
   - Watch for: assuming `docs/product/vision.md` exists.
