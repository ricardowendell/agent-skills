import test from "node:test"
import assert from "node:assert/strict"
import {
  DETECTOR_CAPABILITIES,
  DETECTOR_RULES,
  DETECTOR_VERSION,
  capabilitiesOf,
  contentFor,
  detectorVersion,
  findLeaks,
  hasCapability,
  leak,
  leaksIn,
} from "./leak.mjs"

test("the detector version is derived from the rule list and pinned", () => {
  assert.match(DETECTOR_VERSION, /^[0-9a-f]{16}$/)
  assert.equal(DETECTOR_VERSION, detectorVersion(), "the version is the digest of the current rules")
  assert.notEqual(detectorVersion([...DETECTOR_RULES, "a-new-rule"]), DETECTOR_VERSION, "a changed rule moves the version")
  // Golden: if a rule changes, the digest changes and this fails until the new
  // value is written here — the signal that an earlier control is no longer
  // citable. Recompute with `detectorVersion()`. SPEC-0048 added the per-path
  // denial rule (`per-path-permission-denial`); SPEC-0049 added the enforced
  // attempt rule (`enforced-corpus-attempt-is-denied`); SPEC-0051 added the
  // per-path content rule (`per-path-content-evidence`); SPEC-0052 added the
  // eval-store rule (`evalStore`); SPEC-0058 moved the answer key to
  // `evals/<id>/cases.md` and widened the corpus rule, so v2's
  // `71bfb85a91cd68ab`, v3's `d8478beab04a4e3e`, v4's `d3e95ef948f983b7`,
  // v5's `def64b2d6a1baa6e` and v6's `9149d6ab1ca57343` are now history.
  assert.equal(DETECTOR_VERSION, "cf2e2e319d975a5b")
})

