# Evals

Representative prompts and the trajectory this skill should produce. No fixture:
this skill interviews, it writes nothing.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch`, `grep`, `nogrep`, `reply`, `noreply`,
`verdict`, `unchanged`, `changed`). `reply` matches the agent's text only, so the
skill's own wording cannot satisfy it.

1. **"Poke holes in this plan."** (no plan given)
   - Asks for the plan instead of inventing one to attack.
   - Writes nothing: no spec, no notes file, no scratch artefact in the repo.
   - Watch for: an invented plan, or a generic risk list with nothing to attack.
   - [assert] reply \?
   - [assert] nodir docs
   - [assert] nofile AGENTS.md

2. **"Stress-test this: we're moving billing into a shared Postgres used by three services."**
   - Asks one sharp question per turn — a challenge to an assumption, failure
     mode, or owner — not a questionnaire.
   - Does not drift into proposing the implementation.
   - Watch for: a bulleted list of generic "have you considered…" prompts that a
     one-word answer closes.
   - [assert] reply \?
   - [assert] nodir docs
