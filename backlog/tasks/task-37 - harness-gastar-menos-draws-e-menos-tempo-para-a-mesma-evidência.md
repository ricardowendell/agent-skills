---
id: TASK-37
title: 'harness: gastar menos draws e menos tempo para a mesma evidência'
status: To Do
assignee: []
created_date: '2026-11-06T12:46:00Z'
labels: []
dependencies: []
priority: high
type: task
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
235 draws recentes custaram 5,16h de parede e ~91k tokens cada (14k input + 76k cache read + 1,6k output, 7 steps de mediana). As repetições rodam em série mesmo quando só um caso é selecionado, a parada é sempre a cheia e o controle (37% dos draws, independente da skill) é re-rodado por hábito. Simulação de parada em 5 passes/3 falhas sobre as sequências gravadas: -26% já em n=12. Além disso, 8 timeouts de 600s custaram 80min de parede.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Repetições rodam em paralelo até --concurrency, com um transcript por draw e o mesmo formato de result.json; tempo de parede medido antes/depois num caso de 12 draws.
- [ ] #2 --stop <passes>/<fails> com default 5/3 quando repeat > 5; result.json grava stoppedEarly e a sequência observada.
- [ ] #3 result.json grava fixtureHash, promptHash e detectorVersion; CONTRIBUTING permite citar controle de onda anterior só quando os três batem.
- [ ] #4 Watchdog mata draw sem evento novo por --stall-seconds (default 120) e registra 'stalled', distinto de timeout.
- [ ] #5 Timeout/stall viram unscored de infraestrutura, com no máximo um retry, e nunca contam como passe nem como falha comportamental.
- [ ] #6 Concorrência 6 e 8 medidas; default sobe só se não houver 429.
- [ ] #7 Nenhuma linha assert: ou gate alterada; lint e selftest verdes; nenhuma eval comportamental no CI.
<!-- AC:END -->
