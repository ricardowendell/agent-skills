---
id: TASK-42
title: 'harness: o parity check nomeia o interpretador que falta'
status: Done
assignee: []
created_date: '2026-11-06T16:37:00Z'
updated_date: '2026-11-06T19:30:00Z'
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
- [x] #1 Sem interpretador no PATH, o check sai 1 com uma linha que nomeia a dependencia e os candidatos tentados; nenhum 'undefined' no stdout.
- [x] #2 Com interpretador, a saida nomeia comando e versao e o veredito nao muda (2/2 fixtures, exit 0).
- [x] #3 Candidato que existe mas falha e pulado com o stderr dele, nao contado como divergencia de paridade.
- [x] #4 PDLC_ALLOW_MISSING_PYTHON=1 imprime skip nomeado e sai 0; o default continua fechado.
- [x] #5 Testes unitarios cobrem: nenhum candidato, primeiro funciona, shim quebrado pulado, mensagem do CLI com PATH limpo; rodam no glob scripts/lib/evals/*.test.mjs.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T19:30:00Z

---

Fechada pela SPEC-0027 (merge db7c49a). AC-1: o AC original dizia 'sem interpretador no PATH'; a revisao mostrou que a premissa estava errada e a spec passou a dizer 'nenhum candidato roda' — com PATH limpo sozinho o resolvedor acha /opt/homebrew/bin/python3 (exit 0), e o caminho fechado (todos missing/broken) sai 1 com uma linha e sem undefined. AC-2: imprime comando e versao, 2/2 exit 0, comparacao byte-exata intacta. AC-3: candidato quebrado e pulado com stderr e o proximo e tentado. AC-4: PDLC_ALLOW_MISSING_PYTHON=1 imprime skip nomeado e sai 0; default fechado. AC-5: 11 testes no glob, incluindo os quatro cenarios.

---
<!-- COMMENTS:END -->
