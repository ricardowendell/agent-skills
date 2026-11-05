---
id: TASK-19
title: 'groom-backlog: ablação de contexto para medir leitura seletiva'
status: Done
assignee: []
created_date: '2026-11-03T10:38:00Z'
updated_date: '2026-11-05T12:49:00Z'
labels: []
dependencies: []
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: `docs/inbox/2026-11-03-guia-pratico-tecnicas-agent-skills.md`, §5 (P1). Registro exploratório — proposta explícita de teste, não substituição aprovada.

Hipótese: ler um índice e as specs relacionadas preserva o resultado do `groom-backlog` com menos leitura do que a instrução atual de ler todas as specs. Pode falhar quando a relação importante não aparece no índice — e é esse o risco que o corpus precisa capturar.

Candidata a testar (texto do documento, não aprovado):

```
Antes de escrever:
1. Leia AGENTS.md e localize as fontes normativas.
2. Consulte o índice de specs e busque termos da funcionalidade.
3. Leia as specs, ADRs e jornadas relacionadas.
4. Expanda a busca se houver dependência, sobreposição ou conflito.
5. Mantenha a spec draft se uma lacuna bloqueante não puder ser resolvida.
```

Se não existir índice confiável, usar busca e links existentes antes de criar outra fonte de verdade.

Casos mínimos: item simples com documentação suficiente; spec relacionada que redefine um termo; conflito em spec cujo título não tem as palavras do item; repo com layout diferente do padrão.

Medição: variantes por `--root`, como no piloto de mutação (TASK-17). Registrar leituras observadas, tokens e resultado. **Arquivo disponibilizado não é arquivo lido** — a asserção tem de olhar o trace, não o staging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quatro casos mínimos existentes ou criados, e a variante roda nos mesmos dois roots
- [x] #2 leituras observadas no trace, não disponibilidade do arquivo
- [x] #3 nenhuma regressão crítica nos quatro casos
- [x] #4 redução de custo ou de ações em mais de um caso, com repetição antes de promover
- [x] #5 se a economia depender de deixar um conflito passar, a candidata é rejeitada
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T10:38:00Z

---

Aberto a partir do processamento do inbox. É a única das quatro que mexe em custo (tokens e ações), e não em cobertura — por isso depende de a TASK-17 provar que o corpus detecta regressão antes de reduzir contexto.

Pergunta aberta: este repo não tem índice de specs. A candidata começa com "consulte o índice" — sem esse artefato, o passo 2 vira busca textual, e o teste mede outra coisa. Decidir antes de começar.
Groomed into `docs/specs/SPEC-0013-context-ablation-groom-backlog.md` (draft). Dois roots congelados, 4 casos e leituras medidas no JSONL do trace; o caso 3 (conflito numa spec cujo título não tem as palavras do item) é o adversarial. A skill só muda se a economia não vier de um conflito perdido.

<!-- COMMENTS:END -->
