---
id: TASK-37
title: 'harness: gastar menos draws e menos tempo para a mesma evidência'
status: Done
assignee: []
created_date: '2026-11-06T12:46:00Z'
updated_date: '2026-11-06T13:33:00Z'
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
- [x] #1 Repetições rodam em paralelo até --concurrency, com um transcript por draw e o mesmo formato de result.json; tempo de parede medido antes/depois num caso de 12 draws.
- [x] #2 --stop <passes>/<fails> com default 5/3 quando repeat > 5; result.json grava stoppedEarly e a sequência observada.
- [x] #3 result.json grava fixtureHash, promptHash e detectorVersion; CONTRIBUTING permite citar controle de onda anterior só quando os três batem.
- [x] #4 Watchdog mata draw sem evento novo por --stall-seconds (default 120) e registra 'stalled', distinto de timeout.
- [x] #5 Timeout/stall viram unscored de infraestrutura, com no máximo um retry, e nunca contam como passe nem como falha comportamental.
- [x] #6 Concorrência 6 e 8 medidas; default sobe só se não houver 429.
- [x] #7 Nenhuma linha assert: ou gate alterada; lint e selftest verdes; nenhuma eval comportamental no CI.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T13:33:00Z

---

Fechada pela SPEC-0020 (merge em 701657d). AC-1: 12 draws com --concurrency 4 em 176.6s de parede contra 691s de soma das duracoes (~3.9x); veredito 12/12 igual ao guardado (que esta em outro skillHash, usado so como sanidade). AC-2: default 5/3 parou em 8/8 com stoppedEarly e sequence; --stop 12/0 desliga. AC-3: fixtureHash/promptHash/detectorVersion no artefato; regra de reuso no CONTRIBUTING. AC-4: watchdog de 120s produz stalled, distinto de timeout, com teste de stream vivo. AC-5: timeout/stall viram unscored de infraestrutura com 1 retry em scratch novo; runcheck classifica infrastructure (os dois dirs antigos de timeout agora saem exit 1). AC-6: concorrencia 6 e 8 medidas (11 casos, 181.3s e 176.6s), zero 429, default fica 4. AC-7: nenhum assert:/gate alterado, 215 testes, gates verdes. Custo: 42 draws medidos (8+12+11+11).

---
<!-- COMMENTS:END -->
