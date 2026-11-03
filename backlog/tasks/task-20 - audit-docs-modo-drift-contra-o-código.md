---
id: TASK-20
title: 'audit-docs: modo drift contra o código, sem expandir escopo'
status: To Do
assignee: []
created_date: '2026-11-03T10:38:00Z'
updated_date: '2026-11-03T10:38:00Z'
labels: []
dependencies: []
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: `docs/inbox/2026-11-03-egm-para-agent-skills.md`. Registro exploratório.

O `audit-docs` hoje confere consistência **entre documentos**. O que falta é conferir afirmação de documento contra código e testes: funcionalidade descrita mas ausente, campo ou contrato divergente, atalho que altera o comportamento prometido.

Duas regras que o documento impõe e que evitam o pior modo de falha:

1. **Filtrar por status e intenção.** Proposta ainda não implementada não é drift. Classificar cada divergência como defeito, evolução intencional ou documentação desatualizada.
2. **Ler e propor, não corrigir.** O modo drift não altera arquivos e não vira expansão de escopo.

O repo já tem sensores que fazem parte disso (`spec-sha`, `check-sensor-parity`); a ideia é reaproveitar, não duplicar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 modo novo exercitado em documento com afirmação verdadeira, falsa e intencionalmente futura
- [ ] #2 cada divergência classificada em defeito, evolução intencional ou doc desatualizado
- [ ] #3 documento de spec não implementada não gera drift
- [ ] #4 nenhum arquivo alterado pelo modo (leitura e proposta apenas)
- [ ] #5 reaproveita sensor existente, sem dependência de runtime nova
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T10:38:00Z

---

Aberto a partir do processamento do inbox. É o mais barato dos quatro em risco (não toca em medição de skill) e o mais fácil de inflar — daí os ACs de escopo e de filtro por status.
<!-- COMMENTS:END -->
