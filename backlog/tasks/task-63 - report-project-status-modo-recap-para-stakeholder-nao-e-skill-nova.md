---
id: TASK-63
title: 'report-project-status: modo recap para stakeholder (nao e skill nova)'
status: To Do
assignee: []
created_date: '2026-11-08T01:56:00Z'
labels: []
dependencies: []
references:
  - docs/analysis/skills-from-sessions-2026-11-07.md
priority: medium
type: task
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: a proposta delivery-recap. O cluster de demanda (report-project-status: 15 sessoes, $20,26) ja e servido pela skill entregue em 2026-11-08; o valor incremental e a audiencia — operador vs stakeholder. Por isso vira modo de saida, nao skill nova: uma segunda skill no mesmo espaco de gatilho criaria a mesma colisao que acabamos de corrigir entre survey e report. Fonte de evidencia: .pdlc/runs.json, run dirs e CHANGELOG. 'Forge' nao existe neste repo (so aparece como hipotese numa nota de inbox de 2026-11-03), entao nao entra como fonte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O recap responde quatro perguntas: o que mudou, o que foi testado, o que ficou pendente, qual o proximo passo util.
- [ ] #2 Cita a evidencia (run dir, commit, entrada de CHANGELOG) e nunca recalcula um numero publicado; se resumir, aponta a fonte.
- [ ] #3 Distingue medido de nao medido: 0/5 nao vira 'houve dificuldade'.
- [ ] #4 Nao cria skill nem espaco de gatilho novo; e um modo do report-project-status.
- [ ] #5 Sem fonte de evidencia disponivel, declara o limite em vez de preencher com narrativa.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T09:29:32.448Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0040-report-project-status-recap.md (status: ready). Modo recap do report-project-status, nao skill nova; ainda read-only. Tambem corrige a linha ausente do report-project-status na tabela de skills do README.

---

created: 2026-11-08T09:30:12.479Z

---

Status corrigido: paused, nao ready. Dois motivos independentes: (1) o roadmap re-decide prioridades no commit que registra os Results da SPEC-0034; (2) o pdlc groom rejeita a colisao em docs/evals/coverage.md entre specs sem dependencia declarada. A spec flipa para ready nesse commit, nao antes.

---
<!-- COMMENTS:END -->
