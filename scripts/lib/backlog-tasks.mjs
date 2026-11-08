// backlog-tasks.mjs — where a task file lives.
//
// `backlog task archive` moves a Done task from `backlog/tasks/` to
// `backlog/archive/tasks/` without renaming it. A spec's `task:` keeps pointing
// at that id forever, so any resolver that looks only at the active queue reports
// a live spec as dangling the moment its task is archived (five specs did, on
// 2026-11-08). Both directories are the corpus.

import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

/** The directories that hold task files, in resolution order. */
export function taskDirs(root) {
  return [join(root, "backlog", "tasks"), join(root, "backlog", "archive", "tasks")]
}

/**
 * Every task filename under `root`, active and archived.
 *
 * @param {string} root
 * @returns {string[]} bare filenames, e.g. `task-7 - the title.md`
 */
export function taskFileNames(root) {
  const names = []
  for (const dir of taskDirs(root)) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".md")) names.push(name)
    }
  }
  return names
}
