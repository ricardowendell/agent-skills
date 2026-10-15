# Evals

Representative prompts and the trajectory this skill should produce. Use these
to check triggering and behavior after edits.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). A case's fixture lives in `references/evals/<n>/`.

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

5. **"Groom the weekly digest email backlog item."** (fixture: existing backlog + scope)
   - Writes a small spec under `docs/specs` with YAML frontmatter (an `id` and a `status`).
   - Leaves the backlog item in place.
   - Watch for: expanding scope beyond the item, or rewriting the backlog file.
   - [assert] filematch docs/specs/*.md id: SPEC-
   - [assert] unchanged docs/backlog/now-next-later.md
