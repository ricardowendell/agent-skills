---
id: TASK-64
title: >-
  [Bootstrap][TS] Revisar stack padrão TypeScript/Node: performance, qualidade,
  segurança e determinismo
status: Done
assignee: []
created_date: '2026-11-08T09:56:00Z'
updated_date: '2026-11-10T15:07:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/agent-skills/issues/12
priority: medium
type: task
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #12 (2026-11-08). Revisar a stack TS/Node padrao do bootstrap-project-harness como um sistema coerente: runtime/package manager, compilador/modulos, lint+formatter, testes, build/monorepo, supply chain/CI, gates de desempenho e compatibilidade additive-only. Nao e troca por modismo: a decisao precisa de matriz reproduzivel e deve preservar ou substituir explicitamente os limites atuais. Escopo largo: o groom deve dividir em specs (matriz/ADR; deteccao e defaults na SKILL; templates; harness-state; evals/docs) em vez de um unico dispatch. Fora de escopo: migracao forcada, adicionar ferramentas de todo o catalogo, reescrever o runtime das skills, remover gates para ganhar tempo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR/matriz com escolha fundamentada, trade-offs e numeros reproduziveis (nao claims de vendor)
- [ ] #2 Stack default com instalacao reproduzivel e scripts funcionais de lint, format-check, typecheck, testes, docs-check e build quando aplicavel
- [ ] #3 Quality gates conservam ou substituem com equivalencia justificada os limites atuais, sem perda silenciosa
- [ ] #4 Vulnerabilidade real falha em CI; indisponibilidade de rede tem resultado explicito e politica fail-open/fail-closed documentada por gate
- [ ] #5 Pre-commit rapido e offline; pre-push/PR adequados; release/nightly pesado quando justificado
- [ ] #6 Nenhum latest nao intencional: versoes e Actions com pin/upgrade; lockfile e instalacao congelada testados
- [ ] #7 Bun, pnpm/Node e stack preexistente preservados (additive-only); conflito gera diagnostico
- [ ] #8 harness-state reporta complete corretamente para stacks/perfis suportados, inclusive antes de instalar dependencias
- [ ] #9 Evals, testes unitarios e smoke passam; bootstrap Python, sensores de docs e roteamento intactos
- [ ] #10 Documentacao explica o default enxuto versus ferramentas opcionais, inclusive quando nao adotar dependencias
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T10:01:49.771Z

---

Umbrella da issue #12. As fatias sao TASK-65..69, cada uma com spec em docs/specs/active/SPEC-0041..0045 (todas paused; SPEC-0041 e o gate). O pdlc lista TASK-64 em needs_groom porque o umbrella nao tem spec propria, o que e esperado; fecha quando as cinco fatias fecharem. Ordem proposta no docs/roadmap.md.

---

created: 2026-11-10T15:07:12.561Z

---

Umbrella fechada: SPEC-0041-0045 implemented e mergeadas (cd1fb1d), publicadas em 0.6.3. A AC comportamental foi fechada por SPEC-0047/0050 (bootstrap #19 separator 5/5 vs 0/4). Residuais: TASK-87 (#20/#15 assercoes over-strict) e TASK-77 (eval store, Done). O comentario anterior que dizia 0041-0045 'todas paused' e historia.

---
<!-- COMMENTS:END -->
