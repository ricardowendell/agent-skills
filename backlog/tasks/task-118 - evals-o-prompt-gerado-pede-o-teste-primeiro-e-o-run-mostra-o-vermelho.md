---
id: TASK-118
title: 'evals: o prompt gerado pede o teste primeiro e o run mostra o vermelho'
status: To Do
assignee: []
created_date: '2026-11-14T12:11:00Z'
labels:
  - evals
dependencies: []
priority: high
type: task
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: recon de 2026-11-14 sobre 307 draws pagos de implement-from-prompt (celulas 1, 4, 8; dois bracos; 2026-11-02 a 11-07): teste escrito antes da implementacao em 43/307 (14%), teste vermelho antes da implementacao em 0/307, e na celula 8 (prompt sem mencao a teste) a skill escreve teste em 3/120 (2%). A causa esta no gerador: write-implementation-prompt SKILL.md:73 ordena as Operations com testes em penultimo lugar. A SPEC-0090 move a ordem default para test-first, adiciona o passo do vermelho, fortalece o caso 1, cria um caso consumidor com artifact na nova forma e mede a assinatura red->green com um leitor reproduzivel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A ordem default do gerador e test-first e nomeia o run vermelho.
- [ ] #2 O caso 1 prova a forma e a assinatura e medida nos draws.
- [ ] #3 Nenhuma edicao no executor; se o vermelho nao aparecer, vira follow-up.
<!-- AC:END -->
