---
id: TASK-6
title: 'bootstrap-project-harness: medir o caminho harness completo -> parar'
status: Done
assignee: []
created_date: '2026-11-01T22:53:00Z'
updated_date: '2026-11-02T16:05:00Z'
labels: []
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O caso 7 de bootstrap-project-harness registra o bloqueio no topo de references/evals.md: o runner estagia árvore plana sem histórico, então a skill lê o repo como vazio e roda bootstrap completo em vez de parar quando o harness já existe. Duas limitações concretas: staging de histórico (parcialmente resolvido por git.json no stageFixture) e ausência de resposta para o passo de aprovação, que hoje faz qualquer caminho interativo virar manual.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 um caso usa git.json com commit base e chega ao ramo 'harness completo, parar'
- [x] #2 o passo de aprovação tem uma resposta estagiada, explícita no caso
- [x] #3 os casos manuais que viraram executáveis saem de status: manual
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Medição em 2026-11-02, três repetições: o agente leu o fixture como 'partial harness' e completou o que faltava, nos três runs. Motivo dado: eslint.config.js vazio, sem dependências instaladas, lefthook/justfile incompletos, docs faltando, typecheck falha. A tabela do SKILL.md define completo por existência de arquivos ('does lefthook.yml, .prettierrc, etc. exist'), mas o agente audita rodando os gates. Enquanto a definição for essa, um fixture sem toolchain instalada nunca parecerá completo — e instalar toolchain dentro do fixture não é aceitável. Próximo passo é decidir a definição (existência vs gates rodando) antes de construir o caso; o caso 14 foi revertido para não deixar vermelho medindo a coisa errada.

Rodada extra em 2026-11-02 com fixture auto-suficiente (configs reais, src + testes, just check e just smoke verdes sem instalar nada): parou em 1/3. Total medido: 5 de 12 execuções pararam. Os runs que não pararam compararam com os templates canônicos, chamaram arquivos enxutos de 'stubs' e regravaram — ou seja, o que resta é excesso do modelo, não fixture nem definição. Decisão: definição de completo agora é explícita (arquivos presentes + smoke), o template passa a trazer a receita smoke, e o caso 14 fica manual com a taxa medida.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T13:27:00Z

---

Estado em 2026-11-02: a definição de completo está decidida e implementada (arquivos presentes + just smoke; template traz a receita), e o caso 14 existe com fixture auto-suficiente. O que falta não é fixture nem redação: 5 de 12 execuções ainda seguem adiante comparando com os templates canônicos. O próximo passo é mecanismo, não texto — um script de estado no template que imprima complete|partial e um exit code, para o agente não precisar julgar. A task fica aberta aguardando essa decisão de design, não uma nova tentativa de wording.

---

created: 2026-11-02T14:49:00Z

---

Groomed em 2026-11-02: docs/specs/SPEC-0003-deterministic-harness-state.md (ready) e docs/prompts/SPEC-0003-deterministic-harness-state.prompt.md. A decisão de design está registrada: o estado passa a ser a saída de skills/bootstrap-project-harness/scripts/harness-state.mjs, rodado da própria skill e nunca instalado no repo alvo (senão um repo sem o script viraria 'partial'). AC-4 mede o efeito: caso 14 sai de manual com >=10/12 paradas.

---

created: 2026-11-02T15:05:00Z

---

Blind-spot review em 2026-11-02, sete decisões registradas na SPEC-0003: (1) caso 15 mede o erro oposto — quase completo não pode parar; (2) sem node no repo, fallback declarado para a tabela; (3) toolchain concorrente vira linha competing: e a skill reporta e para; (4) lista explícita com teste de paridade contra os templates; (5) 9/12 entrega o script com o caso manual e a AC-4 registrada como falha; (6) stack ambíguo é recusa com exit próprio, não um quinto estado; (7) smoke é just smoke quando existe, senão o check embutido — repo com just smoke quebrado nunca é completo.

---

created: 2026-11-02T15:23:00Z

---

Implementado em 2026-11-02 (SPEC-0003). Resultado medido: caso 14 passou de 5/12 para 12/12 paradas sem tocar arquivo; caso 15 (quase completo, sem lefthook.yml) 3/3 — nomeia o arquivo, cria, não mexe no resto. Ambos saíram de status: manual. A primeira pontuação do caso 14 leu 9/12 porque a regex da resposta não aceitava 'state: complete', a linha que o próprio script imprime; corrigida a asserção, os mesmos transcritos re-julgam 12/12. AC #2 (resposta estagiada para o passo de aprovação) fica aberto: o caminho 'completo' agora termina antes de qualquer pergunta, então ele só vale para o bootstrap de repo vazio, que é outro caso.

---

created: 2026-11-02T15:50:00Z

---

Groomed em 2026-11-02: docs/specs/SPEC-0005-approval-given-apply.md (ready). A AC #2 fala do 'passo de aprovação', que não existe no bootstrap — o único passo assim é o do tighten-harness (propõe, espera, e aprovação ausente não é aprovação). O bootstrap só tem a entrevista de produto, interativa por definição. Decisão registrada: a aprovação vai no próprio prompt ('I approve'), sem segundo turno no runner e sem mudança de formato. O caso novo #6 mede a metade que falta: com aprovação explícita, aplica o ratchet e não mexe no source; o caso 1 continua medindo a metade sem resposta. A TASK-6 só fecha quando o caso existir e a taxa estiver medida.

---

created: 2026-11-02T16:05:00Z

---

Implementado em 2026-11-02 (SPEC-0005). Caso 6 do tighten-harness, com fixture copiado do caso 1 e justfile sem dependências. Medido 3/3: cada run mediu o headroom, aplicou um único ratchet (max-lines 400 -> 200), deixou src/ intocado e nomeou o revert. O agente leu a aprovação explícita do prompt como aprovação mesmo em run não interativo, então a frase condicional do SKILL.md não foi necessária e o texto não mudou. Caso runnable; totais 64 casos, 59 executáveis, 5 manuais. O preâmbulo do evals.md que dizia que o caminho de aplicar era manual foi corrigido. AC #2 fechada: a resposta estagiada é o próprio prompt.

---
<!-- COMMENTS:END -->
