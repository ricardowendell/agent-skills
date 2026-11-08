---
id: TASK-49
title: 'harness: checagens determinísticas de publicação'
status: Done
assignee: []
created_date: '2026-11-07T00:04:00Z'
updated_date: '2026-11-07T00:56:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Duas classes de erro consumiram rodadas de review na 0.5.0/0.6.0 e são mecânicas: (a) a spec declara files: que não bate com o diff, task que não resolve, depends_on assimétrico, placeholder esquecido; (b) um documento cita run dir inexistente, inacabado, ou cita como limpo um run que o check-eval-run reprova. Três das quatro rodadas da SPEC-0028 foram exatamente (a) e (b). Implementar dois CLIs sem modelo: spec-check (estático + --base/--spec para o diff) e check-evidence (docs/evals contra o store). Rodar no selftest. O ganho é cortar o custo de review de todas as ondas seguintes e impedir que número podre chegue ao main.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 spec-check falha quando files: != git diff --base...HEAD, quando task: não resolve em backlog/tasks, quando depends_on/blocks não são simétricos ou apontam para slug inexistente, e quando uma spec implemented ainda tem placeholder.
- [x] #2 check-evidence falha quando um run dir citado não existe, não está completed, ou é dirty sob o detector corrente e a linha não o marca (dirty/leak/host/stall/history/discard).
- [x] #3 Os dois rodam sem modelo, no selftest, e o corpus atual passa depois das correções que a própria spec fizer.
- [x] #4 Testes com fixtures sintéticas cobrem cada regra e o caso limpo; nada de falso positivo no corpus real.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T00:56:00Z

---

Fechada pela SPEC-0032 (merge). AC-1: spec-check recusa files != diff (touched-undeclared erro, declared-untouched warning), task pendurada, depends_on dangling (assimetria e warning) e placeholder em implemented. AC-2: check-evidence recusa run dir inexistente, run inacabado citado como completo, v1 alegando isolated=yes, e avisa (ou falha com --strict) quando cita run dirty sem marcador. AC-3: os dois rodam sem modelo, em ~0.1s e ~1s. AC-4: check-evidence esta no selftest e no hook; spec-check no CI para specs alteradas; CONTRIBUTING documenta. AC-5: corpus reparado em marcadores e 2 citacoes, nenhum numero reescrito. NOTA: o check foi construido e usado dentro da propria spec; as 5 rodadas de review custaram mais que o codigo, e o proximo passo (0031) roda sob ele.

---
<!-- COMMENTS:END -->
