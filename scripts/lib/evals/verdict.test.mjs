import test from "node:test"
import assert from "node:assert/strict"
import { evaluateAssertions } from "./assertions.mjs"
import { VERDICT_BLOCKERS, VERDICT_FORMS } from "./kinds.mjs"
import { replyText } from "./events.mjs"

function one(assertion, scratch, out = "", text = "", snapshot = new Map()) {
  return evaluateAssertions({ assert: [assertion] }, scratch, out, text || replyText(out), snapshot)[0]
}

// A transcript in the shape `opencode run --format json` emits.
function transcript({ text = "", tools = [] }) {
  const lines = tools.map((t) =>
    JSON.stringify({
      type: "tool_use",
      part: {
        tool: t.tool,
        state: { status: t.status ?? "completed", input: t.input ?? {}, output: t.output ?? "", metadata: { metadata: t.meta ?? {} } },
      },
    }),
  )
  if (text) lines.push(JSON.stringify({ type: "text", part: { text } }))
  return lines.join("\n")
}

test("verdict tolerates markdown decoration but not a missing line", () => {
  // The token can be bolded on either side of the colon.
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: "VERDICT: **APPROVE**" })).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: "**VERDICT:** APPROVE" })).pass, true)
  const decorated = transcript({ text: "## **VERDICT: REJECT**" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", decorated).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", decorated).pass, false)
  const missing = transcript({ text: "Looks fine to me." })
  const r = one({ kind: "verdict", arg: "APPROVE" }, "/tmp", missing)
  assert.equal(r.pass, false)
  assert.match(r.detail, /no VERDICT/)
})

test("verdict reads the stance, not the language", () => {
  // Portuguese is the language the failures came in; the words are a closed list.
  const pt = transcript({ text: "### Veredicto: **Request changes**\n\nNão verifiquei os ACs." })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", pt).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", pt).pass, false)
  const ok = transcript({ text: "Veredicto: Aprovação sem ressalvas" })
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", ok).pass, true)
  const hold = transcript({ text: "VEREDICTO: **Retido** — falta a spec." })
  assert.equal(one({ kind: "verdict", arg: "WITHHELD" }, "/tmp", hold).pass, true)
  // A word below the line is not the verdict, unless the label is a heading.
  const late = transcript({ text: "VERDICT:\n\nI cannot approve this." })
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", late).pass, false)
  const heading = transcript({ text: "### Verdict\n\n**Request changes — do not merge yet.**" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", heading).pass, true)
  const headingOk = transcript({ text: "## Review\n\n**APPROVED**" })
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", headingOk).pass, false)
})

// The stance table is the contract (SPEC-0062): a form it lists is read as that
// stance, in either language. The loop is the table, so a new phrase without a
// test is impossible — adding one here is adding it to the test corpus.
const PORTUGUESE = new Set([
  "aprovado com ressalvas",
  "aprovado com nits",
  "aprovar",
  "aprovado",
  "aprovada",
  "aprovacao",
  "aprovo",
  "mudancas solicitadas",
  "solicito mudancas",
  "solicitar mudancas",
  "solicitando mudancas",
  "precisa de mudancas",
  "precisa de ajustes",
  "nao aprovo",
  "bloqueante",
  "bloqueador",
  "nao mergear",
  "rejeitar",
  "rejeitado",
  "rejeitada",
  "recusar",
  "recusado",
  "retido",
  "retida",
  "reter",
  "retenho",
])

test("the stance table is closed, normalised and covers both languages", () => {
  const seen = new Set()
  for (const [phrase, name] of VERDICT_FORMS) {
    assert.equal(phrase, normaliseForm(phrase), `${phrase} is not in matched form`)
    assert.ok(!seen.has(phrase), `${phrase} is declared twice`)
    seen.add(phrase)
    assert.ok(["APPROVE", "REJECT", "WITHHELD"].includes(name), `${phrase}: ${name}`)
  }
  for (const name of ["APPROVE", "REJECT", "WITHHELD"]) {
    const forms = VERDICT_FORMS.filter(([, n]) => n === name).map(([p]) => p)
    assert.ok(forms.some((p) => PORTUGUESE.has(p)), `${name} has no Portuguese form`)
    assert.ok(forms.some((p) => !PORTUGUESE.has(p)), `${name} has no English form`)
  }
})

