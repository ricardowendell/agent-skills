---
id: TASK-55
title: 'harness: `backlog task edit --comment` descarta comentários históricos'
status: To Do
assignee: []
created_date: '2026-11-07T23:31:00Z'
updated_date: '2026-11-07T23:47:00Z'
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

A regra: o bloco é lido como `cabeçalho` + `corpo` até o próximo `---`, e os demais segmentos não são religados. `--status` e `--check-ac` não tocam o bloco (verificado); só `--comment` é destrutivo.

Workaround: `node scripts/backlog-comment.mjs TASK-N "texto"` anexa por cirurgia de texto (insere antes de `<!-- COMMENTS:END -->`, sem parsear o bloco), com 9 testes em `scripts/lib/backlog-comment.test.mjs`. Documentado em `CONTRIBUTING.md#editing-the-backlog`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A perda é reproduzida de forma determinística e registrada (comandos, entrada e saída). O binário é externo: não há código no pacote para um teste unitário do CLI; o workaround local tem 9 testes próprios.
- [x] #2 Causa identificada: `---` isolado no bloco COMMENTS trunca o corpo naquele ponto; upstream Backlog.md 1.55.3 (o wrapper `cli.js` só repassa para o binário). `--status`/`--check-ac` não reescrevem o bloco.
- [x] #3 Workaround implementado em `scripts/backlog-comment.mjs` (+ `scripts/lib/backlog-comment.mjs`), documentado em `CONTRIBUTING.md` e referenciado em `AGENTS.md`; verificado num corpo com `---` e code fence.
- [ ] #4 Issue aberta no repositório upstream (MrLesk/Backlog.md). Bloqueado por autorização: publicar em nome do usuário exige aprovação explícita.
- [ ] #5 Se `backlog task edit --comment` voltar a ser usado, o `git diff -- backlog/tasks/` é conferido por remoções. O caminho padrão passou a ser o script, então este AC só fecha com um uso real.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T23:55:00Z

---

Teste real do workaround: este corpo tem uma regra horizontal.

---

E um bloco:

```
x
---
y
```

Nada disto pode sumir.

---

created: 2026-11-08T00:05:00Z

---

Workaround implementado e testado em 2026-11-07. Escopo medido: `--status` e `--check-ac` preservam o bloco; so `--comment` trunca.

---

Comando: `node scripts/backlog-comment.mjs TASK-N "texto" [--at ISO] [--dry-run]`. Insere o registro antes de `COMMENTS:END` sem parsear o bloco, entao corpo com regra horizontal e code fence sobrevive. Este proprio comentario e o teste de campo: se a linha abaixo existir, nada foi perdido.

FIM-DO-TESTE-DE-CAMPO

---
<!-- COMMENTS:END -->
