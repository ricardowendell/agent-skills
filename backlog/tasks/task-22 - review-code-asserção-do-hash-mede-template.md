---
id: TASK-22
title: 'review-code: asserção do caso #4 mede o template, não a checagem do hash'
status: To Do
assignee: []
created_date: '2026-11-03T12:30:00Z'
updated_date: '2026-11-03T12:30:00Z'
labels: []
dependencies: []
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Achado do segundo controle da SPEC-0006 (`docs/evals/experiments/mutation/review-code/`). O caso #4 tem uma única asserção específica da regra de `spec_sha`: `reply spec hash:.*mismatch`. Ela passa quando a resposta usa o template `SPEC: <id> (spec hash: mismatch)` e falha quando o template muda, mesmo que o revisor tenha feito a comparação.

No mutante `ignore-spec-sha` as três execuções calcularam o hash, compararam com o pin do prompt e rejeitaram nomeando a spec defasada. A asserção falhou nas três porque o template mutado não escreve a frase, não porque o defeito aconteceu. É falso positivo: o comportamento que o controle diz medir (revisar como se o contrato fosse atual) não apareceu.

O caso também não isola a regra pelo veredito: o diff tem um segundo defeito (AC-3 passou a exigir rejeição de `non-finite`, e o código só rejeita negativo), então `verdict REJECT` passa sem a checagem do hash. Só a asserção de texto distingue as duas coisas hoje — e ela mede wording.

O que o caso precisa:

- um fixture em que a spec defasada seja o **único** defeito, sem defeito de AC concorrente, para que `REJECT` só possa vir da checagem do hash;
- uma asserção de estado/comportamento: o veredito rejeita e a resposta nomeia o pin e o hash do head, aceitando relatos semânticos (`hashes to`, `pin`, `MISMATCH`), não uma frase única de template;
- ou manter o campo de saída no mutante e medir a checagem por outro sinal, sem exigir o texto removido.

Depois da mudança, remedir: baseline 5/5 e mutante 3×. Se o mutante passar, a regra é redundante nesse fixture e a conclusão muda de "corpus cego" para "regra desnecessária aqui" — as duas pedem ações diferentes.

Não corrigir a asserção dentro da SPEC-0006: o não-objetivo da spec é não
consertar a lacuna que o piloto expõe — ela vira task. Esta task é o follow-up.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 fixture do caso #4 (ou caso novo) em que a spec defasada é o único defeito
- [ ] #2 asserção falha quando o revisor não compara o hash e passa quando compara, sem exigir uma frase de template
- [ ] #3 baseline 5/5 e mutante `ignore-spec-sha` rodado 3×, com a classificação registrada
- [ ] #4 `--list --check` continua verde e o caso entra como runnable
- [ ] #5 se o mutante passar, registrar a redundância da regra e não adicionar caso
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T12:30:00Z

---

Aberta a partir do segundo controle da SPEC-0006. O controle foi classificado como **inválido**, não detectado: as três execuções fizeram a checagem, mas a asserção só olha a frase do template que o mutante removeu. O baseline do caso #4 reproduziu 5/5 antes da decisão.

O primeiro controle (`no-gates`, caso #1) já tinha mostrado o problema espelhado: o fixture repetia a regra e o mutante não isolava nada. Aqui o fixture não repete a regra, mas a asserção está acoplada à saída. Os dois casos apontam para a mesma exigência: a asserção precisa medir o comportamento, não o texto que a skill manda escrever.
<!-- COMMENTS:END -->
