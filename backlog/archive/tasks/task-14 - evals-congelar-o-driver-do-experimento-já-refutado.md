---
id: TASK-14
title: 'evals: congelar o driver do experimento já refutado'
status: Done
assignee: []
created_date: '2026-11-02T18:55:00Z'
updated_date: '2026-11-05T12:49:00Z'
labels: []
dependencies: []
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`docs/evals/experiments/wip-operations-contract/run.sh` reimplementa o que o runner já faz: monta o stage 1 e o stage 2, copia fixtures, escolhe a skill, roda `run-evals.mjs` e colhe o transcript do diretório mais recente. A hipótese que ele servia — contrato de observabilidade por passo em `write-implementation-prompt` — foi refutada em três desenhos e está registrada no README do diretório.

O custo de manter isso apareceu duas vezes numa única sessão: um `local skill=$2` sem segundo argumento abortou a rodada, e o `newest_run` não encontrava o diretório porque o nome ganha o sufixo `--without-skill`. Ambos foram consertados, e ambos voltam a quebrar quando o runner mudar.

O README é evidência e fica. O script é scaffolding de um experimento encerrado.

Duas saídas aceitáveis: apagar o `run.sh` e embutir no README os comandos exatos que produziram cada braço; ou marcá-lo como congelado, dizendo que não acompanha o runner, e aceitar que ele pode não rodar mais.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 o README continua reproduzível sem o script, ou o script continua com um estado declarado
- [x] #2 nenhum staging duplicado permanece como caminho "vivo"
- [x] #3 nenhuma referência em doc quebra (SPEC, README, matriz)
- [x] #4 o resultado negativo do experimento continua legível para quem chegar depois
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:55:00Z

---

Aberto a partir da revisão de dívida técnica. Não é urgente; é o tipo de coisa que só custa quando alguém tenta rodar de novo.
Groomed into `docs/specs/SPEC-0011-retire-refuted-experiment-driver.md` (draft). Saída escolhida: apagar `run.sh` e embutir no README a sequência exata (stage 1, harvest, stage 2, braço bare, probe). A verificação reconstrói os dois roots e compara os hashes congelados, sem rodada de modelo.

<!-- COMMENTS:END -->
