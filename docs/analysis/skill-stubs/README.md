# Skill stubs

Rascunhos derivados de `docs/analysis/skills-from-sessions-2026-11-07.md`.
Não são carregados pelo OpenCode porque estão fora de `~/.agents/skills`.

`report-project-status` foi promovido em 2026-11-07 para
`../skills/report-project-status/` e não tem mais rascunho aqui.

Para promover uma das restantes:

1. Revisar o `SKILL.md` e validar o escopo contra as skills existentes.
2. Copiar a pasta para `~/.agents/skills/<id>/`.
3. Adicionar `references/evals.md` com casos de trigger e comportamentais.
4. Criar o comando em `~/.agents/commands/<id>.md` e o espelho em
   `~/.agents/claude/commands/`.
5. Rodar `node scripts/validate-skills.mjs --root skills` e
   `node scripts/run-evals.mjs --root skills --list --check`.
6. Registrar no `CHANGELOG.md`.

Ordem sugerida: `sync-branch` depois de uma semana de uso de
`report-project-status`, medindo turnos até a primeira ação.
