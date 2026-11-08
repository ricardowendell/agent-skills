import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { taskDirs, taskFileNames } from "./backlog-tasks.mjs"

// `backlog task archive` moves a Done task out of backlog/tasks. A spec keeps
// its `task:` forever, so the resolver has to read both directories or every
// archived task turns its spec into a false `task-dangling` (2026-11-08).
function root(withArchive = true) {
  const dir = mkdtempSync(join(tmpdir(), "backlog-tasks-"))
  mkdirSync(join(dir, "backlog", "tasks"), { recursive: true })
  writeFileSync(join(dir, "backlog", "tasks", "task-7 - active.md"), "# t\n")
  if (withArchive) {
    mkdirSync(join(dir, "backlog", "archive", "tasks"), { recursive: true })
    writeFileSync(join(dir, "backlog", "archive", "tasks", "task-3 - archived.md"), "# t\n")
    writeFileSync(join(dir, "backlog", "archive", "tasks", "notes.txt"), "ignored\n")
  }
  return dir
}

test("both the active queue and the archive are the task corpus", () => {
  const names = taskFileNames(root())
  assert.deepEqual(names.sort(), ["task-3 - archived.md", "task-7 - active.md"])
})

test("a missing archive is not an error", () => {
  assert.deepEqual(taskFileNames(root(false)), ["task-7 - active.md"])
})

test("a missing backlog directory yields nothing instead of throwing", () => {
  const dir = mkdtempSync(join(tmpdir(), "backlog-tasks-empty-"))
  assert.deepEqual(taskFileNames(dir), [])
})

test("the resolution order names the active queue first", () => {
  const dirs = taskDirs("/repo")
  assert.deepEqual(dirs, ["/repo/backlog/tasks", "/repo/backlog/archive/tasks"])
})