// SPEC-0048: a claim is judged by what the detector could prove, not by its
// digest. The map is pinned so a new legacy digest is a conscious edit.
test("the capability map is pinned", () => {
  assert.deepEqual([...DETECTOR_CAPABILITIES], ["host-reads", "denied-split"])
  assert.deepEqual([...capabilitiesOf(DETECTOR_VERSION)], ["host-reads", "denied-split"])
  assert.deepEqual(capabilitiesOf("a31d58f79a6c7038"), [], "v1 saw skill roots but not the host corpus")
  assert.deepEqual(capabilitiesOf("71bfb85a91cd68ab"), ["host-reads"], "v2 added the host corpus")
  assert.deepEqual(capabilitiesOf("d8478beab04a4e3e"), ["host-reads", "denied-split"], "v3 added the denied split")
  assert.deepEqual(capabilitiesOf("d3e95ef948f983b7"), ["host-reads", "denied-split"], "v4 kept the v3 capabilities")
  assert.deepEqual(capabilitiesOf("def64b2d6a1baa6e"), ["host-reads", "denied-split"], "v5 kept the v4 capabilities")
  assert.equal(capabilitiesOf("deadbeefdeadbeef"), null, "an unknown digest is credited with nothing")
  assert.equal(capabilitiesOf(undefined), null)
  assert.equal(capabilitiesOf(""), null)
  assert.equal(hasCapability("71bfb85a91cd68ab", "host-reads"), true)
  assert.equal(hasCapability("71bfb85a91cd68ab", "denied-split"), false)
  assert.equal(hasCapability("a31d58f79a6c7038", "host-reads"), false)
  assert.equal(hasCapability("deadbeefdeadbeef", "host-reads"), false)
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

test("the moved corpus at evals/<id>/cases.md is a leak", () => {
  const hits = findLeaks([call("read", { path: "/Users/me/repos/other/evals/review-code/cases.md" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/repos/other/evals/review-code/cases.md"])
})

test("a fixture under evals/<id>/fixtures/ is a leak", () => {
  const fixture = "/Users/me/repos/other/evals/review-code/fixtures/1/git.json"
  const hits = findLeaks([call("read", { path: fixture })], SCRATCH)
  assert.deepEqual(paths(hits), [fixture])
})

test("the corpus staged inside the scratch is not a leak", () => {
  // The runner strips it from the staged skill; a fixture may still carry one
  // under another name, and that copy is inside the scratch.
  const hits = findLeaks([call("read", { path: `${SCRATCH}/references/evals.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

// SPEC-0052: the eval store is the answer key in bulk — every case's answer,
// every prior transcript and every result. It is `leak`, not `host`, and it is
// checked through the throwaway home's inherited `.local` symlink too.
const STORE = "/Users/wendell/.local/share/opencode/evals"

test("a read of an eval-store answer key is a leak, not a host read", () => {
  const path = `${STORE}/groom-backlog/2.md`
  // Even when a caller puts the state dir in the host roots, the store rule
  // wins: the finding is an answer key, not the host corpus.
  const hits = findLeaks([call("read", { path })], SCRATCH, ["/Users/wendell/.local/share/opencode"])
  assert.deepEqual(hits, [{ tool: "read", path }])
  assert.equal(hits[0].kind, undefined, "a store hit keeps the v1 leak shape")
})

test("a read of a prior eval-store transcript is a store leak", () => {
  const path = `${STORE}/runs/2026-11-09T12-55-35--groom-backlog--demo/cases/groom-backlog--02/transcript.r1.md`
  assert.deepEqual(findLeaks([call("read", { path })], SCRATCH), [{ tool: "read", path }])
})

test("a store path reached through the throwaway home is still the store", () => {
  // `isolateHome` symlinks the real `.local` into the scratch home, so this
  // path is the real answer key even though the rest of that home is empty.
  const home = "/var/folders/aa/T/opencode-eval-home-PJWuQN"
  const path = `${home}/.local/share/opencode/evals/groom-backlog/2.md`
  assert.deepEqual(findLeaks([call("read", { path })], SCRATCH), [{ tool: "read", path }])
})

test("a store hit is a leak without enforcement and denied under it", () => {
  const path = `${STORE}/groom-backlog`
  const probe = shell(`ls ${path} 2>/dev/null`, "", 0)
  assert.deepEqual(findLeaks([probe], SCRATCH), [{ tool: "shell", path }])
  assert.deepEqual(findLeaks([probe], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path, kind: "denied" },
  ])
})

test("a store read that returned the answer's content stays a leak under enforcement", () => {
  const path = `${STORE}/groom-backlog/2.md`
  const read = { tool: "read", input: { path }, meta: {}, output: "# Eval: groom-backlog case 2\n", status: "completed" }
  assert.deepEqual(findLeaks([read], SCRATCH, [], { enforced: true }), [{ tool: "read", path }])
  const cat = shell(`cat ${path}`, "# Eval: groom-backlog case 2\n", 0)
  assert.deepEqual(findLeaks([cat], SCRATCH, [], { enforced: true }), [{ tool: "shell", path }])
})

test("only the evals subtree is the store", () => {
  const hits = findLeaks(
    [
      call("read", { path: "/Users/wendell/.local/share/opencode/auth.json" }),
      call("read", { path: `${STORE}-archive/2026-10-15/bootstrap-project-harness/1.md` }),
      call("read", { path: `${STORE}-e004-pre-triage/x.md` }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [], "auth, evals-archive and evals-* backups are not the store")
})

test("a store-shaped path staged inside the scratch is not a leak", () => {
  const hits = findLeaks([call("read", { path: `${SCRATCH}/.local/share/opencode/evals/groom-backlog/2.md` })], SCRATCH)
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

test("the most specific host root names the read", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${HOST}/docs/specs/SPEC-0012-demo.md` }),
      call("read", { path: `${HOST}/AGENTS.md` }),
    ],
    SCRATCH,
    [HOST, `${HOST}/docs`, `${HOST}/AGENTS.md`],
  )
  assert.deepEqual(
    hits.map((h) => h.root),
    [`${HOST}/docs`, `${HOST}/AGENTS.md`],
  )
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

// SPEC-0048: a corpus path the call's output shows refused is `denied`, not a
// read. The F0.1 control probed the installed corpus under the seatbelt and the
// old detector still called the draws contaminated.
const DENIED_OUTPUT = (path) => `cat: ${path}: Operation not permitted\n`
const deniedRead = (path, output = DENIED_OUTPUT(path)) => ({ tool: "read", input: { path }, meta: {}, output })
const shell = (command, output, exit = 0) => ({ tool: "shell", input: { command }, meta: {}, output, exit })

test("a corpus path whose call is refused is denied, not a leak", () => {
  const hits = findLeaks([deniedRead("/Users/me/.agents/skills/review-code/SKILL.md")], SCRATCH)
  assert.deepEqual(hits, [
    { tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md", kind: "denied" },
  ])
})

test("the same path read successfully is still a leak", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  const hits = findLeaks([{ tool: "read", input: { path }, meta: {}, output: "# review-code\nread this" }], SCRATCH)
  assert.deepEqual(hits, [{ tool: "read", path }])
  assert.equal(hits[0].kind, undefined, "no kind is the v1 leak shape")
})

test("a mixed shell call is denied on A and keeps B as a leak", () => {
  const a = "/Users/me/.agents/skills/alpha/SKILL.md"
  const b = "/Users/me/.agents/skills/beta/SKILL.md"
  const hits = findLeaks(
    [shell(`cat ${a} ${b}`, `cat: ${a}: Operation not permitted\nBETA SKILL BODY\n`, 1)],
    SCRATCH,
  )
  assert.deepEqual(hits, [
    { tool: "shell", path: a, kind: "denied" },
    { tool: "shell", path: b },
  ])
})

test("a denial for a different path does not deny this one", () => {
  const a = "/Users/me/.agents/skills/alpha/SKILL.md"
  const b = "/Users/me/.agents/skills/beta/SKILL.md"
  // Non-zero exit, but the output names an absolute path (A), so the no-path
  // fallback must not fire and B stays a leak.
  const hits = findLeaks([shell(`ls ${a} ${b}`, `ls: ${a}: Operation not permitted\n`, 1)], SCRATCH)
  assert.deepEqual(hits, [
    { tool: "shell", path: a, kind: "denied" },
    { tool: "shell", path: b },
  ])
})

test("a denied host-corpus read is denied too, not a host finding", () => {
  const path = `${HOST}/docs/specs/SPEC-0012-demo.md`
  const hits = findLeaks([shell(`cat ${path}`, `cat: ${path}: Operation not permitted\n`, 1)], SCRATCH, HOST_ROOTS)
  assert.deepEqual(hits, [{ tool: "shell", path, kind: "denied" }])
})

test("the path denied in one call is denied wherever the transcript names it", () => {
  // The F0.1 shape: one probe pipes stderr to /dev/null (its own output proves
  // nothing), a later call for the same path shows the denial.
  const path = "/Users/me/.agents/skills"
  const silent = shell(`ls ${path} 2>/dev/null | head`, "unrelated output\n", 0)
  const explicit = shell(`ls ${path}`, `ls: ${path}: Operation not permitted\n`, 0)
  assert.deepEqual(findLeaks([silent, explicit], SCRATCH), [
    { tool: "shell", path, kind: "denied" },
  ])
})

test("a later successful read of a denied path is still a leak", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  const denied = { tool: "read", input: { path }, meta: {}, output: `read: ${path}: Operation not permitted`, status: "error" }
  const success = { tool: "read", input: { path }, meta: {}, output: "# review-code", status: "completed" }
  // The read happened; a false `denied` would hide it. One leak entry wins.
  assert.deepEqual(findLeaks([denied, success], SCRATCH), [{ tool: "read", path }])
})

// SPEC-0048 review repros: per-call, per-path. A successful shell read must not
// be dropped because another call was refused.
test("repro 1: a successful shell read survives a later denial of the same path", () => {
  const path = "/Users/me/.agents/skills/alpha/SKILL.md"
  const hits = findLeaks(
    [
      shell(`cat ${path}`, "# alpha body\n", 0),
      shell(`cat ${path}`, `cat: ${path}: Operation not permitted\n`, 1),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [{ tool: "shell", path }])
})

test("repro 2: one call denied on A and returning B keeps both kinds", () => {
  const a = "/Users/me/.agents/skills/alpha/SKILL.md"
  const b = "/Users/me/.agents/skills/beta/SKILL.md"
  const hits = findLeaks([shell(`cat ${a} ${b}`, `cat: ${a}: Operation not permitted\n# B body\n`)], SCRATCH)
  assert.deepEqual(hits, [
    { tool: "shell", path: a, kind: "denied" },
    { tool: "shell", path: b },
  ])
})

test("repro 3: a refused parent listing does not deny a child that returned content", () => {
  const dir = "/Users/me/.agents/skills/alpha"
  const child = "/Users/me/.agents/skills/alpha/SKILL.md"
  const hits = findLeaks(
    [shell(`ls ${dir}; cat ${child}`, `ls: ${dir}: Operation not permitted\n# alpha body\n`)],
    SCRATCH,
  )
  assert.deepEqual(hits, [
    { tool: "shell", path: dir, kind: "denied" },
    { tool: "shell", path: child },
  ])
})

test("the no-path fallback needs a non-zero exit and an output with no content", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  const denied = shell(`cat ${path}`, "Operation not permitted\n", 1)
  assert.deepEqual(findLeaks([denied], SCRATCH), [{ tool: "shell", path, kind: "denied" }])
  const succeeded = shell(`cat ${path}`, "Operation not permitted\n", 0)
  assert.deepEqual(findLeaks([succeeded], SCRATCH), [{ tool: "shell", path }])
  const content = shell(`cat ${path}`, "Operation not permitted\nSKILL BODY\n", 1)
  assert.deepEqual(findLeaks([content], SCRATCH), [{ tool: "shell", path }])
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

// SPEC-0049: the resumed #19 control ran `ls /Users/wendell/.agents/skills
// 2>/dev/null`; stderr was discarded and only the parent `/Users/wendell/.agents/`
// was reported as `Operation not permitted`, so v3 published a leak. Under
// enforcement the boundary makes that a denied attempt; without enforcement the
// same call is still the v2 leak.
const SUPPRESSED_PROBE = (path = "/Users/wendell/.agents/skills") =>
  shell(
    `ls ${path} 2>/dev/null; echo "---CMDS---"; ls /Users/wendell/.config/opencode 2>/dev/null`,
    "/Users/wendell/.config/zsh/.zshenv: no such file or directory\n---CMDS---\ntotal 248\nAGENTS.md\n",
    1,
  )

test("a suppressed probe is denied under enforcement", () => {
  const path = "/Users/wendell/.agents/skills"
  assert.deepEqual(findLeaks([SUPPRESSED_PROBE(path)], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path, kind: "denied" },
  ])
})

test("the same suppressed probe without enforcement is still a leak", () => {
  const path = "/Users/wendell/.agents/skills"
  assert.deepEqual(findLeaks([SUPPRESSED_PROBE(path)], SCRATCH, [], { enforced: false }), [
    { tool: "shell", path },
  ])
  // The default is the v2 meaning; every caller that does not thread the flag
  // keeps it.
  assert.deepEqual(findLeaks([SUPPRESSED_PROBE(path)], SCRATCH), [{ tool: "shell", path }])
})

test("a suppressed host-corpus probe is denied, not a host read, under enforcement", () => {
  const path = `${HOST}/docs/specs/SPEC-0012-demo.md`
  const probe = shell(`test -f ${path} 2>/dev/null; echo done`, "done\n", 0)
  assert.deepEqual(findLeaks([probe], SCRATCH, HOST_ROOTS, { enforced: true }), [
    { tool: "shell", path, kind: "denied" },
  ])
  assert.deepEqual(findLeaks([probe], SCRATCH, HOST_ROOTS), [
    { tool: "shell", path, kind: "host", root: `${HOST}/docs` },
  ])
})

test("a non-shell read that returned content stays a leak under enforcement", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  const read = { tool: "read", input: { path }, meta: {}, output: "# review-code\nread this" }
  assert.deepEqual(findLeaks([read], SCRATCH, [], { enforced: true }), [{ tool: "read", path }])
})

test("a shell output line naming the path outside a denial stays a leak under enforcement", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  const content = shell(`cat ${path}`, `${path}: SKILL BODY\n`, 0)
  assert.deepEqual(findLeaks([content], SCRATCH, [], { enforced: true }), [{ tool: "shell", path }])
})

test("an exact denial is still denied under enforcement", () => {
  const path = "/Users/me/.agents/skills/review-code/SKILL.md"
  assert.deepEqual(findLeaks([deniedRead(path)], SCRATCH, [], { enforced: true }), [
    { tool: "read", path, kind: "denied" },
  ])
})

test("leaksIn and leak({ enforced }) carry the state", () => {
  const path = "/Users/wendell/.agents/skills"
  const line = JSON.stringify({
    type: "tool_use",
    part: {
      id: "a",
      tool: "shell",
      state: {
        status: "completed",
        input: { command: `ls ${path} 2>/dev/null; echo done` },
        output: "done\n",
        metadata: { metadata: { exit: 0 } },
      },
    },
  })
  assert.deepEqual(leaksIn(line, SCRATCH, [], { enforced: true }), [{ tool: "shell", path, kind: "denied" }])
  assert.deepEqual(leak({ calls: [SUPPRESSED_PROBE(path)], scratch: SCRATCH, enforced: true }), [
    { tool: "shell", path, kind: "denied" },
  ])
})

// SPEC-0051: content counts only for the path it names. SPEC-0050's two control
// draws were published as leaks for output that never came from the hit path:
// capture-idea #1 returned a sibling file's body plus an `ls -l` arrow, and
// groom-backlog #2 returned `No such file or directory`.
const CAPTURE_SKILLS = "/Users/wendell/.config/opencode/skills"
const GROOM_SKILL = "/Users/wendell/.agents/skills/groom/SKILL.md"

test("contentFor: sibling content and a symlink line are not content (capture-idea #1)", () => {
  const probe = shell(
    `ls "${CAPTURE_SKILLS}" 2>/dev/null; echo ---; ls "$HOME/.config/opencode/commands" 2>/dev/null; echo ---; cat "$HOME/.config/opencode/SKILL-SOURCES.md" 2>/dev/null | head -40`,
    "---\n/var/folders/aa/T/opencode-eval-home-x/.config/opencode/commands -> /Users/wendell/.config/opencode/commands  40B\n---\n# Skill Sources & Trust Notes\nbody from another file\n",
    0,
  )
  assert.equal(contentFor(probe, CAPTURE_SKILLS), false)
  // Under enforcement the residual is a denied attempt; without it, the v2 rule
  // still publishes the leak. AC-1 and AC-4.
  assert.deepEqual(findLeaks([probe], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: CAPTURE_SKILLS, kind: "denied" },
  ])
  assert.deepEqual(findLeaks([probe], SCRATCH, [], { enforced: false }), [{ tool: "shell", path: CAPTURE_SKILLS }])
})

test("contentFor: an ENOENT line naming the path is not content (groom-backlog #2)", () => {
  const missing = shell(`cat ${GROOM_SKILL} 2>&1 | head -40`, `cat: ${GROOM_SKILL}: No such file or directory\n`, 0)
  assert.equal(contentFor(missing, GROOM_SKILL), false)
  assert.deepEqual(findLeaks([missing], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: GROOM_SKILL, kind: "denied" },
  ])
  assert.deepEqual(findLeaks([missing], SCRATCH, [], { enforced: false }), [{ tool: "shell", path: GROOM_SKILL }])
})

test("contentFor: an ls -l symlink arrow is not content", () => {
  const listing = shell(
    `ls -la ${CAPTURE_SKILLS} 2>/dev/null`,
    `755  ${CAPTURE_SKILLS}/link -> /Users/wendell/.agents/skills  20B\n`,
    0,
  )
  assert.equal(contentFor(listing, CAPTURE_SKILLS), false)
  assert.deepEqual(findLeaks([listing], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: CAPTURE_SKILLS, kind: "denied" },
  ])
})

test("contentFor: every filesystem error marker is not content", () => {
  const markers = [
    "No such file or directory",
    "permission denied",
    "Operation not permitted",
    "EPERM",
    "EACCES",
    "Is a directory",
    "Not a directory",
  ]
  for (const marker of markers) {
    const errored = shell(`cat ${GROOM_SKILL}`, `cat: ${GROOM_SKILL}: ${marker}\n`, 1)
    assert.equal(contentFor(errored, GROOM_SKILL), false, marker)
    assert.deepEqual(findLeaks([errored], SCRATCH, [], { enforced: true }), [
      { tool: "shell", path: GROOM_SKILL, kind: "denied" },
    ], marker)
  }
})

test("contentFor: a non-error line naming the path is content (AC-3)", () => {
  const body = shell(`cat ${GROOM_SKILL}`, `${GROOM_SKILL}: SKILL BODY\n`, 0)
  assert.equal(contentFor(body, GROOM_SKILL), true)
  assert.deepEqual(findLeaks([body], SCRATCH, [], { enforced: true }), [{ tool: "shell", path: GROOM_SKILL }])
  // A direct read whose body does not name the path is still the path's content
  // (SPEC-0048's repro 1), but a probe that names the path is not.
  const direct = shell(`cat ${GROOM_SKILL}`, "SKILL BODY\n", 0)
  assert.equal(contentFor(direct, GROOM_SKILL), true)
  const probe = shell(`ls ${GROOM_SKILL}`, "SKILL BODY\n", 0)
  assert.equal(contentFor(probe, GROOM_SKILL), false)
  // A line naming a child below the path is the path's content too.
  const child = shell(`ls /Users/wendell/.agents/skills`, `${GROOM_SKILL}\n`, 0)
  assert.equal(contentFor(child, "/Users/wendell/.agents/skills"), true)
})

test("contentFor: a non-shell result carrying a body is content (AC-3)", () => {
  const read = { tool: "read", input: { path: GROOM_SKILL }, meta: {}, output: "# groom-backlog\nbody", status: "completed" }
  assert.equal(contentFor(read, GROOM_SKILL), true)
  assert.deepEqual(findLeaks([read], SCRATCH, [], { enforced: true }), [{ tool: "read", path: GROOM_SKILL }])
  // An errored or empty non-shell result carries no content.
  assert.equal(contentFor({ ...read, status: "error" }, GROOM_SKILL), false)
  assert.equal(contentFor({ ...read, output: "" }, GROOM_SKILL), false)
})

// The shell opens with this unrelated error on every draw. It matches the ENOENT
// marker, and v5's first cut tested it against the whole output, so a real body
// was denied. Markers are per line now; these three repros pin that.
const ZSHENV =
  "/Users/wendell/.config/zsh/.zshenv:source:28: no such file or directory: /var/folders/aa/T/opencode-eval-home-x/.config/zsh/lib/path.zsh"

test("content: a real body after a sibling denial stays a leak under enforcement (repro 2)", () => {
  const a = "/Users/me/.agents/skills/alpha/SKILL.md"
  const b = "/Users/me/.agents/skills/beta/SKILL.md"
  const mixed = shell(`cat ${a} ${b}`, `cat: ${a}: Operation not permitted\nBETA SKILL BODY\n`, 1)
  assert.equal(contentFor(mixed, b), true)
  assert.deepEqual(findLeaks([mixed], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: a, kind: "denied" },
    { tool: "shell", path: b },
  ])
})

test("content: a child body after a refused parent listing stays a leak under enforcement (repro 3)", () => {
  const dir = "/Users/me/.agents/skills/alpha"
  const child = `${dir}/SKILL.md`
  const mixed = shell(`ls ${dir}; cat ${child}`, `ls: ${dir}: Operation not permitted\n# alpha body\n`, 0)
  assert.deepEqual(findLeaks([mixed], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: dir, kind: "denied" },
    { tool: "shell", path: child },
  ])
})

test("content: a real cat body after zshenv noise stays a leak under enforcement", () => {
  const cat = shell(`cat ${GROOM_SKILL}`, `${ZSHENV}\n# beta body\n`, 0)
  assert.equal(contentFor(cat, GROOM_SKILL), true)
  assert.deepEqual(findLeaks([cat], SCRATCH, [], { enforced: true }), [{ tool: "shell", path: GROOM_SKILL }])
})

test("contentFor: the measured capture-idea grep/find call is not content", () => {
  const probe = shell(
    `grep -rl "capture" ${CAPTURE_SKILLS} 2>/dev/null | head; find ${CAPTURE_SKILLS} -maxdepth 2 -name SKILL.md 2>/dev/null | head -40`,
    `${ZSHENV}\n`,
    0,
  )
  assert.equal(contentFor(probe, CAPTURE_SKILLS), false)
  assert.deepEqual(findLeaks([probe], SCRATCH, [], { enforced: true }), [
    { tool: "shell", path: CAPTURE_SKILLS, kind: "denied" },
  ])
  assert.deepEqual(findLeaks([probe], SCRATCH, [], { enforced: false }), [{ tool: "shell", path: CAPTURE_SKILLS }])
})

// SPEC-0051 P1: a bare `ls` of a corpus root returns only names, so it names no
// path. The canary catches a broken boundary first; the detector pins the choice
// rather than inventing attribution from relative output.
test("contentFor: a bare listing with no path-naming result is denied under enforcement", () => {
  const path = "/Users/me/.agents/skills"
  const bare = shell(`ls ${path}`, "review-code\naudit\n", 0)
  assert.equal(contentFor(bare, path), false)
  assert.deepEqual(findLeaks([bare], SCRATCH, [], { enforced: true }), [{ tool: "shell", path, kind: "denied" }])
  assert.deepEqual(findLeaks([bare], SCRATCH, [], { enforced: false }), [{ tool: "shell", path }])
})

