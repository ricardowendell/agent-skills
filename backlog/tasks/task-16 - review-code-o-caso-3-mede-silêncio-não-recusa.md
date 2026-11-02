---
id: TASK-16
title: 'review-code: o caso #3 mede silêncio, não recusa'
status: To Do
assignee: []
created_date: '2026-11-02T19:05:00Z'
updated_date: '2026-11-02T19:05:00Z'
labels: []
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A re-medição da matriz (TASK-12) com o home isolado mostrou o controle em **4/30**, e todos os quatro passes estão no caso #3. A causa é a asserção, não a skill.

O caso #3 pede: um branch sem spec no repositório, e o comportamento correto é pedir a intenção ou recusar, nomeando o que não dá para verificar. As asserções, porém, são:

- `noreply <veredito>` — o agente **não pode** emitir APPROVE/REJECT/LGTM;
- `reply spec` — basta mencionar "spec";
- `unchanged src/cart.js`.

Um agente sem skill que descreve o diff e não julga satisfaz as três. Não é aprovação errada: é ausência de julgamento, e a asserção não distingue as duas coisas. Os transcripts dos passes são exatamente isso — descreveram o branch, citaram a spec, não emitiram veredito.

O `0/5` publicado não estava errado no dia; o modelo daquela rodada aprovava com confiança. O de hoje às vezes só descreve, e a asserção aceita.

O conserto é positivo, não negativo: exigir que o run peça a intenção ou nomeie o que não pode verificar, em vez de premiar quem se cala. Precisa de medição própria — mudar a asserção e o caso na mesma rodada em que se descobre o defeito é como se afrouxa um teste até ele passar, ao contrário.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 baseline do caso #3 registrado com a asserção atual, incluindo os 4 passes de controle conhecidos
- [ ] #2 asserção nova exige recusa ou pedido de intenção, com vocabulário observado em transcripts reais, não inventado
- [ ] #3 controle remedido: espera-se 0/5 ou próximo disso, e cada passe restante é lido no transcript
- [ ] #4 braço com skill remedido sem regressão (15/15 nas duas versões do caso)
- [ ] #5 a matriz é atualizada com o número novo, e a seção de re-medição explica a diferença entre silêncio e recusa
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T19:05:00Z

---

Aberta a partir do achado da TASK-12. É a diferença entre "a skill impede um veredito errado" — que a matriz provava — e "a skill produz uma recusa", que ela ainda não prova.
<!-- COMMENTS:END -->
