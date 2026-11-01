# Evals

Representative prompts and the trajectory this skill should produce. No fixture:
this skill interviews, it writes nothing.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Poke holes in this plan.**
   - prompt: Poke holes in this plan.
   - why: no plan given
   - expect: Asks for the plan instead of inventing one to attack.
   - expect: Writes nothing: no spec, no notes file, no scratch artefact in the repo.
   - expect: Watch for: an invented plan, or a generic risk list with nothing to attack.
   - assert: reply \?
   - assert: nodir docs
   - assert: nofile AGENTS.md

2. **Stress-test this: we're moving billing into a shared Postgres used by three services.**
   - prompt: Stress-test this: we're moving billing into a shared Postgres used by three services.
   - expect: Asks one sharp question per turn — a challenge to an assumption, failure mode, or owner — not a questionnaire.
   - expect: Does not drift into proposing the implementation.
   - expect: Watch for: a bulleted list of generic "have you considered…" prompts that a one-word answer closes.
   - assert: reply \?
   - assert: nodir docs
