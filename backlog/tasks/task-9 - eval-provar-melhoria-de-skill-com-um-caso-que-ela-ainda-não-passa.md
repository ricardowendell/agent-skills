---
id: TASK-9
title: 'eval: provar melhoria de skill com um caso que ela ainda não passa'
status: To Do
assignee: []
created_date: '2026-11-02T18:30:00Z'
updated_date: '2026-11-02T18:30:00Z'
labels: []
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O marco do harness é melhoria mensurável de skill, e ele ainda não foi cumprido: o runner mede comportamento, mas nenhuma mudança de skill foi demonstrada com número. O trabalho até aqui foi infraestrutura.

Levantamento do que existe medido, em 2026-11-02: 44 resultados por caso no braço with-skill, 9 reprovados, todos eles bootstrap-project-harness #14. As nove reprovações são anteriores a 3098a5e (12:23), que corrigiu a asserção de fraseado do caso — o regex não aceitava `state: complete`, a própria linha do script, e contava três paradas corretas como falha. Depois desse commit o corpus está verde no braço with-skill.

Consequência para o método: não se prova melhoria sem um caso que a skill reprove. A task começa por encontrar ou criar esse caso, provar que a falha é da skill e não do fixture nem do vocabulário da asserção, e só então mexer no texto da skill. Alvos com histórico: bootstrap-project-harness (15 casos, o mais medido) e review-code (6 casos, quase todos decididos por veredito).

Custo: uma medição de comportamento é um run de agente por caso por repetição. Antes de começar, declarar quantos runs o plano consome.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 linha de base do alvo registrada por caso (não agregada), com modelo, nível e repetições
- [ ] #2 um caso reprovado de forma reproduzível pela skill atual, com falha observável em arquivo/estado e prova de que o fixture não é a causa
- [ ] #3 uma edição única no SKILL.md ou numa referência, em commit separado do caso
- [ ] #4 re-medição com o mesmo modelo, nível e repetições, com antes/depois por caso no comentário
- [ ] #5 melhoria descartada se a edição só fizer a asserção passar: a skill tem de pedir o comportamento, não o texto
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:30:00Z

---

Aberto depois de fechar a TASK-8, porque o backlog ficou sem nenhuma task que produzisse o resultado do marco. A ordem importa: caso que falha primeiro, edição depois. Inverter produz uma edição que "passa" porque a asserção foi afrouxada até aceitar o texto que a skill já produzia — que é o erro que a TASK-9 existe para não repetir.
<!-- COMMENTS:END -->
