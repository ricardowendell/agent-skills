---
id: TASK-31
title: 'eval: medir write-implementation-prompt'
status: Done
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-06T19:30:00Z'
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
- [x] #1 Os 6 casos ficam rodaveis ou manual com motivo escrito.
- [x] #2 5 draws por braco nos casos comportamentais, com run dir citado.
- [x] #3 Classificacao por caso: separador, nao-discriminador ou quebrado, com a assercao ou gate que falhou em cada celula vermelha.
- [x] #4 coverage.md e a matriz de evidencia atualizados com os run dirs.
- [x] #5 Nenhum caso passa a aceitar run sem skill.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T19:30:00Z

---

Fechada pela SPEC-0025 (merge ac38cdb). AC-1: #3 ficou manual com why: nomeando nodir docs/prompts; os outros 5 rodam. AC-2: 5 draws por braco por caso comportamental; o controle de #1 teve 4 tentativas de 5 draws, nenhuma com 5 draws limpos. AC-3: #2 separator 5/5 vs 0/5 limpo, #4 non-discriminator 5/5 vs 5/5, #3 manual, #1 unresolved (rotulo que a spec passou a permitir depois do review) com as assercoes vermelhas nomeadas. AC-4: matriz publicada e linha do coverage.md com os run dirs. AC-5: nenhuma assercao enfraquecida; o diff em skills/ e so o prompt:/why: do caso 3. Achados abertos, nao consertados aqui: TASK-43 (detector de leak cego a docs/ e AGENTS.md do host) e os triggers sem fixture do SPEC-0012.

---
<!-- COMMENTS:END -->
