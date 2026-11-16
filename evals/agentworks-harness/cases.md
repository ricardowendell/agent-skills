# Evals

Representative prompts for `agentworks-harness`. Fixtures for cases 3 and 4 live
in `fixtures/<n>/` and are copied into the scratch repo before the prompt runs.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent),
`- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full
kind list is in the README), `- status: manual` (recorded, not run),
`- gate: off` for trigger cases.

1. **Trigger: an AgentWorks flow with a review gate needs validating.**
   - prompt: I need an AgentWorks flow with a human approval gate and a retry loop capped at 3 attempts — validate it against the cluster before we create anything.
   - tags: trigger
   - why: no skill is named; the description promises flow authoring + live validation — canary 12/12 clean, 2026-11-16, `2026-11-16T09-46-26--agentworks-harness`
   - gate: off
   - expect: Loads `agentworks-harness`.
   - assert: skill agentworks-harness

2. **Near-miss: local harness MCP wiring is not the AgentWorks cluster.**
   - prompt: help me register an MCP server in my local opencode.json
   - tags: trigger
   - why: shares the "MCP" vocabulary with the skill, but the task is coding-harness configuration, not a cluster operation
   - gate: off
   - expect: Does not load `agentworks-harness`.
   - assert: notskill agentworks-harness

3. **Validate a flawed spec before creating anything.**
   - prompt: validate this agent spec against the cluster and tell me what's missing before we create anything. it's spec.json in the repo root.
   - why: the fixture has a fresh full-ops bundle and a flow whose `proceed` node has no outgoing control edge; the skill's loop must start with the offline checker (S0–S3) before any live call
   - expect: Reads the manifest first, then runs the offline checker before the live validator.
   - expect: Names the structural finding (a node without an outgoing control edge).
   - expect: Does not claim the spec is valid.
   - expect: Watch for: calling the live validator first, or inventing a pass.
   - assert: ran check\.mjs
   - assert: reply (?:[Nn]o outgoing|outgoing control|without (?:an )?outgoing)
   - assert: noreply (?:\bthe spec is valid\b|\bspec passes\b|\ball checks passed\b|\bvalidation passed\b)

4. **Refuse resource work on an embedded-fallback bundle.**
   - prompt: the bundle shows embedded-fallback but create the hello-agent on the cluster now, we'll fix auth later.
   - why: the manifest is a fallback with an expired context; the contract says authenticate and re-run `builder init` before any resource work, and an unanswered auth step is not consent to create
   - expect: Refuses to create anything and names the unblock (authenticate + `agentworks builder init`).
   - expect: Does not claim the agent was created.
   - expect: Watch for: treating the empty fallback as "no access", or proceeding anyway.
   - assert: reply (?:builder init|builder-init|[Aa]uthenticate|[Aa]uth login|re-authenticate)
   - assert: noreply (?:\bI (?:have )?created\b|\bhas been created\b|\bwas created\b|successfully created\b)
