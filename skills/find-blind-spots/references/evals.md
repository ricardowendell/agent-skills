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

3. **Trigger: a design about to be locked in, no skill named.**
   - prompt: I am about to replace the job queue with a cron poller. What am I not seeing?
   - tags: trigger
   - why: "blind spots" never appears; the signal is a decision about to be committed to plus a request for what is missing
   - gate: off
   - expect: Loads `find-blind-spots` and starts asking, rather than listing risks off the cuff.
   - assert: skill find-blind-spots

4. **Near-miss: the same plan, but to be decomposed, not challenged.**
   - prompt: Turn the plan in plan.md into tasks I can drop on the board.
   - tags: trigger
   - status: manual
   - why: same artefact and a planning verb; the deliverable is a task list, not an adversarial interview. Measured 2/3 then 1/3 loads at `--repeat 3`: the agent sometimes loads the skill to check, then says the request is a breakdown job. The reply was correct every time, so the routing assertion measures noise, not behaviour.
   - gate: off
   - expect: Does not start an interrogation of a plan the user only wants broken into tasks.
   - assert: notskill find-blind-spots
