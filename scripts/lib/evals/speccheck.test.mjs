import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  acceptanceCount,
  checkSpec,
  parseFrontmatter,
  specRef,
  taskNumber,
} from "./speccheck.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const cli = resolve(here, "..", "..", "spec-check.mjs")

const specText = ({
  id = "SPEC-0001",
  status = "ready",
  task = "TASK-1",
  files = ["a.md"],
  depends = [],
  blocks = [],
  results = "Done. The diff is clean.",
  ac = true,
  body = "",
} = {}) =>
  [
    "---",
    `id: ${id}`,
    `status: ${status}`,
    ...(task ? [`task: ${task}`] : []),
    "depends_on:",
    ...depends.map((d) => `  - ${d}`),
    "blocks:",
    ...blocks.map((b) => `  - ${b}`),
    "files:",
    ...files.map((f) => `  - ${f}`),
    "---",
    "",
    `# ${id}`,
    "",
    "## Acceptance Criteria",
    ...(ac ? ["1. **The rule holds.**", "2. **The diff agrees.**"] : []),
    "",
    "## Results",
    results,
    body,
  ].join("\n")

const tasks = ["task-1 - demo.md", "task-49 - demo.md"]
const corpus = (items) => items

test("a clean ready spec has no findings", () => {
  const findings = checkSpec({
    text: specText(),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings, [])
})

test("a declared file the diff did not touch is a warning", () => {
  const findings = checkSpec({
    text: specText({ files: ["a.md", "b.md"] }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "files-declared-untouched"]])
  assert.match(findings[0].message, /b\.md/)
})

test("files: reports a touched file the spec did not declare", () => {
  const findings = checkSpec({
    text: specText({ files: ["a.md"] }),
    path: "spec.md",
    diff: ["a.md", "c.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => f.rule), ["files-touched-undeclared"])
  assert.match(findings[0].message, /c\.md/)
})

test("a trailing-slash entry covers every path under its subtree", () => {
  const findings = checkSpec({
    text: specText({ files: ["evals/"] }),
    path: "spec.md",
    diff: ["evals/review-code/cases.md", "evals/review-code/fixtures/1/git.json"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings, [])
})

test("an undeclared file under a declared subtree is still an error", () => {
  const findings = checkSpec({
    text: specText({ files: ["evals/"] }),
    path: "spec.md",
    diff: ["evals/review-code/cases.md", "scripts/runner.mjs"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["error", "files-touched-undeclared"]])
  assert.match(findings[0].message, /scripts\/runner\.mjs/)
})

test("a declared subtree the diff does not touch is a warning", () => {
  const findings = checkSpec({
    text: specText({ files: ["evals/", "runner.mjs"] }),
    path: "spec.md",
    diff: ["runner.mjs"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "files-declared-untouched"]])
  assert.match(findings[0].message, /evals\//)
})

test("an entry without the slash keeps exact equality", () => {
  const findings = checkSpec({
    text: specText({ files: ["evals", "a.md"] }),
    path: "spec.md",
    diff: ["evals/review-code/cases.md", "a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [
    ["warning", "files-declared-untouched"],
    ["error", "files-touched-undeclared"],
  ])
})

test("Results prose does not excuse a declared file the diff did not touch", () => {
  const findings = checkSpec({
    text: specText({
      files: ["a.md", "b.md"],
      results: "b.md is documentation only.",
    }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "files-declared-untouched"]])
})

test("Results does not excuse a touched file the spec did not declare", () => {
  const findings = checkSpec({
    text: specText({
      files: ["a.md"],
      results: "c.md is a citation repair.",
    }),
    path: "spec.md",
    diff: ["a.md", "c.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => f.rule), ["files-touched-undeclared"])
})

test("files: empty is a finding for ready and implemented", () => {
  for (const status of ["ready", "implemented"]) {
    const findings = checkSpec({ text: specText({ status, files: [] }), path: "spec.md", tasks, specs: [] })
    assert.ok(findings.some((f) => f.rule === "files-empty"), status)
  }
})

test("a dangling task is a finding", () => {
  const findings = checkSpec({
    text: specText({ task: "TASK-999" }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => f.rule), ["task-dangling"])
  assert.match(findings[0].message, /task-999/)
})

// `backlog task archive` moves every Done task in one commit. The queue is
// process metadata, not implementation scope, so a move must not read as a
// touched-but-undeclared file (it produced 66 errors on 2026-11-08).
test("moving backlog tasks is not a scope violation", () => {
  const findings = checkSpec({
    text: specText({ files: ["scripts/a.mjs"] }),
    path: "spec.md",
    diff: [
      "scripts/a.mjs",
      "backlog/tasks/task-7 - gone.md",
      "backlog/archive/tasks/task-7 - gone.md",
    ],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings, [])
})

test("a ready spec without task is a finding", () => {
  const findings = checkSpec({
    text: specText({ task: null }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.ok(findings.some((f) => f.rule === "task-missing"))
})

test("depends_on and blocks must resolve", () => {
  const findings = checkSpec({
    text: specText({ depends: ["SPEC-9999"], blocks: ["SPEC-9998"] }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => f.rule).sort(), ["blocks-dangling", "depends_on-dangling"])
})

test("blocks must be acknowledged by the blocked spec", () => {
  const findings = checkSpec({
    text: specText({ blocks: ["SPEC-0002"] }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: corpus([
      { id: "SPEC-0001", status: "ready", depends_on: [], blocks: ["SPEC-0002"] },
      { id: "SPEC-0002", status: "ready", depends_on: [], blocks: [] },
    ]),
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "blocks-asymmetric"]])
})

test("a dependency must be mirrored by the target's blocks", () => {
  const findings = checkSpec({
    text: specText({ depends: ["SPEC-0002"] }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: corpus([
      { id: "SPEC-0001", status: "ready", depends_on: ["SPEC-0002"], blocks: [] },
      { id: "SPEC-0002", status: "ready", depends_on: [], blocks: [] },
    ]),
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "depends_on-asymmetric"]])
})

test("a dependency on a spec that declares other blockers must be listed", () => {
  const findings = checkSpec({
    text: specText({ depends: ["SPEC-0002"] }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: corpus([
      { id: "SPEC-0001", status: "ready", depends_on: ["SPEC-0002"], blocks: [] },
      { id: "SPEC-0002", status: "ready", depends_on: [], blocks: ["SPEC-0003"] },
    ]),
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "depends_on-asymmetric"]])
})

test("an implemented spec may not keep the placeholder", () => {
  const findings = checkSpec({
    text: specText({ status: "implemented", results: "_Filled during implementation._" }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.ok(findings.some((f) => f.rule === "implemented-placeholder"))
})

test("an implemented spec needs a non-empty Results", () => {
  const findings = checkSpec({
    text: specText({ status: "implemented", results: "" }),
    path: "spec.md",
    diff: ["a.md"],
    tasks,
    specs: [],
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "implemented-results-empty"]])
})

test("a ready spec needs a task, files and at least one AC", () => {
  const findings = checkSpec({
    text: specText({ task: null, files: [], ac: false }),
    path: "spec.md",
    specs: [],
  })
  assert.deepEqual(findings.map((f) => f.rule).sort(), ["files-empty", "ready-no-ac", "task-missing"])
})

test("frontmatter reads scalars, inline and block lists", () => {
  const { data } = parseFrontmatter("---\nid: SPEC-0001\nfiles:\n  - a.md\nblocks: []\ndepends_on:\n  - SPEC-0002\n---\n")
  assert.equal(data.id, "SPEC-0001")
  assert.deepEqual(data.files, ["a.md"])
  assert.deepEqual(data.blocks, [])
  assert.deepEqual(data.depends_on, ["SPEC-0002"])
})

test("paths and ids normalise to the same spec reference", () => {
  assert.equal(specRef("docs/specs/active/SPEC-0018-eval-invariants.md"), "SPEC-0018")
  assert.equal(specRef("SPEC-0018"), "SPEC-0018")
  assert.equal(taskNumber("TASK-49"), "49")
  assert.equal(acceptanceCount("## Acceptance Criteria\n\n1. a\n2. b\n\n## Results\n"), 2)
})

test("the CLI exits 1 and --json matches the text finding", () => {
  const dir = mkdtempSync(join(tmpdir(), "speccheck-cli-"))
  try {
    const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
    git("init", "-q")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    mkdirSync(join(dir, "backlog", "tasks"), { recursive: true })
    writeFileSync(join(dir, "backlog", "tasks", "task-1 - demo.md"), "# task\n")
    writeFileSync(join(dir, "a.md"), "a\n")
    writeFileSync(join(dir, "spec.md"), specText({ files: ["a.md"] }))
    git("add", ".")
    git("commit", "-qm", "base")

    writeFileSync(join(dir, "a.md"), "a changed\n")
    writeFileSync(join(dir, "b.md"), "b\n")
    git("add", ".")
    git("commit", "-qm", "change")

    const text = spawnSync(process.execPath, [cli, "--spec", "spec.md", "--base", "HEAD~1"], {
      cwd: dir,
      encoding: "utf8",
    })
    assert.equal(text.status, 1)
    assert.match(text.stdout, /files-touched-undeclared/)

    const json = spawnSync(process.execPath, [cli, "--spec", "spec.md", "--base", "HEAD~1", "--json"], {
      cwd: dir,
      encoding: "utf8",
    })
    assert.equal(json.status, 1)
    const parsed = JSON.parse(json.stdout)
    assert.deepEqual(parsed.findings.map((f) => f.rule), ["files-touched-undeclared"])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("the CLI reads non-ASCII paths from git diff -z", () => {
  const dir = mkdtempSync(join(tmpdir(), "speccheck-unicode-"))
  try {
    const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
    git("init", "-q")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    mkdirSync(join(dir, "backlog", "tasks"), { recursive: true })
    writeFileSync(join(dir, "backlog", "tasks", "task-1 - demo.md"), "# task\n")
    writeFileSync(join(dir, "中.md"), "x\n")
    writeFileSync(join(dir, "spec.md"), specText({ files: ["中.md"] }))
    git("add", ".")
    git("commit", "-qm", "base")

    writeFileSync(join(dir, "中.md"), "changed\n")
    git("add", ".")
    git("commit", "-qm", "change")

    const result = spawnSync(process.execPath, [cli, "--spec", "spec.md", "--base", "HEAD~1"], {
      cwd: dir,
      encoding: "utf8",
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stdout, /contract holds/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("an option without a value is a usage error, not a missing spec", () => {
  const result = spawnSync(process.execPath, [cli, "--spec", "--base", "main"], { encoding: "utf8" })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /--spec requires a value/)
})
