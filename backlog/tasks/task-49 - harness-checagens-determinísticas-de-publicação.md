---
id: TASK-49
title: 'harness: checagens determinísticas de publicação'
status: To Do
assignee: []
created_date: '2026-11-07T00:04:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Duas classes de erro consumiram rodadas de review na 0.5.0/0.6.0 e são mecânicas: (a) a spec declara files: que não bate com o diff, task que não resolve, depends_on assimétrico, placeholder esquecido; (b) um documento cita run dir inexistente, inacabado, ou cita como limpo um run que o check-eval-run reprova. Três das quatro rodadas da SPEC-0028 foram exatamente (a) e (b). Implementar dois CLIs sem modelo: spec-check (estático + --base/--spec para o diff) e check-evidence (docs/evals contra o store). Rodar no selftest. O ganho é cortar o custo de review de todas as ondas seguintes e impedir que número podre chegue ao main.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 spec-check falha quando files: != git diff --base...HEAD, quando task: não resolve em backlog/tasks, quando depends_on/blocks não são simétricos ou apontam para slug inexistente, e quando uma spec implemented ainda tem placeholder.
- [ ] #2 check-evidence falha quando um run dir citado não existe, não está completed, ou é dirty sob o detector corrente e a linha não o marca (dirty/leak/host/stall/history/discard).
- [ ] #3 Os dois rodam sem modelo, no selftest, e o corpus atual passa depois das correções que a própria spec fizer.
- [ ] #4 Testes com fixtures sintéticas cobrem cada regra e o caso limpo; nada de falso positivo no corpus real.
<!-- AC:END -->