function normaliseForm(phrase) {
  return phrase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

test("every accepted form scores as its stance and not as another", () => {
  const stances = ["APPROVE", "REJECT", "WITHHELD"]
  for (const [phrase, name] of VERDICT_FORMS) {
    const out = transcript({ text: `VERDICT: ${phrase}` })
    const got = one({ kind: "verdict", arg: name }, "/tmp", out)
    assert.equal(got.pass, true, `'${phrase}' did not score ${name} (${got.detail})`)
    for (const other of stances.filter((s) => s !== name)) {
      assert.equal(
        one({ kind: "verdict", arg: other }, "/tmp", out).pass,
        false,
        `'${phrase}' also scored ${other}`,
      )
    }
  }
})

test("a form is read in a prose verdict line, after a lead-in", () => {
  const lines = {
    "compliant — approve with minor test nit.": "APPROVE",
    "✅ Passes SPEC-0007 — all three acceptance criteria met, tests green": "APPROVE",
    "needs changes — 1 blocking contract mismatch": "REJECT",
    "changes requested.** One blocking defect.": "REJECT",
    "one blocking defect.**": "REJECT",
    "The branch as a whole should not merge": "REJECT",
    "Approves against SPEC-0008 — all three criteria implemented": "APPROVE",
  }
  for (const [line, name] of Object.entries(lines)) {
    const r = one({ kind: "verdict", arg: name }, "/tmp", transcript({ text: `**Verdict:** ${line}` }))
    assert.equal(r.pass, true, `'${line}' did not score ${name} (${r.detail})`)
  }
})

// A rejection wins over an approval when the stance line names both polarities.
// The reviewer's point: a line that names a blocking finding is not an approval,
// whatever its first clause says.
test("a rejection in the stance line wins over an approval", () => {
  const lines = [
    "Approve the tests; reject the change",
    "approved, but do not merge",
    "The cart change is compliant. The branch as a whole should not merge",
    "The cart change satisfies SPEC-0007. The branch as a whole should not merge: it ships a command-injection bug",
    "Approve — one blocking defect in src/export.js",
  ]
  for (const line of lines) {
    const out = transcript({ text: `VERDICT: ${line}` })
    const r = one({ kind: "verdict", arg: "REJECT" }, "/tmp", out)
    assert.equal(r.pass, true, `'${line}' did not read as a rejection (${r.detail})`)
    assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, false, `'${line}' also read as an approval`)
  }
})

// A near-miss stays a miss. These are the forms the SPEC-0056 review warned
// about: reading them as their surface reading is the bug this table replaced.
test("a negated form is not its surface reading", () => {
  const misses = [
    "not approved",
    "cannot approve",
    "can't approve",
    "won't approve",
    "never approved",
    "not able to approve",
    "unable to approve",
    "There is no way to approve this",
    "Without approving the export change, the branch cannot land",
    "I would approve this if the tests were fixed.",
    "If the tests were fixed, approve",
    "Unless the export change is removed, approve",
    "I cannot approve in good conscience",
    "não aprovado",
    "não aprove",
  ]
  for (const line of misses) {
    const r = one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: `VERDICT: ${line}` }))
    assert.equal(r.pass, false, `'${line}' scored as an approval`)
    assert.match(r.detail, /got /)
  }
})

test("a negated rejection is not a stance, and a later stance still reads", () => {
  const misses = [
    "no changes needed",
    "non-blocking findings only",
    "not blocking",
    "nothing blocking",
    "isn't blocking",
    "no longer blocking",
    "hardly blocking",
    "not at all blocking",
    "nothing whatsoever blocking",
  ]
  for (const line of misses) {
    const r = one({ kind: "verdict", arg: "REJECT" }, "/tmp", transcript({ text: `VERDICT: ${line}` }))
    assert.equal(r.pass, false, `'${line}' scored as a rejection (${r.detail})`)
  }
  // The negated rejection does not stop an approval in the next clause.
  for (const line of ["nothing blocking; approve", "Not at all blocking. Approve."]) {
    const r = one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: `VERDICT: ${line}` }))
    assert.equal(r.pass, true, `'${line}' did not read as an approval (${r.detail})`)
  }
})

