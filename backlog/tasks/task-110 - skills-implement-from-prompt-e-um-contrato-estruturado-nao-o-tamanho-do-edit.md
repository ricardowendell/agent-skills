---
id: TASK-110
title: 'skills: implement-from-prompt e um contrato estruturado, nao o tamanho do edit'
status: To Do
assignee: []
created_date: '2026-11-11T20:43:00Z'
labels: []
dependencies: []
documentation:
  - skills/implement-from-prompt/SKILL.md
  - docs/evals/iterative-corpus.md
  - docs/specs/SPEC-0069-does-the-description-actually-route.md
priority: high
type: task
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: reavaliacao de 2026-11-11 (0.7.6). O corpus iterativo mostra #12 separando (4/5 vs 0/5), #9 nao separando (4/5 vs 5/5), #10 unresolved por gate-miss de roteamento e #11 non-discriminator (1/5 carregado, 5/5 nas assercoes nos dois bracos). A SPEC-0069 ja testou e reverteu a hipotese de descricao no pior caso (0/3 carregado, US$ 0,018932). Decidir o posicionamento: a skill e acionada por um contrato de implementacao estruturado (prompt de implementacao / SPEC prompt); uma tarefa pequena e totalmente especificada fica fora do alvo por desenho, porque nao ha ganho demonstrado e o acionamento forçado custa tokens e processo; um pedido ambiguo sem contrato continua disparando a pergunta antes de editar (#12). Entregar: descricao com a fronteira, matriz com a posicao de alvo por caso, e um smoke de roteamento de 3 draws no caso #12 com stop rule.
<!-- SECTION:DESCRIPTION:END -->
