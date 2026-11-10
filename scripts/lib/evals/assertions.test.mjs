import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { evaluateAssertions, oracleFindings, skillGate, targetDirectory } from "./assertions.mjs"
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
    JSON.stringify({ type: "tool_use", part: { tool: t.tool, state: { status: t.status ?? "completed", input: t.input ?? {}, metadata: { metadata: t.meta ?? {} } } } }),
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
  assert.equal(findings[0].arg, "src/pricing/index.js")
  assert.match(findings[0].reason, /no staged file matches/)
})

test("a git fixture rejects a filematch outside the base and the patch", () => {
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
    { isGit: true },
  )
  assert.deepEqual(findings.map((f) => f.arg), ["docs/backlog/* status: draft"])
})

test("a plain tree may create a directory the agent needs, and absence is not dead", () => {
  const scratch = tree({ "README.md": "x" })
  const findings = oracleFindings(
    {
      assert: [
        { kind: "file", arg: "docs/pipeline.md" },
        { kind: "filematch", arg: "docs/inbox/*.md status: unprocessed" },
        { kind: "nofile", arg: "docs/backlog/*" },
        { kind: "nodir", arg: "docs/prompts" },
      ],
    },
    scratch,
    { isGit: false },
  )
  assert.deepEqual(findings, [])
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