// The guard matches words, not fragments: `not` in `notably` and `non` in
// `nonplussed` are not negations of the stance.
test("a blocker inside a word does not block the stance", () => {
  for (const line of ["A notably good change, approve.", "A nonplussed reviewer, approve."]) {
    assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: `VERDICT: ${line}` })).pass, true, line)
  }
})

test("the negation guard is clause-scoped, so a later stance still reads", () => {
  const out = transcript({ text: "VERDICT: not approved as written — request changes" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, false)
})

test("'not merge' takes a right boundary, so 'not merge blockers' is not a stance", () => {
  const out = transcript({ text: "VERDICT: Findings are not merge blockers; approve" })
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, false)
  // The merge rejection is carried by the phrases that cannot be a noun phrase.
  for (const line of ["do not merge", "should not merge", "must not merge"]) {
    assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", transcript({ text: `VERDICT: ${line}` })).pass, true, line)
  }
})

// SPEC-0073: a verdict line ends with its conclusion, so the stance is the last
// clause that names one. `reject the alternative; approve the change` approves
// the change; the rejected alternative is not the verdict. The SPEC-0062 shapes
// keep their reading because in each the decisive form is the final stance-bearing
// clause.
test("the last clause that names a stance wins, not the first", () => {
  const out = transcript({ text: "VERDICT: reject the alternative; approve the change" })
  const approve = one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out)
  assert.equal(approve.pass, true, `did not read as an approval (${approve.detail})`)
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, false, "also read as a rejection")
})

test("`Approve the tests; reject the change` still reads REJECT", () => {
  const out = transcript({ text: "VERDICT: Approve the tests; reject the change" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, false)
})

test("`approved, but do not merge` still reads REJECT", () => {
  const out = transcript({ text: "VERDICT: approved, but do not merge" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, false)
})

test("`The verdict is APPROVE. Notes: AC-2 is not implemented.` still reads APPROVE", () => {
  const out = transcript({ text: "VERDICT: The verdict is APPROVE. Notes: AC-2 is not implemented." })
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, false)
})

test("`unable to approve` still names no stance", () => {
  const out = transcript({ text: "VERDICT: unable to approve" })
  for (const name of ["APPROVE", "REJECT", "WITHHELD"]) {
    assert.equal(one({ kind: "verdict", arg: name }, "/tmp", out).pass, false, `scored as ${name}`)
  }
  assert.match(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out).detail, /got UNABLE/)
})

