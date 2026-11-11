import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import {
  effectiveExit,
  evaluateAssertions,
  oracleFindings,
  oracleWarnings,
  resolveCommands,
  skillGate,
  targetDirectory,
} from "./assertions.mjs"
import { VERDICT_BLOCKERS, VERDICT_FORMS } from "./kinds.mjs"
import { replyText, toolCalls, usageStats } from "./events.mjs"
import { snapshotTree } from "./fixture.mjs"

function tree(files) {
  const root = mkdtempSync(join(tmpdir(), "assert-test-"))
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
  return root
}

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

test("nofile with a glob fails when a matching file exists", () => {
  const scratch = tree({ "docs/decisions/ADR-0003-sqlite.md": "x" })
  const r = one({ kind: "nofile", arg: "docs/decisions/ADR-0003-*.md" }, scratch)
  assert.equal(r.pass, false, "the wildcard was read literally")
  assert.match(r.detail, /ADR-0003-sqlite\.md/)
})

test("nofile with a glob passes when nothing matches", () => {
  const scratch = tree({ "docs/decisions/ADR-0002-queue.md": "x" })
  assert.equal(one({ kind: "nofile", arg: "docs/decisions/ADR-0003-*.md" }, scratch).pass, true)
})

test("file and dir take globs", () => {
  const scratch = tree({ "docs/specs/SPEC-0003-onboarding.md": "x" })
  assert.equal(one({ kind: "file", arg: "docs/specs/SPEC-*.md" }, scratch).pass, true)
  assert.equal(one({ kind: "file", arg: "docs/prompts/*.md" }, scratch).pass, false)
  assert.equal(one({ kind: "dir", arg: "docs/*" }, scratch).pass, true)
  assert.equal(one({ kind: "nodir", arg: "docs/prompts" }, scratch).pass, true)
})

test("changed and unchanged compare against the staged snapshot", () => {
  const scratch = tree({ "src/cart.js": "one", "src/other.js": "same" })
  const snapshot = snapshotTree(scratch)
  writeFileSync(join(scratch, "src/cart.js"), "two")

  assert.equal(one({ kind: "changed", arg: "src/cart.js" }, scratch, "", "", snapshot).pass, true)
  assert.equal(one({ kind: "unchanged", arg: "src/cart.js" }, scratch, "", "", snapshot).pass, false)
  assert.equal(one({ kind: "unchanged", arg: "src/other.js" }, scratch, "", "", snapshot).pass, true)
  assert.equal(one({ kind: "changed", arg: "src/other.js" }, scratch, "", "", snapshot).pass, false)
})

test("a wildcard that matches nothing never reads as a pass", () => {
  const scratch = tree({ "src/cart.js": "one" })
  const snapshot = snapshotTree(scratch)
  for (const kind of ["unchanged", "changed"]) {
    const r = one({ kind, arg: "src/*.ts" }, scratch, "", "", snapshot)
    assert.equal(r.pass, false, `${kind} passed with no match`)
    assert.match(r.detail, /no file matches/)
  }
})

test("filematch requires both the path glob and the content regex", () => {
  const scratch = tree({ "docs/decisions/ADR-0003-sqlite.md": "Status: accepted\nStore: sqlite" })
  assert.equal(one({ kind: "filematch", arg: "docs/decisions/ADR-0003-*.md SQLite" }, scratch).pass, false)
  assert.equal(one({ kind: "filematch", arg: "docs/decisions/ADR-0003-*.md SQLite|sqlite" }, scratch).pass, true)
  assert.equal(one({ kind: "filematch", arg: "docs/decisions/ADR-0009-*.md SQLite" }, scratch).pass, false)
})

test("reply matching ignores capitalisation", () => {
  const out = transcript({ text: "Verdict: approve" })
  assert.equal(one({ kind: "reply", arg: "VERDICT: APPROVE" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "noreply", arg: "VERDICT: APPROVE" }, "/tmp", out).pass, false)
})

test("reply reads the assistant text, not tool output", () => {
  const out = transcript({
    text: "VERDICT: APPROVE",
    tools: [{ tool: "read", input: { filePath: "x" }, meta: { content: "VERDICT: REJECT" } }],
  })
  assert.equal(one({ kind: "reply", arg: "APPROVE" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "reply", arg: "REJECT" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "noreply", arg: "REJECT" }, "/tmp", out).pass, true)
})

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

