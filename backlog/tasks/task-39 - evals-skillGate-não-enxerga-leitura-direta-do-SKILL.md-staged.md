---
id: TASK-39
title: 'evals: skillGate não enxerga leitura direta do SKILL.md staged'
status: To Do
assignee: []
created_date: '2026-11-06T14:07:00Z'
labels: []
dependencies: []
references:
  - docs/evals/implement-from-prompt-matrix.md
priority: medium
type: task
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0019, o #5 r9 leu o .opencode/skills/implement-from-prompt/SKILL.md staged diretamente e seguiu as regras, mas loaded ficou vazio e o assert: skill falhou. Para caso de trigger, falhar pode estar certo (o sinal é a chamada da tool); para caso comportamental, a leitura direta significa que a run usou a skill e o gate a reprovaria, subestimando a carga. Decidir com evidência o que conta como carga em cada braço.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decisao registrada por braco (comportamental vs trigger): leitura direta do SKILL.md staged conta como carga ou nao.
- [ ] #2 Se contar, skillGate grava a origem (tool vs read) e o gate aceita a leitura como carga.
- [ ] #3 Teste com transcript sintetico que le o caminho staged sem chamar a tool.
- [ ] #4 Nenhum caso passa a aceitar run sem uso nenhum da skill.
<!-- AC:END -->
