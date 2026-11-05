# Este repo usa o pdlc

Este repositório autora skills e o harness que as avalia. O manual é
`CONTRIBUTING.md`; o mapa da documentação é `docs/README.md`.

## Operação

- A policy é `docs/pipeline.md` (modo, tier, gates, paths). Muda só por human
  gate — não edite por conta própria.
- A fila de trabalho é `docs/specs/active/`; `docs/specs/` é o registro durável.
- Uma spec por worker. O worker não sai do worktree. O reviewer é read-only.
- Push nunca: branches e worktrees ficam locais até decisão humana.

## Gates

- Antes de dizer que terminou: `pdlc preflight` e os gates declarados na policy
  (`lint`, `selftest`).
- Gate vermelho não é "quase pronto": reporte o comando e a saída.
- Evals comportamentais não são gate de CI: custam dinheiro e são evidência
  local, com run dir citado em `docs/evals/coverage.md`.

## Ciclo

`pdlc plan` → `pdlc prompt <slug>` → `pdlc dispatch <slug>` → worker implementa →
reviewer → `pdlc review` → `pdlc verify` → `pdlc merge` → `pdlc audit`.

Detalhes de contribuição e de medição estão em `CONTRIBUTING.md`.
