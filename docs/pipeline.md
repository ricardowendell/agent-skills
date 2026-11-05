---
mode: orchestrated      # direct | orchestrated
release_tier: B         # A | B
retry_budget: 1         # retries before escalating
specs_dir: docs/specs/active
trees_dir: .lane/trees
state_dir: .pdlc
run_records_dir: runs
agents_dir: .opencode/agents
lint: node scripts/validate-skills.mjs --root skills
selftest: node scripts/run-evals.mjs --root skills --list --check && node --test scripts/lib/evals/*.test.mjs && node --test skills/bootstrap-project-harness/scripts/*.test.mjs && node scripts/check-sensor-parity.mjs
pdlc_version: 0.4.1
---

# Pipeline

Como este repo conduz trabalho com o `pdlc`. Este arquivo é a **policy**: muda
só por human gate, e a evolução fica versionada no git.

## O que este repo é

Uma coleção de skills autorais e do harness que as pontua. O manual é
`CONTRIBUTING.md`; o mapa da documentação é `docs/README.md`. Specs históricas
(`docs/specs/SPEC-*.md`) são o registro durável. A fila de trabalho do pdlc vive
em `docs/specs/active/` — uma spec só entra no plano quando é `status: ready` e
declara `task:` e `files:`.

## Mode selection

- **direct**: 1 tarefa sem dependências, sem worktree. Serve para ajustes que não
  precisam de gate de reviewer.
- **orchestrated** (default aqui): qualquer spec que precise de `dispatch`,
  `verify` e `merge`. `verify` exige um worktree limpo em `.lane/trees/<slug>`,
  então mesmo uma spec única roda como uma onda.

## Estágios

| Estágio | Exit artifact | Gate | Evidência |
| --- | --- | --- | --- |
| backlog | task no Backlog.md | — | — |
| ready | spec em `docs/specs/active/` | humano (groom) | `spec_sha` |
| in_progress | implementação no worktree | — | — |
| verify | diff commitado e gates verdes | reviewer read-only | APPROVE |
| merged | merge no branch de trabalho | humano (merge sign-off) | run record |
| released | tag | release gate | tag |

## Gates

- `lint` — validador de skills; roda no worktree.
- `selftest` — o mesmo conjunto do CI: `--list --check`, testes do harness,
  testes do bootstrap, sensor parity.
- **Evals comportamentais não são gate.** Eles chamam modelo, custam dinheiro e
  ficam locais; a evidência é o run dir em
  `~/.local/share/opencode/evals/runs/` e a linha publicada em `docs/evals/`.

## Separação de specs

- `docs/specs/active/` — fila do pdlc. O `plan`, `prompt`, `verify` e `merge`
  leem daqui.
- `docs/specs/` — registro durável das specs já implementadas. Não é tocado pelo
  ciclo; uma spec ativa pode ser movida para cá depois do merge.

## Release tier

- **B** (interno): tag seca, sem semver nem CHANGELOG. O repo não versiona
  pacote; o artefato é o conjunto de skills.

## Ways of working

- Uma spec por worker; o worker não sai do worktree.
- O reviewer é read-only e devolve APPROVE ou REJECT com achados `file:line`.
- Push é human gate; worktrees e branches ficam locais até decisão humana.
- Mudança de policy (este arquivo) passa por retro e human gate.
