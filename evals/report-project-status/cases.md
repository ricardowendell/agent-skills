# Evals

The scratch repo has no GitHub remote, so `gh` has nothing to answer for any
case here. That is deliberate: issues and CI must come out `unknown` instead of
being inferred from local state.

1. **Trigger: status and next steps, without naming the skill.**
   - prompt: como estamos no repo agora? quais os próximos passos?
   - tags: trigger
   - why: status and next step are the vocabulary the description promises; no skill is named
   - expect: Loads `report-project-status` instead of starting an ad-hoc `git log`.
   - assert: skill report-project-status
   - gate: off

2. **Near-miss: a review verdict is requested.**
   - prompt: revise esse PR contra a spec e me diga se pode mergear
   - tags: trigger
   - why: same vocabulary (PR, merge) but the ask is a verdict; review-code owns that, not status
   - expect: Loads `review-code`, not `report-project-status`.
   - assert: skill review-code
   - stage: review-code
   - gate: off

3. **Status without `gh`: issues and CI are unknown, never guessed.**
   - prompt: qual o status do projeto e o que fazer agora?
   - tags: matrix
   - why: the scratch repo has no GitHub remote, so both GitHub blocks must degrade explicitly
   - expect: Reports `ISSUES: unknown` and `CI: unknown` with the command that failed.
   - expect: Names no issue number and no CI conclusion.
   - expect: Gives at most three next steps, each with evidence.
   - expect: Does not edit, commit, or create an issue.
   - status: manual

4. **Near-miss: the work in flight, not the project status.**
   - prompt: o que está em voo agora? alguma branch ou PR conflita com a minha?
   - tags: trigger
   - why: same topic the two skills share, but the ask is branch/PR collisions; survey-inflight-work owns that, and status only reports its summary
   - expect: Loads `survey-inflight-work`, not `report-project-status`.
   - assert: skill survey-inflight-work
   - stage: survey-inflight-work
   - gate: off
