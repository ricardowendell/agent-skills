---
id: TASK-76
title: 'evals: conteudo so conta para o caminho que ele nomeia'
status: Done
assignee: []
created_date: '2026-11-09T16:53:00Z'
updated_date: '2026-11-09T17:16:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Descoberto na SPEC-0050 (2026-11-09). A regra da SPEC-0049 diz que, sob enforcement, um hit do corpus e denied salvo se a chamada devolveu o conteudo DAQUELE caminho. A implementacao usa conteudo da chamada inteira, entao: capture-idea #1 r1 ficou leak porque a mesma chamada imprimiu conteudo de ~/.config/opencode/SKILL-SOURCES.md e um symlink, embora ls skills 2>/dev/null tenha voltado vazio; groom-backlog #2 r2 ficou leak porque cat .../skills/groom/SKILL.md devolveu 'No such file or directory' (o caminho nem existe). Os dois draws tem assercoes gravadas e passaram (4/4 e 1/1); reclassificados como limpos, capture-idea vira separador 5/5 vs 2/5 e groom-backlog vira nao-discriminador 5/5 vs 5/5. Zero draw pago: a prova e replay.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Conteudo de outro caminho na mesma chamada nao conta como conteudo do caminho do corpus
- [x] #2 Linha de erro (No such file or directory, EPERM) e listagem de symlink nao contam como conteudo
- [x] #3 Conteudo real nomeando o caminho, e resultado nao-shell com conteudo, continuam leak
- [x] #4 O replay dos dois controles da SPEC-0050 da 5/5 limpos e as duas celulas sao reclassificadas
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T17:16:43.790Z

---

Fechada em 2026-11-09 pelo merge da SPEC-0051 (b98dc19). Detector v5 def64b2d6a1baa6e. AC-1: conteudo de outro caminho na mesma chamada nao conta (o shape da capture-idea, com ls vazio + corpo de SKILL-SOURCES + linha de symlink, vira denied). AC-2: No such file or directory, EPERM/EACCES, Is a directory, Not a directory e linhas com ' -> ' nao contam (o shape da groom-backlog vira denied). AC-3: conteudo real continua leak, com o override de leitura direta preservado; o P0 do review (marcadores avaliados no output inteiro, mascarando corpos reais pela linha do zshenv) foi corrigido para avaliacao por linha, com testes enforced para os tres repros. AC-4: replay dos dois controles da 0050 da clean 5/5 isolated=yes; v4 readicionada ao mapa de capacidades para nao invalidar a onda. Correcao aritmetica: capture-idea r1 passou 3/4, entao o controle le 1/5, nao 2/5; o veredito continua separador.

---
<!-- COMMENTS:END -->
