# Este repo usa o pdlc

Este repositório autora skills e o harness que as avalia. O manual é
`CONTRIBUTING.md`; o mapa da documentação é `docs/README.md`.

## Operação

- A policy é `docs/pipeline.md` (modo, tier, gates, paths). Muda só por human
  gate — não edite por conta própria.
- A fila de trabalho é `docs/specs/active/`; `docs/specs/` é o registro durável.
- Uma spec por worker. O worker não sai do worktree. O reviewer é read-only.
- Push nunca: branches e worktrees ficam locais até decisão humana.
- `backlog task edit --comment` trunca o comentário na primeira linha `---` e
  descarta o resto (binário upstream, 1.55.3). Use
  `node scripts/backlog-comment.mjs TASK-N "texto"`; `--status`/`--check-ac`
  seguem seguros. Ver `CONTRIBUTING.md#editing-the-backlog` e TASK-55.

## Gates

- Antes de dizer que terminou: `pdlc preflight` e os gates declarados na policy
  (`lint`, `selftest`).
- Gate vermelho não é "quase pronto": reporte o comando e a saída.
- Evals comportamentais não são gate de CI: custam dinheiro e são evidência
  local, com run dir citado em `docs/evals/coverage.md`.

## Ciclo

`pdlc plan` → `pdlc prompt <slug>` → `pdlc dispatch <slug>` → worker implementa →
reviewer → `pdlc review` → `pdlc verify` → `pdlc merge` → `pdlc audit`.

O `task:` do frontmatter ainda não é resolvido no dispatch/verify (verificado na
pdlc 1.4: `dispatch.mjs:214` e `verify.mjs:323` usam `taskIdFromSlug`). Marque a
task à mão: `backlog task edit TASK-N --status "In Progress"` antes do worker.
Como o backlog deste repo só configura `To Do`/`In Progress`/`Done`, não existe
`In Review`; a task fica `In Progress` até o merge fechá-la. `dispatch`/`verify`
resolvem pelo slug (`SPEC-NNNN`), então o aviso "não foi possível marcar
SPEC-..." é esperado; `plan` e `merge` já usam `resolveTaskId`. Ver TASK-36.

Detalhes de contribuição e de medição estão em `CONTRIBUTING.md`.
