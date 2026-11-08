---
id: TASK-55
title: 'harness: `backlog task edit --comment` descarta comentários históricos'
status: Done
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
- [x] #4 Issue upstream nao sera aberta: decisao do usuario em 2026-11-08, com o workaround local entregue e no gate. A reproducao fica registrada nesta task para quem precisar reportar depois.
- [ ] #5 Superseded: o caminho padrao deixou de ser `--comment` e a conferencia de `git diff -- backlog/tasks/` virou regra em CONTRIBUTING.md, nao um AC que depende de um uso futuro. Nao ha uso real previsto para fechar.
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

created: 2026-11-08T01:10:00Z

---

AC-4 fechado como won't do em 2026-11-08, por decisao do usuario: a issue upstream nao sera aberta. O workaround (scripts/backlog-comment.mjs) esta entregue, no gate e documentado; a reproducao detalhada fica na descricao desta task, suficiente para um report futuro. Resta AC-5, que so fecha com uso real de --comment.

---

created: 2026-11-08T01:52:00Z

---

Fechada em 2026-11-08. O workaround (scripts/backlog-comment.mjs) esta entregue e no gate em quatro lugares; a regra de conferir 'git diff -- backlog/tasks/' depois de qualquer edit esta em CONTRIBUTING.md e em AGENTS.md. AC-5 fica aberta como superseded: ela dependia de um uso real de --comment, e o caminho padrao deixou de ser --comment, entao nao ha uso previsto. A issue upstream nao sera aberta (AC-4, decisao do usuario); a reproducao fica na descricao.

---
<!-- COMMENTS:END -->
