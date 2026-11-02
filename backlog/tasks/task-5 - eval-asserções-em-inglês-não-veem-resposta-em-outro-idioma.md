---
id: TASK-5
title: 'eval: asserções em inglês não veem resposta em outro idioma'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
updated_date: '2026-11-02T12:42:00Z'
labels: []
dependencies: []
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No braço de controle de review-code #3 uma repetição respondeu "### Veredicto: **Request changes**" e passou: a asserção procura o token em inglês. O agente responde em pt-BR às vezes mesmo com prompt em inglês, então toda assertiva de texto negativo (noreply, verdict, reply) pode falhar em silêncio do mesmo jeito. Antes de acrescentar idioma na regex de um caso, decidir no nível do harness: fixar o idioma da resposta ou tornar as asserções agnósticas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 decisão registrada (fixar idioma vs asserção agnóstica), com o trade-off
- [ ] #2 pelo menos um caso demonstra a escolha: reprova quem responde no outro idioma quando o token é obrigatório
- [ ] #3 limite documentado no README, se ficar como está
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T12:42:00Z

---

Groomed into docs/specs/SPEC-0002-language-of-text-assertions.md (status: draft, blocked on one decision: assertions agnósticas vs registrar a limitação). Medição antes de escrever: 5 de 392 transcrições do runner têm marcador em português, e só uma é resposta de fato; o caso que abriu a task veio de uma execução do Promptfoo, que não deixa transcrição no corpus.

---
<!-- COMMENTS:END -->
