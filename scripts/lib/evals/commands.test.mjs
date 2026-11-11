import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { effectiveExit, evaluateAssertions, resolveCommands } from "./assertions.mjs"
import { replyText } from "./events.mjs"

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
