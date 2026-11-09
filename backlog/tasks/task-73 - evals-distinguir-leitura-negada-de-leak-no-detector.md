---
id: TASK-73
title: 'evals: distinguir leitura negada de leak no detector'
status: Done
assignee: []
created_date: '2026-11-09T12:26:00Z'
updated_date: '2026-11-09T13:56:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Descoberto no F0.1 da SPEC-0047 (2026-11-09): o boundary seatbelt da SPEC-0046 funciona (ls devolve Operation not permitted), mas o detector classifica o caminho presente no input da ferramenta como leak mesmo quando o SO negou a leitura. Resultado: um controle que sonda o corpus instalado nunca fica limpo, isolated=no e estrutural, e a onda da 0047 parou em 1 de 5 celulas com 40 draws nao gastos. O parser ja expoe output/exit/status por chamada (events.mjs:60), entao a classificacao por caminho e possivel sem tocar o boundary. Custo: zero draw pago; o replay re-julga os runs existentes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Uma leitura negada por permissao vira 'denied', nao leak/host, e um draw so com tentativas negadas e limpo
- [x] #2 Uma leitura que teve sucesso continua leak/host; numa chamada mista, o caminho lido com sucesso continua leak
- [x] #3 O resumo conta 'denied' e o check-eval-run imprime, sem virar finding nem forcar isolated=no
- [x] #4 O replay dos runs do F0.1 da SPEC-0047 reclassifica r3-r5 como negados e mantem a arm com skill em isolated=yes
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T13:56:13.731Z

---

Fechada em 2026-11-09 pelo merge da SPEC-0048 (9dea764). Detector v3 d8478beab04a4e3e: uma negacao de permissao vira 'denied', por caminho e por chamada; 'denied' nao contamina, aparece como deniedDraws no resumo e no CLI; DETECTOR_VERSION subiu e o check-evidence passou a aceitar citacao v2 por capacidade (host-reads) sem reescrever 21 linhas publicadas. Prova por replay, sem draw pago: controle 07-52-50 passou de skillLeaks=3/contaminated=3/isolated=no para clean 5/5 isolated=yes deniedDraws=3; with-skill 07-37-44 segue isolated=yes. Duas rodadas de review; o P0 inicial (leitura shell bem-sucedida virando denied por causa de outra chamada) foi reproduzido e corrigido com teste para cada caso (sucesso+negado, cat A B, pai/filho). verify verde (a primeira tentativa pegou um flake de fork no fixture.test.mjs; 410/410 em duas rodadas completas).

---
<!-- COMMENTS:END -->