test("an invalid regex fails with a reason instead of throwing", () => {
  const r = one({ kind: "reply", arg: "(" }, "/tmp", transcript({ text: "x" }))
  assert.equal(r.pass, false)
  assert.match(r.detail, /invalid regex/)
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

test("tool calls expose the shell command, exit code and timing", () => {
  const out = transcript({ tools: [{ tool: "shell", input: { command: "npm test" }, meta: { exit: 0 } }] })
  const [call] = toolCalls(out)
  assert.equal(call.tool, "shell")
  assert.equal(call.input.command, "npm test")
  assert.equal(call.exit, 0)
})

test("the skill gate requires the pinned copy inside the scratch dir", () => {
  const scratch = tree({ "SKILL.md": "x" })
  const inside = transcript({
    tools: [{ tool: "skill", input: { id: "review-code" }, meta: { name: "review-code", directory: join(scratch, ".opencode/skills/review-code") } }],
  })
  assert.equal(skillGate(inside, scratch, "review-code").ok, true)
  assert.equal(skillGate(inside, scratch, "review-code").source, "tool")

  const outside = transcript({
    tools: [{ tool: "skill", input: { id: "review-code" }, meta: { name: "review-code", directory: "/Users/wendell/.agents/skills/review-code" } }],
  })
  assert.equal(skillGate(outside, scratch, "review-code").ok, false, "a global install passed the provenance gate")
  // Routing and provenance answer different questions: the assertion only says
  // which skill was chosen.
  assert.equal(one({ kind: "skill", arg: "review-code" }, scratch, outside).pass, true)

  const none = transcript({ text: "did it myself" })
  assert.equal(skillGate(none, scratch, "review-code").ok, false)
  assert.equal(one({ kind: "noskill" }, scratch, none).pass, true)
})

// A behavioural case is carried by the skill even when the `skill` tool is not
// called: reading the staged SKILL.md is a load, with the origin recorded. The
// control arm and trigger cases do not use this path.
test("a direct read of the staged SKILL.md is a load, recorded as a read", () => {
  const scratch = tree({ ".opencode/skills/review-code/SKILL.md": "rules" })
  const absolute = transcript({
    tools: [{ tool: "read", input: { filePath: join(scratch, ".opencode/skills/review-code/SKILL.md") } }],
  })
  const g = skillGate(absolute, scratch, "review-code")
  assert.equal(g.ok, true)
  assert.equal(g.source, "read")
  assert.deepEqual(g.loads.map((l) => l.id), ["review-code"])

  const relativePath = transcript({
    tools: [{ tool: "read", input: { path: ".opencode/skills/review-code/SKILL.md" } }],
  })
  assert.equal(skillGate(relativePath, scratch, "review-code").ok, true)
})

test("a read outside the scratch, of another staged skill, or of a reference is not a load", () => {
  const scratch = tree({
    ".opencode/skills/review-code/SKILL.md": "rules",
    ".opencode/skills/review-code/references/notes.md": "x",
    ".opencode/skills/other/SKILL.md": "x",
  })
  const global = transcript({
    tools: [{ tool: "read", input: { filePath: "/Users/wendell/.agents/skills/review-code/SKILL.md" } }],
  })
  assert.equal(skillGate(global, scratch, "review-code").ok, false)
  assert.equal(skillGate(global, scratch, "review-code").source, null)

  const sibling = transcript({
    tools: [{ tool: "read", input: { filePath: join(scratch, ".opencode/skills/other/SKILL.md") } }],
  })
  assert.equal(skillGate(sibling, scratch, "review-code").ok, false)

  const reference = transcript({
    tools: [{ tool: "read", input: { filePath: join(scratch, ".opencode/skills/review-code/references/notes.md") } }],
  })
  assert.equal(skillGate(reference, scratch, "review-code").ok, false, "only the staged SKILL.md is the skill's contract")
})

test("a failed read does not count as a load, and a run with no use of the skill still fails", () => {
  const scratch = tree({ ".opencode/skills/review-code/SKILL.md": "rules", "README.md": "fixture" })
  const failed = transcript({
    tools: [{ tool: "read", status: "error", input: { filePath: join(scratch, ".opencode/skills/review-code/SKILL.md") } }],
  })
  assert.equal(skillGate(failed, scratch, "review-code").ok, false)

  const unrelated = transcript({ tools: [{ tool: "read", input: { filePath: join(scratch, "README.md") } }] })
  assert.equal(skillGate(unrelated, scratch, "review-code").ok, false)
})

test("notskill allows a different skill to load", () => {
  const out = transcript({ tools: [{ tool: "skill", input: { id: "process-inbox" }, meta: { directory: "/tmp/x" } }] })
  assert.equal(one({ kind: "notskill", arg: "capture-idea" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "notskill", arg: "process-inbox" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "skill", arg: "process-inbox" }, "/tmp", out).pass, true)
})

test("an errored skill call is not a load", () => {
  const out = transcript({ tools: [{ tool: "skill", input: { id: "review-code" }, status: "error", meta: {} }] })
  assert.equal(one({ kind: "skill", arg: "review-code" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "notskill", arg: "review-code" }, "/tmp", out).pass, true)
})

test("ran and ranpass read the shell commands, not the reply", () => {
  const out = transcript({
    text: "I ran the gate and it passed.",
    tools: [{ tool: "shell", input: { command: "npm test" }, meta: { exit: 1 } }],
  })
  assert.equal(one({ kind: "ran", arg: "^npm test" }, "/tmp", out).pass, true)
  const failed = one({ kind: "ranpass", arg: "^npm test" }, "/tmp", out)
  assert.equal(failed.pass, false, "a failing gate counted as a pass")
  assert.match(failed.detail, /exit 1/)
  assert.equal(one({ kind: "ran", arg: "^npm run build" }, "/tmp", out).pass, false)
})

test("ranpass passes when any execution of the gate exited 0", () => {
  const out = transcript({
    tools: [
      { tool: "shell", input: { command: "npm test" }, meta: { exit: 1 } },
      { tool: "shell", input: { command: "npm test" }, meta: { exit: 0 } },
    ],
  })
  assert.equal(one({ kind: "ranpass", arg: "npm test" }, "/tmp", out).pass, true)
})

// A command can name a script instead of the gate. The fixture's `package.json`
// is the data that says what that script runs; the oracle should read it rather
// than encode one fixture's script name in the corpus.
test("the resolver expands every package manager through the fixture's scripts", () => {
  const scratch = tree({
    "package.json": JSON.stringify({
      scripts: {
        test: "node --test",
        build: "tsc -p .",
        chain: "npm run build",
        loop: "npm run loop",
      },
    }),
  })
  for (const invocation of [
    "npm test",
    "npm run test",
    "npm run-script test",
    "yarn test",
    "pnpm test",
    "bun run test",
    "bun test",
  ]) {
    assert.ok(resolveCommands(invocation, scratch).includes("node --test"), `${invocation} did not resolve`)
  }
  for (const invocation of ["npm run build", "npm run-script build", "yarn build", "pnpm build", "bun run build", "bun build"]) {
    assert.ok(resolveCommands(invocation, scratch).includes("tsc -p ."), `${invocation} did not resolve`)
  }
  // A script may call another script; the expansion follows the chain.
  assert.ok(resolveCommands("npm run chain", scratch).includes("tsc -p ."))
  // A compound call resolves the segment that names the script.
  assert.ok(resolveCommands('npm test 2>&1; echo "exit: $?"', scratch).includes("node --test"))
  // The literal is always present, and a cycle ends the expansion.
  assert.equal(resolveCommands("npm run loop", scratch)[0], "npm run loop")
  assert.deepEqual(resolveCommands("npm run loop", scratch), ["npm run loop"])
})

test("a malformed or missing package.json leaves the call literal", () => {
  const broken = tree({ "package.json": "{ scripts: nope" })
  assert.deepEqual(resolveCommands("npm test", broken), ["npm test"])
  const missing = tree({ "README.md": "x" })
  assert.deepEqual(resolveCommands("npm test", missing), ["npm test"])
  // No manifest at all is normal for most fixtures.
  assert.deepEqual(resolveCommands("npm test", "/tmp"), ["npm test"])
})

test("the effective exit is the gate's own status", () => {
  // The gate is the last command: the recorded exit is its exit.
  assert.deepEqual(effectiveExit({ input: { command: "npm test" }, exit: 0, output: "" }), {
    code: 0,
    why: "recorded exit",
  })
  const masked = (output, exit = 0) => effectiveExit({ input: { command: 'npm test 2>&1; echo "exit: $?"' }, exit, output }, { gateLast: false })
  assert.deepEqual(masked("pass 3 / fail 0\nexit: 0\n"), { code: 0, why: "printed status" })
  assert.deepEqual(masked("pass 2 / fail 1\nexit: 1\n"), { code: 1, why: "printed status" })
  assert.deepEqual(masked("pass 2 / fail 1\n"), { code: null, why: "exit masked, no recorded status" })
  // Every printed spelling is read, and the last one wins.
  assert.equal(masked("exit: 2\nEXIT: 0\n").code, 0)
  assert.equal(masked("exit code 3").code, 3)
  assert.equal(masked("test-exit: 4").code, 4)
})

test("a masked exit is read from the runner's counters", () => {
  const masked = (output) =>
    effectiveExit({ input: { command: "npm test 2>&1 | tail -40" }, exit: 0, output }, { gateLast: false })
  assert.deepEqual(masked("ℹ tests 1\nℹ suites 0\nℹ pass 1\nℹ fail 0\n"), { code: 0, why: "runner summary" })
  assert.deepEqual(masked("ℹ tests 2\nℹ suites 0\nℹ pass 1\nℹ fail 1\n"), { code: 1, why: "runner summary" })
  assert.deepEqual(masked("# tests 2\n# pass 2\n# fail 0\n"), { code: 0, why: "runner summary" })
  assert.deepEqual(masked("# tests 2\n# pass 1\n# fail 1\n"), { code: 1, why: "runner summary" })
  assert.deepEqual(masked("Tests:       1 failed, 2 passed, 3 total\n"), { code: 1, why: "runner summary" })
  assert.deepEqual(masked("Tests:       3 passed, 3 total\n"), { code: 0, why: "runner summary" })
  assert.deepEqual(masked("npm ERR! Test failed.\n"), { code: 1, why: "runner summary" })
  // `✖` is node's marker for skipped and todo tests too; only the counters decide.
  assert.equal(masked("✖ skipped test\n✖ todo test\n").code, null)
  assert.equal(masked("✖ failing tests:\n\nassertion failed\n").code, null)
  // The last verdict block wins: a pre-fix red then a post-fix green reads green.
  assert.equal(masked("ℹ pass 2\nℹ fail 1\n\n---\n\nℹ pass 3\nℹ fail 0\n").code, 0)
  assert.equal(masked("ℹ pass 3\nℹ fail 0\n\n---\n\nℹ pass 2\nℹ fail 1\n").code, 1)
  // An explicit printed status comes before the counters, except that a red
  // last verdict block beats a green printed status.
  assert.equal(masked("ℹ pass 3\nℹ fail 0\nGATE_EXIT=1\n").code, 1)
  assert.equal(masked("ℹ pass 2\nℹ fail 1\nGATE_EXIT=0\n").code, 1)
})

// The stored shape that proves why a piped gate's `$?` is not the gate's:
// `npm test | tail; echo "EXIT: $?"` prints tail's status, while the counters
// still name the gate's verdict. The printed 0 must not make a red suite green.
test("a piped gate's printed $? is not its status", () => {
  const scratch = tree({ "package.json": JSON.stringify({ scripts: { test: "node --test" } }) })
  const piped = (fail) =>
    transcript({
      tools: [
        {
          tool: "shell",
          input: { command: 'npm test 2>&1 | tail -40; echo "EXIT: $?"' },
          output:
            `✖ failing test\nℹ tests 6\nℹ suites 0\nℹ pass ${fail ? 5 : 6}\nℹ fail ${fail ? 1 : 0}\nEXIT: 0\n`,
          meta: { exit: 0 },
        },
      ],
    })
  const red = one({ kind: "ranpass", arg: "npm test" }, scratch, piped(true))
  assert.equal(red.pass, false, "tail's exit 0 made a red suite green")
  assert.match(red.detail, /exit 1/)
  assert.equal(one({ kind: "ranpass", arg: "npm test" }, scratch, piped(false)).pass, true)
})

test("a ; echo of $? after the gate is the gate's status", () => {
  const scratch = tree({ "package.json": JSON.stringify({ scripts: { test: "node --test" } }) })
  const shape = (status) =>
    transcript({
      tools: [
        {
          tool: "shell",
          input: { command: 'npm test 2>&1; echo "exit: $?"' },
          output: `ℹ tests 6\nℹ suites 0\nℹ pass 6\nℹ fail 0\nexit: ${status}\n`,
          meta: { exit: 0 },
        },
      ],
    })
  assert.equal(one({ kind: "ranpass", arg: "npm test" }, scratch, shape(0)).pass, true)
  const red = one({ kind: "ranpass", arg: "npm test" }, scratch, shape(1))
  assert.equal(red.pass, false)
  assert.match(red.detail, /exit 1/)
})

test("a red pre-fix run and a green post-fix run in one cell pass", () => {
  const out = transcript({
    tools: [
      {
        tool: "shell",
        input: { command: "npm test 2>&1 | tail -30" },
        output: "✖ failing tests:\n\nassertion failed\n",
        meta: { exit: 0 },
      },
      {
        tool: "shell",
        input: { command: "npm test 2>&1 | tail -20" },
        output: "ℹ tests 3\nℹ suites 0\nℹ pass 3\nℹ fail 0\n",
        meta: { exit: 0 },
      },
    ],
  })
  assert.equal(one({ kind: "ranpass", arg: "npm test" }, "/tmp", out).pass, true)
})

test("ranpass resolves npm test to node --test", () => {
  const scratch = tree({ "package.json": JSON.stringify({ scripts: { test: "node --test" } }) })
  const out = transcript({
    tools: [
      {
        tool: "shell",
        input: { command: 'npm test 2>&1; echo "exit: $?"' },
        output: "pass 3 / fail 0\nexit: 0\n",
        meta: { exit: 0 },
      },
    ],
  })
  assert.equal(one({ kind: "ranpass", arg: "node --test" }, scratch, out).pass, true)
  assert.equal(one({ kind: "ran", arg: "node --test" }, scratch, out).pass, true)
})

test("ranpass resolves a nested npm run build to the script it chains", () => {
  const scratch = tree({
    "package.json": JSON.stringify({ scripts: { build: "tsc -p .", all: "npm run build" } }),
  })
  const out = transcript({ tools: [{ tool: "shell", input: { command: "npm run all" }, meta: { exit: 0 } }] })
  assert.equal(one({ kind: "ranpass", arg: "tsc -p" }, scratch, out).pass, true)
  assert.equal(one({ kind: "ranpass", arg: "node --test" }, scratch, out).pass, false)
})

test("a masked non-zero gate is red even when the call recorded exit 0", () => {
  const scratch = tree({ "package.json": JSON.stringify({ scripts: { test: "node --test" } }) })
  const out = transcript({
    tools: [
      {
        tool: "shell",
        input: { command: 'npm test 2>&1; echo "exit: $?"' },
        output: "pass 2 / fail 1\nexit: 1\n",
        meta: { exit: 0 },
      },
    ],
  })
  const r = one({ kind: "ranpass", arg: "node --test" }, scratch, out)
  assert.equal(r.pass, false, "a masked failure scored as a pass")
  assert.match(r.detail, /exit 1/)
})

test("a masked exit with nothing printed fails closed", () => {
  const out = transcript({
    tools: [{ tool: "shell", input: { command: "npm test; echo done" }, output: "done\n", meta: { exit: 0 } }],
  })
  const r = one({ kind: "ranpass", arg: "npm test" }, "/tmp", out)
  assert.equal(r.pass, false)
  assert.equal(r.detail, "exit masked, no recorded status")
})

test("| tail and || true both hide the gate's status", () => {
  for (const command of ["npm test 2>&1 | tail -5", "npm test || true", "npm test; echo finished"]) {
    const out = transcript({ tools: [{ tool: "shell", input: { command }, output: "finished\n", meta: { exit: 0 } }] })
    const r = one({ kind: "ranpass", arg: "npm test" }, "/tmp", out)
    assert.equal(r.pass, false, `${command} scored as a pass`)
    assert.equal(r.detail, "exit masked, no recorded status")
  }
})

test("a script body that masks its own status is not green", () => {
  const scratch = tree({ "package.json": JSON.stringify({ scripts: { test: "node --test; echo done" } }) })
  const out = transcript({
    tools: [{ tool: "shell", input: { command: "npm test" }, output: "done\n", meta: { exit: 0 } }],
  })
  const r = one({ kind: "ranpass", arg: "node --test" }, scratch, out)
  assert.equal(r.pass, false, "the script's echo owned the exit")
  assert.equal(r.detail, "exit masked, no recorded status")
})

test("tool and notool name the tool exactly", () => {
  const out = transcript({ tools: [{ tool: "read", input: { filePath: "src/cart.js" }, meta: {} }] })
  assert.equal(one({ kind: "tool", arg: "read" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "tool", arg: "write" }, "/tmp", out).pass, false)
  assert.equal(one({ kind: "notool", arg: "write" }, "/tmp", out).pass, true)
  assert.equal(one({ kind: "notool", arg: "read" }, "/tmp", out).pass, false)
})

// SPEC-0057: a filesystem assertion whose target no fixture can produce is an
// authoring bug, not a red cell. This is the check that would have stopped the
// SPEC-0055 case-9 wave before it spent five paid draws.
test("targetDirectory reads the glob's literal container", () => {
  assert.equal(targetDirectory("docs/backlog/*", "filematch"), "docs/backlog")
  assert.equal(targetDirectory("docs/pipeline.md release_tier", "filematch"), "docs")
  assert.equal(targetDirectory("AGENTS.md", "file"), ".")
  assert.equal(targetDirectory(".husky", "nofile"), ".")
  assert.equal(targetDirectory("docs/**/*.md", "unchanged"), "docs")
})

test("a dead unchanged target is an error at stage time", () => {
  const scratch = tree({ "src/cart.js": "one\n" })
  const findings = oracleFindings(
    { assert: [{ kind: "unchanged", arg: "src/pricing/index.js" }, { kind: "unchanged", arg: "src/cart.js" }] },
    scratch,
  )
  assert.equal(findings.length, 1)
  assert.equal(findings[0].level, "error")
  assert.equal(findings[0].arg, "src/pricing/index.js")
  assert.match(findings[0].reason, /no staged file matches/)
})

// The draw is allowed to create the file it is then checked for, so an
// existence target with no staged match is a warning, never a rejection.
test("an existence target the fixture lacks is a warning for every fixture", () => {
  const scratch = tree({ "src/cart.js": "one\n" })
  const findings = oracleFindings(
    {
      assert: [
        { kind: "filematch", arg: "docs/backlog/* status: draft" },
        { kind: "file", arg: "src/cart.js" },
        { kind: "file", arg: "lefthook.yml" },
      ],
    },
    scratch,
  )
  assert.deepEqual(
    findings.map((f) => [f.level, f.arg]),
    [
      ["warning", "docs/backlog/* status: draft"],
      ["warning", "lefthook.yml"],
    ],
  )
  assert.ok(findings.every((f) => /the draw must create it/.test(f.reason)))
})

test("nofile and nodir assert an absence and are not findings", () => {
  const scratch = tree({ "README.md": "x" })
  const findings = oracleFindings(
    {
      assert: [
        { kind: "nofile", arg: "docs/backlog/*" },
        { kind: "nodir", arg: "docs/prompts" },
      ],
    },
    scratch,
  )
  assert.deepEqual(findings, [])
})

test("oracleWarnings gives the same authoring view without staging", () => {
  const c = {
    assert: [
      { kind: "file", arg: "AGENTS.md" },
      { kind: "file", arg: "docs/pipeline.md" },
      { kind: "dir", arg: "docs/product" },
      { kind: "filematch", arg: "docs/specs/*.md status: draft" },
    ],
  }
  const entries = [
    { rel: "AGENTS.md", isDir: false },
    { rel: "docs", isDir: true },
    { rel: "docs/product", isDir: true },
  ]
  assert.deepEqual(
    oracleWarnings(c, entries).map((f) => f.arg),
    ["docs/pipeline.md", "docs/specs/*.md status: draft"],
  )
})

test("usageStats sums tokens and cost across steps, both spellings", () => {
  const out = [
    JSON.stringify({ type: "step_finish", part: { cost: 0.5, tokens: { input: 10, output: 2, reasoning: 0, cache: { read: 3, write: 1 } } } }),
    JSON.stringify({ type: "step-finish", part: { cost: 0.25, tokens: { input: 20, output: 4, reasoning: 1, cache: { read: 0, write: 0 } } } }),
  ].join("\n")
  const { tokens, cost, steps } = usageStats(out)
  assert.equal(steps, 2)
  assert.equal(cost, 0.75)
  assert.deepEqual(tokens, { input: 30, output: 6, reasoning: 1, cacheRead: 3, cacheWrite: 1 })
})
