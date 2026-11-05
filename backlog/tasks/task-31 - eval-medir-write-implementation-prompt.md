---
id: TASK-31
title: 'eval: medir write-implementation-prompt'
status: To Do
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-05T20:55:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
  - skills/write-implementation-prompt/references/evals.md
priority: high
type: task
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
6 casos, 1 manual e nenhuma evidência publicada. É a etapa imediatamente anterior ao implement-from-prompt, que já tem matriz; sem ela o pipeline tem um buraco no meio. Medir os seis casos nos dois braços e publicar a classificação como foi feito em SPEC-0015 e SPEC-0016.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Os 6 casos ficam rodaveis ou manual com motivo escrito.
- [ ] #2 5 draws por braco nos casos comportamentais, com run dir citado.
- [ ] #3 Classificacao por caso: separador, nao-discriminador ou quebrado, com a assercao ou gate que falhou em cada celula vermelha.
- [ ] #4 coverage.md e a matriz de evidencia atualizados com os run dirs.
- [ ] #5 Nenhum caso passa a aceitar run sem skill.
<!-- AC:END -->
