# Evals

Representative prompts and the trajectory this skill should produce. A fixture in
`references/evals/<n>/` is copied into the scratch repo before the prompt runs;
case 4 is the plan to decompose, the rest interview the user directly.

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
   - why: same artefact and a planning verb; the deliverable is a task list, not an adversarial interview. The old `notskill` assertion tracked a load, and the load is noise: measured 3/3 with the skill loaded in 3/3 runs, every reply named the request a breakdown job, left `plan.md` untouched and wrote no spec or prompt. A load is recorded in the transcript and never asserted.
   - gate: off
   - expect: Does not start an interrogation of a plan the user only wants broken into tasks.
   - expect: Leaves the plan and the repo alone; the task list goes in the reply.
   - assert: unchanged plan.md
   - assert: nofile docs/specs/*
   - assert: nofile docs/prompts/*
   - assert: reply task
