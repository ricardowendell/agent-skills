# Evals

The three cases below are **plan-only**: each prompt asks for the exact steps and
says not to execute. That is deliberate — the skill's value is the boundary it
enforces before anything runs (which setting must be on, which guard must pass,
which tool owns the DAG), and executing a pdlc cycle inside the eval scratch dir
would need a real repo, a real Orca runtime and a real agent quota.

What separates a with-skill run from a baseline here is not prose quality: it is
whether the answer names `external-worktree-visibility show`, the
`orca worktree current` guard, `pdlc dispatch` as the owner of the worktree, and
`pdlc plan` as the owner of parallelism. The baseline tends to answer with
`orca worktree create` and `orca orchestration`, which is exactly the failure the
skill exists to prevent.

1. **O agente commitou na main, não no worktree.**
   - prompt: Estou rodando a spec pdlc-107 dentro do Orca. O `pdlc dispatch` criou o worktree, mas o agente que abri no terminal commitou direto na `main`. O que aconteceu e como eu corrijo sem perder os commits? Não execute nada agora.
   - why: With external-worktree-visibility=hide, `orca worktree current` silently resolves the main worktree, so an agent launched on that answer works in `main`. The answer must diagnose the setting, name the guard and give a recovery that keeps the commits.
   - expect: Names `external-worktree-visibility` / `hide` as the cause, not "the agent was careless".
   - expect: Gives `orca repo set … --external-worktree-visibility show` and says to check `orca worktree current` path and branch (or the guard script) before launching any agent.
   - expect: Recovers the commits by moving them to the `pdlc/<slug>` branch and resetting `main` — not by discarding them.
   - expect: Watch for: blaming the model, re-dispatching over the commits, or `git reset --hard` without a branch holding them.
   - assert: reply external[-\s]?worktree[-\s]?visibility
   - assert: reply orca repo set
   - assert: reply orca worktree current|orca-guard
   - assert: reply git (branch|reset)
   - tags: orca, trap

2. **Passo a passo para rodar uma spec dentro do Orca.**
   - prompt: Quero rodar a spec pdlc-104 dentro do Orca, com um agente supervisionado. Me dá o passo a passo exato, sem executar nada.
   - why: The happy path: pdlc owns the worktree, the prompt and the gates; Orca owns the workspace and the terminal. The answer must show both halves in the right order.
   - expect: Configures the repo (`orca repo set … show`) and guards the worktree before launching an agent.
   - expect: Uses `pdlc dispatch` for the worktree and `pdlc prompt` for the pinned text — not `orca worktree create` and not a rewritten prompt.
   - expect: Keeps `pdlc review` and `pdlc verify` as the gates, and closes the Orca terminals before `pdlc merge`.
   - expect: Watch for: creating the worktree with Orca, rewriting the spec into a prompt, or treating the visual diff as the verdict.
   - assert: reply pdlc dispatch
   - assert: reply external[-\s]?worktree[-\s]?visibility show
   - assert: reply orca worktree current|orca-guard
   - assert: reply pdlc prompt
   - assert: reply pdlc review
   - assert: reply pdlc verify
   - assert: reply orca terminal close|fechar? (o|os)? ?terminal
   - tags: orca, happy-path

3. **Duas specs em paralelo pelo orquestrador do Orca.**
   - prompt: Preciso entregar a pdlc-106 e a pdlc-107 em paralelo. Posso usar o orquestrador do Orca para despachar as duas e ganhar tempo? Não execute nada.
   - why: Orca ships orchestration tasks, dispatch and gates. Mirroring the specs there would create a second DAG and a second owner of state — the failure pdlc exists to prevent. Parallelism belongs to pdlc's plan.
   - expect: Says the DAG and the waves are pdlc's, and that Orca is the workspace/terminal layer.
   - expect: Uses `pdlc plan` (waves, `waiting`) and dispatches the ready spec, one per worker.
   - expect: Notes that colliding files are serialized and that the allowlist bounds each worker.
   - expect: Watch for: creating Orca orchestration tasks for the same specs, or dispatching two specs that share a file in one wave.
   - assert: reply pdlc plan
   - assert: reply (wave|onda|waves|DAG|serializ)
   - assert: reply (uma spec|1 spec|por worker|por spec|por worktree|one spec)
   - tags: orca, boundary