// A comma ends a clause (SPEC-0073), so a negator before it does not reach the
// stance after it. A negator in the stance's own clause still blocks.
test("a negator does not reach across a comma", () => {
  const rejected = transcript({ text: "VERDICT: AC-2 is not implemented, changes requested" })
  assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", rejected).pass, true)
  assert.equal(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", rejected).pass, false)

  const none = transcript({ text: "VERDICT: AC-2 is not implemented, and not approved" })
  for (const name of ["APPROVE", "REJECT", "WITHHELD"]) {
    assert.equal(one({ kind: "verdict", arg: name }, "/tmp", none).pass, false, `scored as ${name}`)
  }
  assert.match(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", none).detail, /got AC/)
})

// SPEC-0079: the stance slot is what follows the label, so a verdict line that
// *opens* with the negation of a stance names a rejection. These are the six
// stored openings (the `not implemented.` shape appears twice in the store) plus
// every member of the closed set, which stays closed.
test("a verdict line that opens with a negated stance reads REJECT", () => {
  const lines = [
    "not ready",
    "not implemented",
    "not done",
    "not mergeable",
    "not complete",
    "not approved",
    "not approvable",
    "not ready to merge",
    // The stored openings (TASK-109).
    "not done — AC-3 is only half implemented",
    "not ready to open as-is",
    "not implemented.",
    "not ready — the spec is not implemented at all",
    "not ready to merge.",
  ]
  for (const line of lines) {
    const out = transcript({ text: `Verdict: ${line}` })
    const r = one({ kind: "verdict", arg: "REJECT" }, "/tmp", out)
    assert.equal(r.pass, true, `'${line}' did not read as a rejection (${r.detail})`)
    for (const other of ["APPROVE", "WITHHELD"]) {
      assert.equal(one({ kind: "verdict", arg: other }, "/tmp", out).pass, false, `'${line}' also scored ${other}`)
    }
  }
})

// The rule is anchored. A negation in a later clause is a finding, never the
// verdict, so an approval that mentions something unimplemented stays an
// approval; this is the false rejection the spec exists to avoid.
test("a negation after the stance slot does not flip the verdict", () => {
  const lines = [
    "APPROVE — the spec is not ready but ship it",
    "APPROVE — AC-2 is not implemented but planned",
  ]
  for (const line of lines) {
    const out = transcript({ text: `VERDICT: ${line}` })
    const r = one({ kind: "verdict", arg: "APPROVE" }, "/tmp", out)
    assert.equal(r.pass, true, `'${line}' did not read as an approval (${r.detail})`)
    assert.equal(one({ kind: "verdict", arg: "REJECT" }, "/tmp", out).pass, false, `'${line}' also read as a rejection`)
  }
})

// A negated non-stance is not a negation of a stance: `not applicable` and
// `no blockers` name nothing, as before, and the blocker list is untouched.
test("a negated non-stance still names no stance", () => {
  for (const line of ["not applicable", "no blockers"]) {
    const out = transcript({ text: `Verdict: ${line}` })
    for (const name of ["APPROVE", "REJECT", "WITHHELD"]) {
      assert.equal(one({ kind: "verdict", arg: name }, "/tmp", out).pass, false, `'${line}' scored as ${name}`)
    }
  }
  assert.match(one({ kind: "verdict", arg: "APPROVE" }, "/tmp", transcript({ text: "Verdict: not applicable" })).detail, /got NOT/)
})

// Every blocker in the published list must fire in a sentence a reviewer would
// actually write. A blocker with no grammatical case here is a dead entry — the
// defect the first version shipped with `unable` and `if`.
const BLOCKER_SENTENCES = {
  "not able to": "I am not able to approve this change.",
  "no way to": "There is no way to approve this change.",
  "is not": "The branch is not approved.",
  "no longer": "The branch is no longer approved.",
  "unable to": "I am unable to approve this change.",
  cannot: "I cannot approve this change.",
  "can't": "I can't approve this change.",
  cant: "I cant approve this change.",
  "won't": "I won't approve this change.",
  "isn't": "The branch isn't approved.",
  "aren't": "The criteria aren't approved.",
  never: "I will never approve this change.",
  nothing: "Nothing here makes me approve this change.",
  without: "Without approving the export change, the branch cannot land.",
  not: "The branch is not approved.",
  nao: "O parecer não é aprovado.",
  hardly: "The problem is hardly blocking.",
  non: "The finding is non-blocking.",
  no: "There is no blocking defect.",
  if: "If the tests were fixed, approve.",
  unless: "Unless the export change is removed, approve.",
  whether: "Whether to approve is your call.",
  would: "I would approve this if the tests were fixed.",
  could: "I could approve this with more tests.",
  might: "I might approve this later.",
  may: "You may approve this after the fix.",
}

test("every published blocker fires in a grammatical sentence", () => {
  for (const blocker of VERDICT_BLOCKERS) {
    assert.ok(blocker in BLOCKER_SENTENCES, `no sentence for blocker '${blocker}'`)
  }
  for (const [blocker, sentence] of Object.entries(BLOCKER_SENTENCES)) {
    assert.ok(VERDICT_BLOCKERS.includes(blocker), `sentence for a blocker not in the list: '${blocker}'`)
    const out = transcript({ text: `VERDICT: ${sentence}` })
    const form = /approve|blocking/.exec(sentence)?.[0] === "blocking" ? "REJECT" : "APPROVE"
    assert.equal(
      one({ kind: "verdict", arg: form }, "/tmp", out).pass,
      false,
      `'${sentence}' still scored as ${form}`,
    )
  }
})

test("reply and noreply are untouched by the stance vocabulary", () => {
  // SPEC-0062 AC-3: only `verdict` widened. The same text still matches a reply
  // regex literally, including the phrases the stance table now recognises.
  const out = transcript({ text: "Verdict: changes requested" })
  assert.equal(one({ kind: "reply", arg: "changes requested" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "noreply", arg: "changes requested" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "reply", arg: "request changes" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "noreply", arg: "request changes" }, "/tmp", out).pass, true)
})
