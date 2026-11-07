---
id: TASK-55
title: 'harness: `backlog task edit --comment` descarta comentários históricos'
status: To Do
assignee: []
created_date: '2026-11-07T23:31:00Z'
labels: []
dependencies: []
references:
  - AGENTS.md
  - backlog/tasks
priority: medium
type: task
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ao anexar comentário com `backlog task edit TASK-N --comment "..."`, o CLI trunca o comentário na **primeira linha que é só `---`** e descarta tudo depois dela, incluindo o comentário seguinte. Ocorreu em 2026-11-07 ao reconciliar TASK-3/17/24/27/36/53: o histórico (inclusive comentários de 2026-11-02 e 2026-11-03) sumiu; o workaround foi `git checkout HEAD -- backlog/tasks/` e reaplicar as mudanças à mão. O risco é silencioso: o comando imprime 'Updated task' e sai 0.

Reprodução (2026-11-07, Backlog.md 1.55.3, binário `/Users/wendell/.bun/install/global/node_modules/backlog.md`):

| COMMENTS antes | após `--comment "NOVO"` |
| --- | --- |
| `created: …` / `---` / Primeiro / `---` / Segundo | sobra `Primeiro`; `Segundo` desaparece |
| um comentário com `---` dentro de code fence | o corpo é cortado no `---` interno e o resto some |
| dois comentários separados por `---` | sobra o primeiro; o segundo desaparece |

A regra: o bloco é lido como `cabeçalho` + `corpo` até o próximo `---`, e os demais segmentos não são religados. `CONTRIBUTING.md#editing-the-backlog` documenta o workaround.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A perda é reproduzida de forma determinística e registrada (comandos, entrada e saída). Não é um teste automatizado porque o CLI é um binário pré-compilado: não há código no pacote para testar e um teste do binário exigiria um projeto backlog real como dependência soft.
- [x] #2 Causa identificada: `---` isolado no bloco COMMENTS trunca o corpo naquele ponto; upstream Backlog.md 1.55.3 (o wrapper `cli.js` só repassa para o binário).
- [x] #3 Workaround documentado em `CONTRIBUTING.md` (não usar `--comment` em task com `---` no bloco; conferir `git diff -- backlog/tasks/` depois de qualquer edit) e referenciado em `AGENTS.md`.
- [ ] #4 Issue aberta no repositório upstream (MrLesk/Backlog.md). Bloqueado por autorização: publicar em nome do usuário exige aprovação explícita.
- [ ] #5 O próximo uso real de `backlog task edit --comment` é conferido com `git diff -- backlog/tasks/` sem remoções de comentário.
<!-- AC:END -->
