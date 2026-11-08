---
id: TASK-10
title: 'implement-from-prompt: medir por que a skill não carrega em parte dos runs'
status: Done
assignee: []
created_date: '2026-11-02T20:10:00Z'
updated_date: '2026-11-02T18:20:00Z'
labels: []
dependencies: []
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A skill não carrega em parte das execuções de `implement-from-prompt`, e um run sem skill é indistinguível de "a skill não ajudou" no agregado. Se a taxa for grande, todo número de melhoria fica contaminado por ela.

Medição de 2026-11-02, 64 repetições em casos que deveriam carregar a skill:

| caso | repetições | sem carregar |
| --- | --- | --- |
| #1 | 12 | 4 |
| #5 (trigger) | 4 | 2 |
| #7 | 12 | 4 |
| #8 | 36 | 5 |
| **total** | **64** | **15 (23%)** |

O caso #6, que deveria **não** carregar, carregou em 1 de 4.

A hipótese inicial de que o problema era específico do #8 não se sustentou: era 3/8 contra 0/22, mas com amostra maior os misses aparecem em todos os casos (Fisher, #8 contra o resto, p = 0,11). O `0/22` era ruído de n pequeno.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 taxa de carregamento medida por caso (#1, #5, #6, #7, #8) com repetições suficientes para não ser ruído
- [x] #2 causa identificada com evidência de transcript, ou registrada como variância se a taxa não se reproduzir
- [x] #3 uma mudança só (descrição, caso, ou nenhuma), medida antes/depois nos mesmos casos
- [x] #4 gate de skill preservado: nenhum caso passa a aceitar run sem skill
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T20:10:00Z

---

Aberto ao fechar a TASK-9, que entregou a primeira melhoria medida e encontrou isto no caminho.

---

Resultado, 2026-11-02. A taxa é **~23%** e não é do caso #8: aparece em #1 (4/12), #5 (2/4), #7 (4/12) e #8 (5/36). A leitura anterior, "3 de 8 no #8 contra 0 de 22 nos outros", era coincidência de amostra.

Causa, com evidência: em **nenhum** dos misses houve chamada ao `skill`. Não é falha de carregamento nem do gate — é o run inteiro seguindo sem chamar. Dois testes descartam que a ferramenta esteja indisponível:

- pedido explícito para carregar a skill, com ela staged: **6/6** carregaram;
- perguntar quais skills existem: **10/10** listaram a skill.

Então: decisão do modelo, não disponibilidade. AC-3 fecha em **nenhuma mudança de descrição ou de caso** — o gatilho léxico é exato (`Implement docs/prompts/...`) e mesmo assim falha, o que descrição nenhuma conserta.

AC-4 mantido: o gate segue estrito. Nenhum caso passou a aceitar run sem skill.

O que fica aberto, e virou **TASK-11**: os runs de eval não são isolados das skills globais. Num scratch vazio, sem nada staged, o agente lista **22 skills** (3/3 execuções), incluindo `implement-from-prompt`. Isso é candidato a causa da diluição de atenção, e é a próxima medição — não foi consertado aqui porque mudar o ambiente muda o que se mede.
<!-- COMMENTS:END -->
