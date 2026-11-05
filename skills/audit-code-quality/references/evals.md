# Evals

Case 1 is a small repo with a committed baseline and no test command: `src/cart.js`
and `src/pricing.js` import each other against the stated rule, `formatPrice` is
duplicated in `src/legacy/report.js`, and `src/math.js` exports an unused
`average`. There is no coverage command, so the honest answer is `unknown`.
Case 4 scopes the audit to `src/payments`, which has its own duplicate helper,
while `src/legacy/util.js` must stay out of scope.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **A repo with a cycle, a duplicate and dead code.**
   - prompt: The codebase is getting hard to change. Where is the debt?
   - tags: matrix
   - why: three dimensions have evidence; coverage does not, so the report must say unknown
   - expect: Names the `src/cart.js` ↔ `src/pricing.js` cycle and cites the rule it violates.
   - expect: Points at the duplicated `formatPrice` with both locations.
   - expect: Flags `average` as unused and reports coverage as unknown.
   - expect: Ends with capture options and writes nothing.
   - assert: reply pricing
   - assert: reply (cycle|circular|circularidade)
   - assert: reply (duplicate|duplicated|duplica)
   - assert: reply (unknown|not configured|não configurad|no test)
   - assert: unchanged src/pricing.js
   - assert: unchanged src/legacy/report.js
   - assert: nofile docs/backlog/*

2. **Trigger: code health is asked about without naming the skill.**
   - prompt: o código está difícil de mudar e tem duplicação e abstração inútil. como está a qualidade?
   - tags: trigger
   - why: no skill named; the complaint matches the audit dimensions, not a single diff
   - gate: off
   - expect: Loads `audit-code-quality` instead of an ad-hoc read of one file.
   - assert: skill audit-code-quality

3. **Near-miss: a diff to review, not a codebase to audit.**
   - prompt: revisa essa PR antes do merge
   - tags: trigger
   - why: review vocabulary, but the object is one change, which is `review-code` territory
   - gate: off
   - expect: Does not turn a PR review into a whole-repo quality audit.
   - assert: notskill audit-code-quality

4. **A scoped audit stays inside the path.**
   - prompt: audita só src/payments — como está a saúde desse módulo?
   - tags: regression
   - why: scope must be declared and honoured; the legacy helper outside it must not become a finding. Measured 1/1 in both arms on the first draw, so the contract assertions (`SCOPE:`, `rule`/`judgement`, `CAPTURE OPTIONS`) are what separate the skill from an ad-hoc read.
   - expect: Records `src/payments` as the scope.
   - expect: Finds the duplicated `toCents` inside payments.
   - expect: Leaves `src/legacy/util.js` out of the findings.
   - assert: reply src/payments
   - assert: reply toCents
   - assert: reply SCOPE:
   - assert: reply (judgement|\[rule\])
   - assert: reply CAPTURE OPTIONS
   - assert: unchanged src/payments/charge.js
   - assert: unchanged src/legacy/util.js
   - assert: nofile docs/backlog/*
