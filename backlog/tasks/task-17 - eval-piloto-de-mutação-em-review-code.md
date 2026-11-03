---
id: TASK-17
title: 'eval: piloto de mutação em review-code para medir se o corpus detecta skill quebrada'
status: To Do
assignee: []
created_date: '2026-11-03T10:38:00Z'
updated_date: '2026-11-03T10:52:00Z'
labels: []
dependencies: []
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: `docs/inbox/2026-11-03-guia-pratico-tecnicas-agent-skills.md`, §3 (P0). Registro exploratório — a técnica tem evidência externa, não neste repo.

A pergunta que nenhuma medição atual responde: se uma regra importante de uma skill for removida, algum caso do corpus falha? A matriz prova que a skill separa do controle, não que o corpus protege contra regressão na skill.

Baseline válido já existe: `docs/evals/review-code-matrix.md` remedido com home isolado em 2026-11-03, e o caso #3 corrigido (TASK-16). Antes disso o piloto mediria o defeito que acabamos de consertar.

Mutações propostas, uma por candidata:

| mutação | fixture discriminante | defeito esperado |
| --- | --- | --- |
| permitir aprovação sem rodar os gates | diff correto com teste executável | aprovar sem evidência de execução |
| ignorar divergência de `spec_sha` | prompt carimbado antes de a spec mudar | revisar como se o contrato fosse atual |
| decidir sem declaração do usuário | branch sem spec e sem fallback autorizado | emitir veredito em vez de reter |

Variantes sem flag nova no runner: dois roots com o mesmo corpus e a mesma fixture, `--root` apontando para cada um. Convenção de caminho do repo, não a do documento de origem:

```
docs/evals/experiments/mutation/review-code/baseline/skills/
docs/evals/experiments/mutation/review-code/no-gate/skills/
```

Remover a regra **e** as instruções que a repetem em outro ponto, senão o resto da skill compensa a mutação. Confirmar que a candidata carrega (YAML válido, proveniência ok): falha de carregamento é falha do experimento, não detecção.

Classificar cada mutação como **detectada**, **sobrevivente** ou **inválida**. Para sobrevivente, registrar se o defeito apareceu e não foi pego, ou se o agente não manifestou o defeito — as duas coisas pedem ações diferentes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 baseline reproduzido antes de qualquer mutação (com skill, 5/5 no caso escolhido)
- [ ] #2 três mutações executadas em roots separados, sem flag nova no runner
- [ ] #3 cada mutação classificada como detectada, sobrevivente ou inválida, com o trace inspecionado
- [ ] #4 sobreviventes distinguem "defeito não detectado" de "defeito não manifestado", com a evidência de cada um
- [ ] #5 se um sobrevivente revelar lacuna real, o caso novo entra primeiro e a mutação é remedida
- [ ] #6 resultado registrado com sha do repo, hash da skill e custo em execuções
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T10:38:00Z

---

Aberto a partir do processamento do inbox. Prioridade P0 do documento de origem, e a única das quatro que protege os números que já temos em vez de propor trabalho novo.

Pergunta aberta do documento que não foi resolvida: o piloto pede 6–10 casos e 3 repetições por braço; aqui a proposta é 3 mutações em 1–2 casos, que é o suficiente para decidir se vale continuar.
---

Groomed em 2026-11-03 para `docs/specs/SPEC-0006-mutation-pilot-review-code.md` (`status: ready`).

Duas decisões tomadas no grooming, registradas na spec em vez de virarem pergunta:

- cada mutação tem um caso discriminante próprio (#1 para gate, #4 para `spec_sha`, #3 para decisão sem declaração), em vez de "1–2 casos" genéricos — a matriz já cobre os três com skill;
- o caminho segue a convenção do repo (`docs/evals/experiments/mutation/review-code/<variante>/skills/`), não `experiments/` da raiz.

O que ficou como Incógnita na spec: três repetições é amostra pequena, então a classificação usa o trace, e uma mutação que não manifesta o defeito não conta como detectada.
---

Resultado da SPEC-0006 em 2026-11-03, sha `a248f6c`, 8 execuções:

- baseline do caso #1: 5/5;
- controle `no-gates`: 3/3, **não detectado**;
- classificação: **inválido**, não sobrevivente.

O trace mostra `npm test` executado nas três repetições. A regra do gate nunca saiu do texto: continua no passo 1 ("resolve … the gate commands"), no bloco de saída (`GATES: …`), no `AGENTS.md` do fixture ("Gates: `npm test`") e no prompt de implementação ("`npm test` must pass"). Uma mutação só da skill não alcança os dois últimos, então `ranpass` não pode ser atribuído à regra removida. O método não falhou; o controle não isola o que diz medir.

O escopo de três mutações foi reduzido pela spec depois que o mapa mostrou que nenhuma regra sem asserção é manifestável com os fixtures atuais. A pergunta original segue aberta: um controle limpo precisa de uma regra que o fixture não repita — `ignore-spec-sha` no caso #4 é o candidato. A lacuna de fixture do gate vermelho ficou na TASK-21, com a condição de não repetir o comando no fixture.
<!-- COMMENTS:END -->
