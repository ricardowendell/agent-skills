---
id: TASK-42
title: 'harness: o parity check nomeia o interpretador que falta'
status: To Do
assignee: []
created_date: '2026-11-06T16:37:00Z'
labels: []
dependencies: []
references:
  - skills/bootstrap-project-harness/templates/python/docs_check.py
priority: medium
type: task
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Num PATH sem python3, check-sensor-parity.mjs sai 1 com 'FAIL clean / py exit=null / undefinedundefined' — indistinguivel de uma regressao real entre o sensor JS e o Python. Foi assim que o hook custou dois commits: a mensagem nao dizia que faltava interpretador. Reproduz com: env -i PATH=$(dirname $(which node)) node scripts/check-sensor-parity.mjs. Resolver o interpretador por uma lista de candidatos (PDLC_PYTHON, python3, python, /opt/homebrew/bin/python3, /usr/bin/python3), provar que roda e imprimir comando + versao; quando nenhum existir, uma linha clara em vez de um FAIL falso. Gate continua fechado por padrao; PDLC_ALLOW_MISSING_PYTHON=1 rebaixa para um skip nomeado.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sem interpretador no PATH, o check sai 1 com uma linha que nomeia a dependencia e os candidatos tentados; nenhum 'undefined' no stdout.
- [ ] #2 Com interpretador, a saida nomeia comando e versao e o veredito nao muda (2/2 fixtures, exit 0).
- [ ] #3 Candidato que existe mas falha e pulado com o stderr dele, nao contado como divergencia de paridade.
- [ ] #4 PDLC_ALLOW_MISSING_PYTHON=1 imprime skip nomeado e sai 0; o default continua fechado.
- [ ] #5 Testes unitarios cobrem: nenhum candidato, primeiro funciona, shim quebrado pulado, mensagem do CLI com PATH limpo; rodam no glob scripts/lib/evals/*.test.mjs.
<!-- AC:END -->
