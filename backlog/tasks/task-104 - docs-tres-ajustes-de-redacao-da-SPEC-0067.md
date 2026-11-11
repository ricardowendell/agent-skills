---
id: TASK-104
title: 'docs: tres ajustes de redacao da SPEC-0067'
status: Done
assignee: []
created_date: '2026-11-11T13:05:00Z'
updated_date: '2026-11-11T16:18:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
  - docs/evals/iterative-corpus.md
  - scripts/lib/evals/isolation.mjs
priority: low
type: task
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: review da SPEC-0067 (aprovada). (1) coverage.md:63-65 poe o parentetico de proveniencia (cf2e2e31, 8aab5bd) onde ele le como evidencia do mecanismo; ele prova so a reexecucao — atribuir o seatbelt a invocacao. (2) iterative-corpus.md:217 cita a linha do warn com a celula abreviada como #12 quando o comando imprime implement-from-prompt#12. (3) isolation.mjs:197-202 comenta um parentetico (built before the enforcement probe) que nenhum caller consegue produzir. Zero draws, zero mudanca de veredito.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T14:46:35.422Z

---

Adicionados ao escopo desta task dois nits do review da SPEC-0070: (a) iterative-corpus.md:205 — o #12 r2 perguntou via tool question, cancelada no harness nao interativo, e e o unico vermelho armazenado; a frase 'all five asked' agrega demais. (b) iterative-corpus.md:213 — a condicao de reabertura esta mais larga que o achado: um draw com a forma do #12 para legitimamente num pedido solto. Mais o quote truncado do #10 r4 (:196) e a mesma agregacao na spec (:174).

---

created: 2026-11-11T16:19:06.696Z

---

Done via SPEC-0072 (merge em main). Sete frases corrigidas contra o artefato: seatbelt atribuido a invocacao (build 8aab5bd, detector cf2e2e31) e o draw reexecutado declarado sem registro de mecanismo; quote do check-eval-run com o label real; parentetico impossivel removido do comentario (codigo intocado); #12 agora diz que os cinco perguntaram pela tool cancelada e quatro reescreveram no texto, r2 e o unico vermelho; condicao de reabertura estreitada; quote do #10 r4 completa. Zero numero, classe ou hash mudou. Zero draws.

---
<!-- COMMENTS:END -->
