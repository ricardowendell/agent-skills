---
id: TASK-108
title: 'evals: o contrato de KINDS diz que virgula nao e fronteira de clausula'
status: Done
assignee: []
created_date: '2026-11-11T16:31:00Z'
updated_date: '2026-11-11T17:12:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/kinds.mjs
  - docs/specs/SPEC-0073-the-stance-is-the-last-clause.md
priority: low
type: task
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After SPEC-0073, `,` is a clause boundary for every blocker except `if`/`unless`/`whether`, which are read against the wider sentence. The comment at `kinds.mjs:99-101` still says the comma is not a clause boundary, and is now false for two of the three cases. The fix is a comment-only edit in the vocabulary contract; no form or blocker changes. Zero draws.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T17:13:23.794Z

---

Done via SPEC-0074. O contrato de KINDS agora diz que virgula encerra clausula, com if/unless/whether lidos na frase inteira, e que o stance e a ultima clausula que nomeia um. So comentario; codigo intocado; 565 testes iguais.

---
<!-- COMMENTS:END -->
