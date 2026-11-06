import test from "node:test"
import assert from "node:assert/strict"
import { DETECTOR_RULES, DETECTOR_VERSION, detectorVersion, findLeaks, leak, leaksIn } from "./leak.mjs"

test("the detector version is derived from the rule list and pinned", () => {
  assert.match(DETECTOR_VERSION, /^[0-9a-f]{16}$/)
  assert.equal(DETECTOR_VERSION, detectorVersion(), "the version is the digest of the current rules")
  assert.notEqual(detectorVersion([...DETECTOR_RULES, "a-new-rule"]), DETECTOR_VERSION, "a changed rule moves the version")
  // Golden: if a rule changes, the digest changes and this fails until the new
  // value is written here — the signal that an earlier control is no longer
  // citable. Recompute with `detectorVersion()`.
  assert.equal(DETECTOR_VERSION, "71bfb85a91cd68ab")
})

const SCRATCH = "/var/folders/aa/T/eval-review-code-1-abc123"
const call = (tool, input = {}, meta = {}) => ({ tool, input, meta })
const paths = (hits) => hits.map((h) => h.path)

test("a read inside the scratch is not a leak", () => {
  const hits = findLeaks([call("read", { path: `${SCRATCH}/AGENTS.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

test("the staged skill lives inside the scratch and is not a leak", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${SCRATCH}/.opencode/skills/review-code/SKILL.md` }),
      call("glob", { pattern: "**/*.md", path: `${SCRATCH}/.opencode/skills/review-code` }),
      call("shell", { command: `ls ${SCRATCH}/skills` }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("the same scratch reached through /private is still inside it", () => {
  const hits = findLeaks([call("read", { path: `/private${SCRATCH}/.opencode/skills/review-code/SKILL.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

test("reading an installed skill is a leak", () => {
  const hits = findLeaks([call("read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" })], SCRATCH)
  assert.deepEqual(hits, [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }])
})

test("the bare skills root is a leak, even without an id", () => {
  const hits = findLeaks([call("shell", { command: "ls /Users/me/.agents/skills" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/.agents/skills"])
  assert.equal(hits[0].tool, "shell")
})

test("the bare root counts in every install location", () => {
  const roots = [
    "/Users/me/.claude/skills",
    "/Users/me/.config/opencode/skills",
    "/var/folders/aa/T/opencode/agent-skills-pr/skills",
  ]
  for (const root of roots) assert.deepEqual(paths(findLeaks([call("shell", { command: `ls ${root}` })], SCRATCH)), [root])
})

test("a ~ path resolves inside the throwaway home, not the real install", () => {
  const hits = findLeaks(
    [
      call("glob", { pattern: "~/.agents/skills/*" }, { output: "No files found" }),
      call("shell", { command: "ls ~/.agents/skills" }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("an absolute path under the throwaway home is not the install", () => {
  const home = "/var/folders/aa/T/opencode-eval-home-PJWuQN"
  const hits = findLeaks(
    [call("shell", { command: `ls ${home}/.agents/skills`, workdir: SCRATCH }, { output: `${home}/.agents/skills: No such file or directory` })],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("a shell call that cats an installed skill is a leak", () => {
  const hits = findLeaks([call("shell", { command: "cat /Users/me/.claude/skills/review-code/SKILL.md" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/.claude/skills/review-code/SKILL.md"])
  assert.equal(hits[0].tool, "shell")
})

test("a stale copy under T/opencode is a leak, even without an install dir", () => {
  const stale = "/private/var/folders/aa/T/opencode/agent-skills-pr/skills/review-code/SKILL.md"
  const hits = findLeaks([call("shell", { command: `sed -n '1,20p' ${stale}` })], SCRATCH)
  assert.deepEqual(paths(hits), [stale])
})

test("an external references/evals.md is a leak", () => {
  const hits = findLeaks([call("read", { path: "/Users/me/repos/other/references/evals.md" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/repos/other/references/evals.md"])
})

test("the corpus staged inside the scratch is not a leak", () => {
  // The runner strips it from the staged skill; a fixture may still carry one
  // under another name, and that copy is inside the scratch.
  const hits = findLeaks([call("read", { path: `${SCRATCH}/references/evals.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

// The host corpus. These roots are machine-specific and passed by the caller;
// the fixtures below pin one rule per root the runner records.
const HOST = "/Users/me/host"
const HOST_ROOTS = [
  `${HOST}/docs`,
  `${HOST}/AGENTS.md`,
  `${HOST}/scripts`,
  `${HOST}/skills`,
  `${HOST}/runs`,
  `${HOST}/.lane/trees`,
]

test("a read into each host root is a host finding that names the root", () => {
  const samples = [
    [`${HOST}/docs/specs/SPEC-0012-demo.md`, `${HOST}/docs`],
    [`${HOST}/AGENTS.md`, `${HOST}/AGENTS.md`],
    [`${HOST}/scripts/lib/evals/leak.mjs`, `${HOST}/scripts`],
    [`${HOST}/skills/capture-idea/SKILL.md`, `${HOST}/skills`],
    [`${HOST}/runs/record.json`, `${HOST}/runs`],
    [`${HOST}/.lane/trees/SPEC-0025-demo/scripts`, `${HOST}/.lane/trees`],
  ]
  for (const [path, root] of samples) {
    const hits = findLeaks([call("read", { path })], SCRATCH, HOST_ROOTS)
    assert.deepEqual(hits, [{ tool: "read", path, kind: "host", root }])
  }
})

test("the checkout root covers .git, CONTRIBUTING, package.json and .pdlc", () => {
  const hits = findLeaks(
    [
      call("shell", { command: `git -C ${HOST} log -1` }),
      call("read", { path: `${HOST}/CONTRIBUTING.md` }),
      call("read", { path: `${HOST}/package.json` }),
      call("read", { path: `${HOST}/.pdlc/runs.json` }),
      call("read", { path: `${HOST}/.git/HEAD` }),
    ],
    SCRATCH,
    [HOST],
  )
  assert.deepEqual(paths(hits), [
    HOST,
    `${HOST}/CONTRIBUTING.md`,
    `${HOST}/package.json`,
    `${HOST}/.pdlc/runs.json`,
    `${HOST}/.git/HEAD`,
  ])
  assert.ok(hits.every((h) => h.kind === "host" && h.root === HOST))
})

test("a shell call that reads the host checkout is a host finding", () => {
  const path = `${HOST}/docs/specs/SPEC-0012-demo.md`
  const hits = findLeaks([call("shell", { command: `sed -n '1,20p' ${path}` })], SCRATCH, HOST_ROOTS)
  assert.deepEqual(hits, [{ tool: "shell", path, kind: "host", root: `${HOST}/docs` }])
})

test("the bare host root and its files count, without naming a child", () => {
  const hits = findLeaks(
    [call("shell", { command: `ls ${HOST}/scripts` }), call("read", { path: `${HOST}/AGENTS.md` })],
    SCRATCH,
    HOST_ROOTS,
  )
  assert.deepEqual(paths(hits), [`${HOST}/scripts`, `${HOST}/AGENTS.md`])
  assert.deepEqual(hits.map((h) => h.kind), ["host", "host"])
})

test("a host-shaped path inside the scratch stays invisible", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${SCRATCH}/docs/specs/SPEC-0012-demo.md` }),
      call("read", { path: `${SCRATCH}/AGENTS.md` }),
    ],
    SCRATCH,
    [`${SCRATCH}/docs`, `${SCRATCH}/AGENTS.md`],
  )
  assert.deepEqual(hits, [])
})

test("a host-shaped path in the throwaway home is not the host", () => {
  const home = "/var/folders/aa/T/opencode-eval-home-PJWuQN"
  const hits = findLeaks(
    [call("read", { path: `${home}/docs/specs/SPEC-0012-demo.md` })],
    SCRATCH,
    [`${home}/docs`],
  )
  assert.deepEqual(hits, [])
})

test("an absolute path outside every host root stays benign", () => {
  const hits = findLeaks(
    [call("read", { path: "/Users/me/projects/elsewhere/docs/specs/SPEC-0012-demo.md" })],
    SCRATCH,
    HOST_ROOTS,
  )
  assert.deepEqual(hits, [])
})

test("skill leaks and host reads are separate kinds in one call", () => {
  const skill = "/Users/me/.agents/skills/review-code/SKILL.md"
  const host = `${HOST}/docs/specs/SPEC-0012-demo.md`
  const hits = findLeaks([call("read", { path: skill }), call("read", { path: host })], SCRATCH, HOST_ROOTS)
  assert.deepEqual(hits, [
    { tool: "read", path: skill },
    { tool: "read", path: host, kind: "host", root: `${HOST}/docs` },
  ])
})

test("leak({ calls, scratch, hostRoots }) is the same detector", () => {
  const host = `${HOST}/scripts/lib/evals/leak.mjs`
  assert.deepEqual(leak({ calls: [call("read", { path: host })], scratch: SCRATCH, hostRoots: HOST_ROOTS }), [
    { tool: "read", path: host, kind: "host", root: `${HOST}/scripts` },
  ])
  assert.deepEqual(leak(), [])
})

test("a path that only resembles a skill root is benign", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${SCRATCH}/docs/skills/SKILL.md` }),
      call("read", { path: "/Users/me/project/docs/skills/SKILL.md" }),
      call("read", { path: "/Users/me/notes/other-skills/x/SKILL.md" }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("metadata is scanned too, so a glob's listing is caught", () => {
  const hits = findLeaks(
    [
      call("glob", { pattern: "**/SKILL.md", path: "/Users/me/work" }, {
        output: "/Users/me/.codex/skills/review-code/SKILL.md\n/Users/me/.codex/skills/audit/SKILL.md",
      }),
    ],
    SCRATCH,
  )
  assert.deepEqual(paths(hits), ["/Users/me/.codex/skills/review-code/SKILL.md", "/Users/me/.codex/skills/audit/SKILL.md"])
})

test("an empty or missing transcript is not a leak and does not throw", () => {
  assert.deepEqual(leaksIn("", SCRATCH), [])
  assert.deepEqual(leaksIn(undefined, SCRATCH), [])
  assert.deepEqual(leaksIn(null, SCRATCH), [])
})

test("duplicates collapse and the transcript stream is read through events", () => {
  const line = (id, tool, input) =>
    JSON.stringify({ type: "tool_use", part: { id, tool, state: { status: "completed", input, metadata: { metadata: {} } } } })
  const out = [
    line("a", "read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" }),
    line("b", "read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" }),
  ].join("\n")
  assert.deepEqual(leaksIn(out, SCRATCH), [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }])
})
